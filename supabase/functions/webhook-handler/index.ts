
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Configuration Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

// Vérification des secrets pour les webhooks
const META_WEBHOOK_SECRET = Deno.env.get("META_WEBHOOK_SECRET") || 'purposify_meta_webhook_secret_2024';
const TIKTOK_WEBHOOK_SECRET = Deno.env.get("TIKTOK_WEBHOOK_SECRET") || '';

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") || '';

    if (platform === 'meta') {
      return handleMetaWebhook(req, url);
    } else if (platform === 'tiktok') {
      return handleTikTokWebhook(req);
    } else {
      return new Response(JSON.stringify({ error: "Plateforme non spécifiée ou non supportée" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

const handleMetaWebhook = async (req: Request, url: URL): Promise<Response> => {
  // Vérification du webhook (endpoint challenge)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Log verification attempt
    console.log("Meta webhook verification attempt:", {
      mode,
      token,
      challenge,
      expectedToken: META_WEBHOOK_SECRET
    });

    // Vérifier que le token correspond à notre secret
    if (mode === "subscribe" && token === META_WEBHOOK_SECRET) {
      console.log("Meta webhook verified successfully");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders }
      });
    } else {
      console.error("Meta webhook verification failed");
      return new Response("Verification failed", {
        status: 403,
        headers: { ...corsHeaders }
      });
    }
  }
  
  // Traitement des notifications webhook
  if (req.method === "POST") {
    const body = await req.json();
    console.log("Meta webhook notification received:", JSON.stringify(body));

    // Initialiser le client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Vérifier si c'est une notification Instagram
    if (body.entry && body.entry.length > 0) {
      // Parcourir toutes les entrées
      for (const entry of body.entry) {
        if (entry.changes && entry.changes.length > 0) {
          // Parcourir tous les changements
          for (const change of entry.changes) {
            // Traitement pour Instagram Media
            if (change.field === 'media' && change.value) {
              await processInstagramMedia(supabase, change.value, entry.id);
            } 
            // Traitement pour Facebook Feed
            else if (change.field === 'feed' && change.value) {
              await processFacebookFeed(supabase, change.value, entry.id);
            }
          }
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  
  return new Response("Method not supported", {
    status: 405,
    headers: { ...corsHeaders }
  });
};

const handleTikTokWebhook = async (req: Request): Promise<Response> => {
  // Implémentation pour TikTok
  console.log("TikTok webhook received");
  
  // Traitement similaire à Meta mais adapté à TikTok
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
};

async function processInstagramMedia(supabase: any, mediaData: any, userId: string) {
  try {
    console.log(`Processing Instagram media ID: ${mediaData.id}`);
    
    // Stocker les métadonnées du média
    const { error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: mediaData.caption || '',
        media_urls: mediaData.media_url ? [mediaData.media_url] : [],
        platform_post_ids: { instagram: mediaData.id },
        status: 'published',
      });
    
    if (insertError) {
      console.error("Error storing Instagram media:", insertError);
      return;
    }
    
    // Trouver les workflows pour ce compte Instagram
    const { data: workflows } = await supabase
      .from('workflows')
      .select('*')
      .eq('source_platform', 'instagram')
      .eq('is_active', true);
    
    if (!workflows || workflows.length === 0) {
      console.log("No active workflows found for Instagram");
      return;
    }
    
    // Traiter chaque workflow
    for (const workflow of workflows) {
      try {
        // Vérifier si l'utilisateur Instagram correspond à un utilisateur de notre système
        const { data: connections } = await supabase
          .from('social_connections')
          .select('user_id')
          .eq('platform', 'instagram')
          .eq('platform_user_id', userId);
        
        if (!connections || connections.length === 0) {
          console.log(`No matching user found for Instagram ID: ${userId}`);
          continue;
        }
        
        const appUserId = connections[0].user_id;
        
        // Vérifier si ce workflow appartient à cet utilisateur
        if (workflow.user_id !== appUserId) {
          continue;
        }
        
        console.log(`Processing workflow ${workflow.id} for user ${appUserId}`);
        
        // Ajouter à la file de traitement pour ce workflow
        const { error: queueError } = await supabase
          .from('workflow_queue')
          .insert({
            workflow_id: workflow.id,
            source_platform: 'instagram',
            target_platforms: workflow.target_platforms,
            platform_media_id: mediaData.id,
            status: 'pending',
            metadata: mediaData
          });
        
        if (queueError) {
          console.error(`Error adding to queue for workflow ${workflow.id}:`, queueError);
        } else {
          console.log(`Media ${mediaData.id} added to workflow ${workflow.id}`);
        }
      } catch (workflowError) {
        console.error(`Error processing workflow ${workflow.id}:`, workflowError);
      }
    }
  } catch (error) {
    console.error("Error in processInstagramMedia:", error);
  }
}

async function processFacebookFeed(supabase: any, feedData: any, pageId: string) {
  try {
    console.log(`Processing Facebook feed item: ${feedData.post_id || 'unknown'}`);
    
    // Stocker les métadonnées du post
    let mediaUrls: string[] = [];
    if (feedData.link) mediaUrls.push(feedData.link);
    
    // Extraire les images/vidéos si disponibles
    if (feedData.attachments && feedData.attachments.data) {
      feedData.attachments.data.forEach((attachment: any) => {
        if (attachment.media && attachment.media.image && attachment.media.image.src) {
          mediaUrls.push(attachment.media.image.src);
        }
      });
    }
    
    const { error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: pageId,
        content: feedData.message || '',
        media_urls: mediaUrls,
        platform_post_ids: { facebook: feedData.post_id || feedData.id },
        status: 'published',
      });
    
    if (insertError) {
      console.error("Error storing Facebook post:", insertError);
      return;
    }
    
    // Trouver les workflows pour ce compte Facebook
    const { data: workflows } = await supabase
      .from('workflows')
      .select('*')
      .eq('source_platform', 'facebook')
      .eq('is_active', true);
    
    if (!workflows || workflows.length === 0) {
      console.log("No active workflows found for Facebook");
      return;
    }
    
    // Trouver le propriétaire de cette page Facebook
    const { data: connections } = await supabase
      .from('social_connections')
      .select('user_id, metadata')
      .eq('platform', 'facebook');
    
    if (!connections || connections.length === 0) {
      console.log(`No matching users found for Facebook page: ${pageId}`);
      return;
    }
    
    // Pour chaque connexion, vérifier si cette page est liée
    const matchingConnections = connections.filter(conn => {
      return conn.metadata?.pages?.some((page: any) => page.id === pageId);
    });
    
    if (matchingConnections.length === 0) {
      console.log(`No matching user found for Facebook page: ${pageId}`);
      return;
    }
    
    // Traiter chaque workflow pour chaque utilisateur associé à cette page
    for (const connection of matchingConnections) {
      const appUserId = connection.user_id;
      
      const userWorkflows = workflows.filter(wf => wf.user_id === appUserId);
      
      for (const workflow of userWorkflows) {
        try {
          console.log(`Processing workflow ${workflow.id} for user ${appUserId}`);
          
          // Ajouter à la file de traitement pour ce workflow
          const { error: queueError } = await supabase
            .from('workflow_queue')
            .insert({
              workflow_id: workflow.id,
              source_platform: 'facebook',
              target_platforms: workflow.target_platforms,
              platform_media_id: feedData.post_id || feedData.id,
              status: 'pending',
              metadata: feedData
            });
          
          if (queueError) {
            console.error(`Error adding to queue for workflow ${workflow.id}:`, queueError);
          } else {
            console.log(`Post ${feedData.post_id || feedData.id} added to workflow ${workflow.id}`);
          }
        } catch (workflowError) {
          console.error(`Error processing workflow ${workflow.id}:`, workflowError);
        }
      }
    }
  } catch (error) {
    console.error("Error in processFacebookFeed:", error);
  }
}

serve(handler);
