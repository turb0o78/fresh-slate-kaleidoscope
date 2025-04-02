
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Configuration Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

// Headers CORS
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
    const { platform, mediaUrl, caption, connection_id, page_id } = body;

    if (!platform || !mediaUrl) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialiser le client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les informations de connexion
    const { data: connections } = await supabase
      .from('social_connections')
      .select('*')
      .eq('platform', platform);

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ error: `Aucune connexion trouvée pour ${platform}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let connection;
    if (platform === 'facebook') {
      // Pour Facebook, nous avons besoin de l'ID de la page
      if (!page_id) {
        return new Response(
          JSON.stringify({ error: "ID de page Facebook requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Chercher la connexion avec la page spécifiée
      connection = connections.find(conn => {
        return conn.metadata?.pages?.some((page: any) => page.id === page_id);
      });
      
      if (!connection) {
        return new Response(
          JSON.stringify({ error: "Page Facebook non trouvée" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Trouver le token d'accès spécifique à cette page
      const page = connection.metadata.pages.find((p: any) => p.id === page_id);
      const accessToken = page.access_token;
      
      // Publier sur Facebook
      const result = await publishToFacebook(page_id, accessToken, mediaUrl, caption);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, post_id: result.post_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (platform === 'instagram') {
      // Pour Instagram, nous avons besoin de l'ID de connexion
      connection = connections.find(conn => conn.platform_user_id === connection_id);
      
      if (!connection) {
        return new Response(
          JSON.stringify({ error: "Compte Instagram non trouvé" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Publier sur Instagram
      const result = await publishToInstagram(connection.platform_user_id, connection.access_token, mediaUrl, caption);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, post_id: result.post_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Plateforme non supportée" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erreur dans meta-publish:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fonction pour publier sur Facebook
async function publishToFacebook(pageId: string, accessToken: string, mediaUrl: string, caption: string) {
  try {
    let endpoint = '';
    let params = {};
    
    // Détecter le type de média pour choisir l'endpoint approprié
    const mediaExt = mediaUrl.split('.').pop()?.toLowerCase();
    
    if (mediaExt && ['jpg', 'jpeg', 'png', 'gif'].includes(mediaExt)) {
      // Publication d'une image
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      params = {
        url: mediaUrl,
        caption: caption || '',
        access_token: accessToken
      };
    } else if (mediaExt && ['mp4', 'mov', 'avi', 'wmv'].includes(mediaExt)) {
      // Publication d'une vidéo
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/videos`;
      params = {
        file_url: mediaUrl,
        description: caption || '',
        access_token: accessToken
      };
    } else {
      // Publication de texte uniquement
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      params = {
        message: caption || '',
        access_token: accessToken
      };
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("Erreur lors de la publication sur Facebook:", data.error);
      return { success: false, error: data.error.message };
    }
    
    return { success: true, post_id: data.id };
  } catch (error) {
    console.error("Erreur lors de la publication sur Facebook:", error);
    return { success: false, error: error.message };
  }
}

// Fonction pour publier sur Instagram
async function publishToInstagram(igUserId: string, accessToken: string, mediaUrl: string, caption: string) {
  try {
    const mediaExt = mediaUrl.split('.').pop()?.toLowerCase();
    
    if (!mediaExt) {
      return { success: false, error: "Type de média non détecté" };
    }
    
    // Déterminer le type de média pour Instagram
    let mediaType;
    if (['jpg', 'jpeg', 'png'].includes(mediaExt)) {
      mediaType = 'IMAGE';
    } else if (['mp4', 'mov'].includes(mediaExt)) {
      mediaType = 'VIDEO';
    } else {
      return { success: false, error: "Format de média non supporté par Instagram" };
    }
    
    // 1. Créer un conteneur média
    let containerEndpoint;
    let containerParams;
    
    if (mediaType === 'IMAGE') {
      containerEndpoint = `https://graph.facebook.com/v19.0/${igUserId}/media`;
      containerParams = {
        image_url: mediaUrl,
        caption: caption || '',
        access_token: accessToken
      };
    } else {
      containerEndpoint = `https://graph.facebook.com/v19.0/${igUserId}/media`;
      containerParams = {
        media_type: 'VIDEO',
        video_url: mediaUrl,
        caption: caption || '',
        access_token: accessToken
      };
    }
    
    const containerResponse = await fetch(containerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(containerParams)
    });
    
    const containerData = await containerResponse.json();
    
    if (containerData.error) {
      console.error("Erreur lors de la création du conteneur média Instagram:", containerData.error);
      return { success: false, error: containerData.error.message };
    }
    
    // 2. Publier le média
    const publishEndpoint = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
    const publishParams = {
      creation_id: containerData.id,
      access_token: accessToken
    };
    
    // Pour les vidéos, nous devons attendre que le média soit prêt
    if (mediaType === 'VIDEO') {
      let statusEndpoint = `https://graph.facebook.com/v19.0/${containerData.id}?fields=status_code&access_token=${accessToken}`;
      let mediaReady = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!mediaReady && attempts < maxAttempts) {
        const statusResponse = await fetch(statusEndpoint);
        const statusData = await statusResponse.json();
        
        if (statusData.status_code === 'FINISHED') {
          mediaReady = true;
        } else if (statusData.status_code === 'ERROR') {
          return { success: false, error: "Erreur lors du traitement de la vidéo" };
        } else {
          // Attendre avant la prochaine vérification
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
      }
      
      if (!mediaReady) {
        return { success: false, error: "Le traitement de la vidéo a pris trop de temps" };
      }
    }
    
    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(publishParams)
    });
    
    const publishData = await publishResponse.json();
    
    if (publishData.error) {
      console.error("Erreur lors de la publication sur Instagram:", publishData.error);
      return { success: false, error: publishData.error.message };
    }
    
    return { success: true, post_id: publishData.id };
  } catch (error) {
    console.error("Erreur lors de la publication sur Instagram:", error);
    return { success: false, error: error.message };
  }
}
