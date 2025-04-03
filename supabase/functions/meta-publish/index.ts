
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Configuration Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

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
    const { platform, mediaUrl, caption, connection_id, page_id } = requestData;

    if (!platform || !connection_id) {
      throw new Error("Missing required parameters: platform and connection_id are required");
    }

    if (platform !== 'facebook' && platform !== 'instagram') {
      throw new Error("Unsupported platform");
    }

    console.log(`Processing ${platform} publication request for connection ID: ${connection_id}`);

    // Récupérer les informations de connexion
    const { data: connections, error: connectionError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('platform_user_id', connection_id)
      .eq('platform', platform);

    if (connectionError || !connections || connections.length === 0) {
      throw new Error(`Connection not found: ${connectionError?.message || 'No connection data'}`);
    }

    const connection = connections[0];
    const accessToken = connection.access_token;

    if (!accessToken) {
      throw new Error("No access token available");
    }

    // Publication sur la plateforme appropriée
    if (platform === 'facebook') {
      return await publishToFacebook(accessToken, page_id, mediaUrl, caption);
    } else {
      return await publishToInstagram(accessToken, connection_id, mediaUrl, caption);
    }

  } catch (error) {
    console.error("Error in meta-publish function:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500
    });
  }
});

async function publishToFacebook(accessToken: string, pageId: string, mediaUrl?: string, caption?: string) {
  console.log(`Publishing to Facebook page ${pageId}`);

  // Récupérer d'abord le token d'accès spécifique à la page
  const pageTokenUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${accessToken}`;
  const tokenResponse = await fetch(pageTokenUrl);
  const tokenData = await tokenResponse.json();
  
  if (tokenData.error) {
    throw new Error(`Error getting page access token: ${tokenData.error.message}`);
  }
  
  const pageToken = tokenData.access_token;
  
  if (!pageToken) {
    throw new Error("Could not get page access token");
  }

  let endpoint = `https://graph.facebook.com/v19.0/${pageId}/`;
  let params: any = {};
  let method = "POST";
  
  if (mediaUrl) {
    // Si nous avons une image/vidéo
    if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
      endpoint += 'videos';
      params = {
        description: caption || '',
        file_url: mediaUrl,
        access_token: pageToken
      };
    } else {
      endpoint += 'photos';
      params = {
        caption: caption || '',
        url: mediaUrl,
        access_token: pageToken
      };
    }
  } else {
    // Publication texte uniquement
    endpoint += 'feed';
    params = {
      message: caption || '',
      access_token: pageToken
    };
  }

  console.log(`Facebook API endpoint: ${endpoint}`);
  console.log("Publication params:", params);

  // Créer les paramètres de requête
  const urlSearchParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    urlSearchParams.append(key, params[key]);
  });

  const response = await fetch(endpoint, {
    method: method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: urlSearchParams.toString()
  });

  const result = await response.json();
  console.log("Facebook API response:", result);

  if (result.error) {
    throw new Error(`Facebook API error: ${result.error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    post_id: result.id,
    platform: 'facebook'
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status: 200
  });
}

async function publishToInstagram(accessToken: string, igUserId: string, mediaUrl?: string, caption?: string) {
  console.log(`Publishing to Instagram user ${igUserId}`);

  if (!mediaUrl) {
    throw new Error("Media URL is required for Instagram posts");
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  try {
    // 1. Créer un conteneur média
    console.log("Creating Instagram media container...");
    const createParams = new URLSearchParams({
      image_url: mediaUrl,
      caption: caption || '',
      access_token: accessToken,
    });

    const createMediaUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
    console.log(`Instagram create media endpoint: ${createMediaUrl}`);

    const mediaResponse = await fetch(createMediaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: createParams.toString()
    });

    const mediaData = await mediaResponse.json();
    console.log("Instagram create media response:", mediaData);
    
    if (mediaData.error) {
      throw new Error(`Instagram API error: ${mediaData.error.message}`);
    }

    const mediaId = mediaData.id;

    // 2. Publier le média
    console.log(`Publishing Instagram media with creation ID: ${mediaId}`);
    const publishParams = new URLSearchParams({
      creation_id: mediaId,
      access_token: accessToken,
    });

    const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: publishParams.toString()
    });

    const publishData = await publishResponse.json();
    console.log("Instagram publish response:", publishData);

    if (publishData.error) {
      throw new Error(`Instagram API publish error: ${publishData.error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      post_id: publishData.id,
      platform: 'instagram'
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200
    });
  } catch (error) {
    console.error("Error publishing to Instagram:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500
    });
  }
}
