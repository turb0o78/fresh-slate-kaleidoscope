
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Configuration Supabase et Meta
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
const FACEBOOK_APP_ID = '990797112672585';
const FACEBOOK_APP_SECRET = '8cc56867f327203d95ab8c7ffb88825f';
const INSTAGRAM_APP_ID = '525008276969587';
const INSTAGRAM_APP_SECRET = 'ece5c125352cfce4f0a8b1fe2b1ba4a2';

// Headers CORS pour les requêtes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { code, platform, redirect_uri } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Code d'autorisation requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialiser le client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Échanger le code contre un token selon la plateforme
    let tokenData;
    if (platform === 'facebook') {
      tokenData = await exchangeFacebookCode(code, redirect_uri);
    } else if (platform === 'instagram') {
      tokenData = await exchangeInstagramCode(code, redirect_uri);
    } else {
      return new Response(
        JSON.stringify({ error: "Plateforme non supportée" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokenData || tokenData.error) {
      return new Response(
        JSON.stringify({ error: tokenData?.error || "Échec de l'échange du code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les informations de l'utilisateur connecté
    const userData = await getUserInfo(tokenData.access_token, platform);
    
    // Récupérer l'ID de l'utilisateur authentifié
    const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1]);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enregistrer ou mettre à jour la connexion dans la base de données
    const { data: connectionData, error: connectionError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: user.id,
        platform: platform,
        platform_user_id: userData.id,
        platform_username: userData.name || userData.username,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        metadata: {
          ...userData,
          token_expires_at: tokenData.expires_in ? new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString() : null
        }
      })
      .select()
      .single();

    if (connectionError) {
      console.error("Erreur lors de l'enregistrement de la connexion:", connectionError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement de la connexion" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Si c'est Facebook, récupérer également les pages
    if (platform === 'facebook') {
      await getFacebookPages(tokenData.access_token, user.id, connectionData.id);
    }

    return new Response(
      JSON.stringify({ success: true, connection: connectionData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur dans meta-auth:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fonction pour échanger le code Facebook contre un token
async function exchangeFacebookCode(code: string, redirectUri: string) {
  try {
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;
    
    const response = await fetch(tokenUrl);
    const data = await response.json();
    
    if (data.error) {
      console.error("Erreur lors de l'échange du code Facebook:", data.error);
      return { error: data.error.message };
    }
    
    return data;
  } catch (error) {
    console.error("Erreur lors de l'échange du code Facebook:", error);
    return { error: error.message };
  }
}

// Fonction pour échanger le code Instagram contre un token
async function exchangeInstagramCode(code: string, redirectUri: string) {
  try {
    const tokenUrl = `https://api.instagram.com/oauth/access_token`;
    
    const formData = new FormData();
    formData.append('client_id', INSTAGRAM_APP_ID);
    formData.append('client_secret', INSTAGRAM_APP_SECRET);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("Erreur lors de l'échange du code Instagram:", data.error);
      return { error: data.error.message };
    }
    
    // Obtenir le token de longue durée pour Instagram
    const longLivedToken = await exchangeForLongLivedToken(data.access_token);
    return longLivedToken;
  } catch (error) {
    console.error("Erreur lors de l'échange du code Instagram:", error);
    return { error: error.message };
  }
}

// Fonction pour échanger le token court contre un token long pour Instagram
async function exchangeForLongLivedToken(shortLivedToken: string) {
  try {
    const tokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`;
    
    const response = await fetch(tokenUrl);
    const data = await response.json();
    
    if (data.error) {
      console.error("Erreur lors de l'échange pour un token longue durée:", data.error);
      return { error: data.error.message };
    }
    
    return data;
  } catch (error) {
    console.error("Erreur lors de l'échange pour un token longue durée:", error);
    return { error: error.message };
  }
}

// Fonction pour récupérer les informations de l'utilisateur
async function getUserInfo(accessToken: string, platform: string) {
  try {
    let url;
    if (platform === 'facebook') {
      url = `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${accessToken}`;
    } else if (platform === 'instagram') {
      url = `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`;
    } else {
      throw new Error("Plateforme non supportée");
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("Erreur lors de la récupération des informations utilisateur:", data.error);
      throw new Error(data.error.message);
    }
    
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des informations utilisateur:", error);
    throw error;
  }
}

// Fonction pour récupérer les pages Facebook
async function getFacebookPages(accessToken: string, userId: string, connectionId: string) {
  try {
    // Récupérer les pages
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category&access_token=${accessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();
    
    if (pagesData.error) {
      console.error("Erreur lors de la récupération des pages Facebook:", pagesData.error);
      throw new Error(pagesData.error.message);
    }
    
    // Pour chaque page, récupérer l'Instagram Business Account associé si disponible
    for (const page of pagesData.data) {
      try {
        const igAccountUrl = `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
        const igAccountResponse = await fetch(igAccountUrl);
        const igAccountData = await igAccountResponse.json();
        
        if (!igAccountData.error && igAccountData.instagram_business_account) {
          page.instagram_business_account = igAccountData.instagram_business_account;
          
          // Obtenir des informations supplémentaires sur le compte Instagram
          const igInfoUrl = `https://graph.facebook.com/v19.0/${igAccountData.instagram_business_account.id}?fields=id,username&access_token=${page.access_token}`;
          const igInfoResponse = await fetch(igInfoUrl);
          const igInfoData = await igInfoResponse.json();
          
          if (!igInfoData.error) {
            page.instagram_business_account.username = igInfoData.username;
          }
        }
      } catch (igError) {
        console.error("Erreur lors de la récupération du compte Instagram Business:", igError);
        // Ne pas bloquer le processus, continuer avec les autres pages
      }
    }
    
    // Initialiser le client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Mettre à jour la connexion Facebook avec les pages récupérées
    const { error } = await supabase
      .from('social_connections')
      .update({
        metadata: {
          pages: pagesData.data
        }
      })
      .eq('id', connectionId);
    
    if (error) {
      console.error("Erreur lors de la mise à jour des pages Facebook:", error);
    }
    
    // Si des comptes Instagram Business sont trouvés, créer des connexions Instagram
    for (const page of pagesData.data) {
      if (page.instagram_business_account) {
        try {
          // Vérifier si une connexion Instagram existe déjà
          const { data: existingConnection } = await supabase
            .from('social_connections')
            .select('id')
            .eq('user_id', userId)
            .eq('platform', 'instagram')
            .eq('platform_user_id', page.instagram_business_account.id)
            .single();
          
          // Si la connexion n'existe pas déjà, la créer
          if (!existingConnection) {
            await supabase
              .from('social_connections')
              .insert({
                user_id: userId,
                platform: 'instagram',
                platform_user_id: page.instagram_business_account.id,
                platform_username: page.instagram_business_account.username,
                access_token: page.access_token,
                metadata: {
                  connected_via_facebook: true,
                  facebook_page_id: page.id,
                  facebook_page_name: page.name
                }
              });
          }
        } catch (igConnError) {
          console.error("Erreur lors de la création de la connexion Instagram:", igConnError);
          // Ne pas bloquer le processus, continuer avec les autres pages
        }
      }
    }
    
    return pagesData.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des pages Facebook:", error);
    throw error;
  }
}
