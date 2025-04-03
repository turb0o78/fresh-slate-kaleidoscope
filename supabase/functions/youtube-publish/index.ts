
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

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
      // Ici, implémenter la publication réelle via l'API YouTube
      // NOTE: Cette partie nécessite les identifiants réels pour l'API YouTube
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Publication YouTube en mode réel non implémentée", 
      }), {
        status: 501,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
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
