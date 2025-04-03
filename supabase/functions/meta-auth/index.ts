
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Configuration Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

// Configuration des accès Meta
const FACEBOOK_CLIENT_ID = Deno.env.get("FACEBOOK_CLIENT_ID") || '';
const FACEBOOK_CLIENT_SECRET = Deno.env.get("FACEBOOK_CLIENT_SECRET") || '';
const INSTAGRAM_CLIENT_ID = Deno.env.get("INSTAGRAM_CLIENT_ID") || '';
const INSTAGRAM_CLIENT_SECRET = Deno.env.get("INSTAGRAM_CLIENT_SECRET") || '';

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const requestData = await req.json();
    const { code, platform, redirect_uri } = requestData;

    if (!code || !platform) {
      throw new Error("Missing required parameters");
    }

    if (platform !== 'facebook' && platform !== 'instagram') {
      throw new Error("Unsupported platform");
    }

    console.log(`Processing ${platform} OAuth callback with code: ${code}`);

    // Sélectionner les identifiants en fonction de la plateforme
    const clientId = platform === 'facebook' ? FACEBOOK_CLIENT_ID : INSTAGRAM_CLIENT_ID;
    const clientSecret = platform === 'facebook' ? FACEBOOK_CLIENT_SECRET : INSTAGRAM_CLIENT_SECRET;

    // Échanger le code contre un token d'accès
    console.log("Exchanging code for access token...");
    const tokenUrl = "https://graph.facebook.com/v19.0/oauth/access_token";
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
      code
    });

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams.toString()}`, {
      method: "GET"
    });

    const tokenData = await tokenResponse.json();
    console.log("Token response:", tokenData);

    if (tokenData.error) {
      throw new Error(`Error getting access token: ${tokenData.error.message}`);
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error("No access token received");
    }

    // Récupérer les informations de l'utilisateur
    console.log("Getting user profile...");
    const profileUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${accessToken}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();
    console.log("Profile data:", profileData);

    if (profileData.error) {
      throw new Error(`Error getting profile: ${profileData.error.message}`);
    }

    const userId = profileData.id;
    const userName = profileData.name || '';

    let connectionData: any = {
      platform,
      platform_user_id: userId,
      platform_username: userName,
      access_token: accessToken,
      metadata: { profile: profileData }
    };

    // Si c'est Facebook, récupérer les pages que l'utilisateur peut gérer
    if (platform === 'facebook') {
      console.log("Getting Facebook pages...");
      const pagesUrl = `https://graph.facebook.com/v19.0/${userId}/accounts?fields=id,name,access_token,category&access_token=${accessToken}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();
      console.log("Pages data:", pagesData);

      if (!pagesData.error) {
        connectionData.metadata.pages = pagesData.data;
      }
    }

    // Si c'est Instagram, rechercher les comptes Instagram Business associés
    if (platform === 'instagram') {
      console.log("Getting Instagram Business accounts...");
      
      // D'abord on récupère les pages Facebook (qui sont liées aux comptes Instagram Business)
      const pagesUrl = `https://graph.facebook.com/v19.0/${userId}/accounts?fields=id,instagram_business_account{id,name,username}&access_token=${accessToken}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.error && pagesData.data) {
        // Filtrer les pages qui ont un compte Instagram Business associé
        const instagramAccounts = [];
        for (const page of pagesData.data) {
          if (page.instagram_business_account) {
            // Pour chaque compte Instagram, récupérer plus de détails
            const igAccountId = page.instagram_business_account.id;
            const igUrl = `https://graph.facebook.com/v19.0/${igAccountId}?fields=id,name,username,profile_picture_url&access_token=${accessToken}`;
            const igResponse = await fetch(igUrl);
            const igData = await igResponse.json();
            
            if (!igResponse.error) {
              instagramAccounts.push({
                ...igData,
                page_id: page.id,
                page_name: page.name,
                page_token: page.access_token
              });
            }
          }
        }
        
        connectionData.metadata.instagram_accounts = instagramAccounts;
      }
    }

    // Sauvegarder la connexion dans la base de données
    console.log("Saving connection to database...");
    const { data, error } = await supabase
      .from('social_connections')
      .upsert({
        user_id: requestData.user_id,
        ...connectionData
      }, {
        onConflict: 'user_id, platform'
      })
      .select('*');
      
    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${platform} account connected successfully`,
      connection: data?.[0] || connectionData
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200
    });

  } catch (error) {
    console.error("Error in meta-auth function:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500
    });
  }
});
