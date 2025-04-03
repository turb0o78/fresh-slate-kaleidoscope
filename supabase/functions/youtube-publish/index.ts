
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { google } from "npm:googleapis@126.0.1";

// Récupération des variables d'environnement
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
const youtubeClientId = Deno.env.get("YOUTUBE_CLIENT_ID") || '';
const youtubeClientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET") || '';

// Vérification des variables d'environnement
console.log("YouTube Publisher function initialized");
console.log("YouTube client ID configured:", !!youtubeClientId);
console.log("YouTube client secret configured:", !!youtubeClientSecret);

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les données de la requête
    const { mediaUrl, title, description, connectionId, sandboxMode } = await req.json();
    
    console.log("Tentative de publication sur YouTube", { 
      mediaUrl, 
      title: title?.substring(0, 20) + "...", 
      description: description?.substring(0, 20) + "...", 
      sandboxMode 
    });
    
    // Si aucun média n'est fourni, renvoyer une erreur
    if (!mediaUrl) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Aucun média fourni pour la publication" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // En mode sandbox, simuler une publication réussie
    if (sandboxMode) {
      console.log("Publication YouTube en mode sandbox - Simulation de succès");
      
      // Générer un ID de publication fictif
      const fakeVideoId = "youtube_" + Math.random().toString(36).substring(2);
      
      // Créer un post dans la base de données en mode sandbox
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          status: 'published',
          content: description || "Vidéo publiée depuis l'application",
          media_urls: [mediaUrl],
          user_id: connectionId.split('_')[0], // Extraire l'ID utilisateur du connectionId
          platform_post_ids: { youtube: fakeVideoId },
        })
        .select()
        .single();
        
      if (postError) {
        console.error("Erreur lors de la création du post sandbox:", postError);
        throw postError;
      }
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return new Response(JSON.stringify({
        success: true,
        post_id: fakeVideoId,
        youtube_url: `https://www.youtube.com/watch?v=${fakeVideoId}`,
        sandbox: true,
        post: post
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } else {
      console.log("Initialisation de l'API YouTube");
      
      // Récupérer les identifiants de connexion de l'utilisateur
      const { data: connection, error: connectionError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('platform_user_id', connectionId)
        .eq('platform', 'youtube')
        .single();
        
      if (connectionError) {
        console.error("Erreur lors de la récupération de la connexion:", connectionError);
        throw new Error("Impossible de trouver la connexion YouTube");
      }
      
      const oauth2Client = new google.auth.OAuth2(
        youtubeClientId,
        youtubeClientSecret,
        Deno.env.get("VITE_YOUTUBE_REDIRECT_URI") || "http://localhost:3000/dashboard/connections"
      );
      
      // Configurer les identifiants OAuth
      oauth2Client.setCredentials({
        access_token: connection.access_token,
        refresh_token: connection.refresh_token
      });
      
      // Initialiser l'API YouTube
      const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
      });
      
      console.log("Récupération du fichier vidéo");
      
      // Télécharger le fichier vidéo depuis l'URL
      const videoResponse = await fetch(mediaUrl);
      if (!videoResponse.ok) {
        throw new Error(`Erreur lors du téléchargement de la vidéo: ${videoResponse.status}`);
      }
      
      const videoBuffer = await videoResponse.arrayBuffer();
      const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });
      
      console.log("Préparation de l'upload YouTube");
      
      // Créer un readable stream à partir du blob
      const reader = videoBlob.stream().getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const videoData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      
      chunks.forEach(chunk => {
        videoData.set(chunk, offset);
        offset += chunk.length;
      });
      
      // Upload de la vidéo sur YouTube
      console.log("Démarrage de l'upload YouTube");
      
      try {
        const res = await youtube.videos.insert({
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title: title || "Vidéo sans titre",
              description: description || "",
              tags: ["cross-posted"]
            },
            status: {
              privacyStatus: "public" // ou "private", "unlisted"
            }
          },
          media: {
            body: videoData
          }
        });
        
        console.log("Upload YouTube réussi, ID:", res.data.id);
        
        // Créer un post dans la base de données
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert({
            status: 'published',
            content: description || "Vidéo publiée depuis l'application",
            media_urls: [mediaUrl],
            user_id: connection.user_id,
            platform_post_ids: { youtube: res.data.id }
          })
          .select()
          .single();
          
        if (postError) {
          console.error("Erreur lors de la création du post:", postError);
          throw postError;
        }
        
        return new Response(JSON.stringify({
          success: true,
          post_id: res.data.id,
          youtube_url: `https://www.youtube.com/watch?v=${res.data.id}`,
          post: post
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
        
      } catch (uploadError) {
        console.error("Erreur lors de l'upload YouTube:", uploadError);
        throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la publication YouTube:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Une erreur est survenue lors de la publication" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
