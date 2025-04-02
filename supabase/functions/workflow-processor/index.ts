
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
    // Initialiser le client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les entrées en attente de la file de workflow
    const { data: queueItems, error: queueError } = await supabase
      .from('workflow_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (queueError) {
      throw queueError;
    }
    
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: "Aucun item en attente dans la file" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    console.log(`Processing ${queueItems.length} workflow queue items`);
    
    const results = [];
    
    // Traiter chaque élément de la file
    for (const item of queueItems) {
      try {
        console.log(`Processing workflow queue item: ${item.id}`);
        
        // Mettre à jour le statut en "processing"
        const { error: updateError } = await supabase
          .from('workflow_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // Récupérer les détails du workflow
        const { data: workflow, error: workflowError } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', item.workflow_id)
          .single();
        
        if (workflowError || !workflow) {
          throw workflowError || new Error("Workflow non trouvé");
        }
        
        // Récupérer le contenu source
        let sourceContent;
        let sourceMedia;
        
        if (item.source_platform === 'tiktok') {
          // Récupérer la vidéo TikTok téléchargée
          const { data: downloadedVideo, error: videoError } = await supabase
            .from('downloaded_videos')
            .select('*')
            .eq('tiktok_video_id', item.platform_media_id)
            .single();
          
          if (videoError || !downloadedVideo) {
            throw videoError || new Error("Vidéo TikTok non trouvée");
          }
          
          const { data: publicUrl } = await supabase.storage
            .from('media')
            .getPublicUrl(downloadedVideo.storage_path);
          
          sourceMedia = publicUrl.publicUrl;
          sourceContent = item.metadata?.caption || "";
          
        } else if (item.source_platform === 'instagram' || item.source_platform === 'facebook') {
          // Pour Instagram et Facebook, les métadonnées contiennent déjà les informations nécessaires
          sourceContent = item.metadata?.caption || item.metadata?.message || "";
          sourceMedia = item.metadata?.media_url || "";
        }
        
        // Pour chaque plateforme cible, publier le contenu
        for (const targetPlatform of item.target_platforms) {
          try {
            let result;
            
            if (targetPlatform === 'facebook' || targetPlatform === 'instagram') {
              result = await republishToMeta(
                supabase, 
                workflow.user_id, 
                targetPlatform, 
                sourceMedia, 
                sourceContent
              );
            } else if (targetPlatform === 'tiktok') {
              // Publier sur TikTok (à implémenter)
              result = { success: false, error: "Publication sur TikTok non implémentée" };
            } else if (targetPlatform === 'youtube') {
              // Publier sur YouTube (à implémenter)
              result = { success: false, error: "Publication sur YouTube non implémentée" };
            }
            
            results.push({
              workflow_id: workflow.id,
              source_platform: item.source_platform,
              target_platform: targetPlatform,
              success: result?.success || false,
              error: result?.error || null,
              post_id: result?.post_id
            });
            
          } catch (targetError) {
            console.error(`Error publishing to ${targetPlatform}:`, targetError);
            results.push({
              workflow_id: workflow.id,
              source_platform: item.source_platform,
              target_platform: targetPlatform,
              success: false,
              error: targetError.message
            });
          }
        }
        
        // Marquer l'élément comme traité
        const { error: completedError } = await supabase
          .from('workflow_queue')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString(),
            result: results.filter(r => r.workflow_id === workflow.id)
          })
          .eq('id', item.id);
        
        if (completedError) {
          throw completedError;
        }
        
      } catch (itemError) {
        console.error(`Error processing queue item ${item.id}:`, itemError);
        
        // Marquer l'élément comme échoué
        await supabase
          .from('workflow_queue')
          .update({ 
            status: 'failed',
            error: itemError.message
          })
          .eq('id', item.id);
        
        results.push({
          workflow_id: item.workflow_id,
          error: itemError.message,
          success: false
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      processed: queueItems.length,
      results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
    
  } catch (error) {
    console.error("Error in workflow processor:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});

async function republishToMeta(
  supabase: any,
  userId: string,
  platform: 'facebook' | 'instagram',
  mediaUrl?: string,
  caption?: string
) {
  try {
    // Récupérer la connexion
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();
    
    if (connectionError || !connection) {
      throw connectionError || new Error(`${platform} connection not found`);
    }
    
    let pageId;
    // Pour Facebook, nous avons besoin de l'ID de la page
    if (platform === 'facebook') {
      if (!connection.metadata?.pages || connection.metadata.pages.length === 0) {
        throw new Error("Aucune page Facebook associée à ce compte");
      }
      pageId = connection.metadata.pages[0].id;
    }
    
    // Appeler la fonction de publication
    const { data, error } = await supabase.functions.invoke('meta-publish', {
      body: {
        platform,
        mediaUrl,
        caption,
        connection_id: connection.platform_user_id,
        page_id: pageId
      }
    });
    
    if (error) throw error;
    if (!data) throw new Error("Aucune donnée reçue de la fonction de publication");
    
    return data;
  } catch (error) {
    console.error(`Error republishing to ${platform}:`, error);
    throw error;
  }
}
