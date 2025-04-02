
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Configuration Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

// Vérification des secrets pour le webhook
const META_WEBHOOK_SECRET = Deno.env.get("META_WEBHOOK_SECRET") || '';

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Vérification du webhook (endpoint challenge)
    if (req.method === "GET" && mode && token) {
      console.log("Webhook verification request received");
      
      // Vérifier que le token correspond à notre secret
      if (mode === "subscribe" && token === META_WEBHOOK_SECRET) {
        console.log("Webhook verified successfully");
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders }
        });
      } else {
        console.error("Webhook verification failed");
        return new Response("Verification failed", {
          status: 403,
          headers: { ...corsHeaders }
        });
      }
    }
    
    // Traitement des notifications webhook
    if (req.method === "POST") {
      const body = await req.json();
      console.log("Webhook notification received:", JSON.stringify(body));

      // Initialiser le client Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Vérifier si c'est une notification Instagram
      if (body.entry && body.entry.length > 0) {
        const entry = body.entry[0];
        
        // Traitement pour Instagram
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.field === 'media' && change.value) {
              const mediaObj = change.value;
              const mediaId = mediaObj.id;
              const mediaType = mediaObj.media_type;
              const userId = mediaObj.user_id || entry.id;
              
              console.log(`New Instagram media detected: ${mediaId} (type: ${mediaType})`);
              
              // Vérifier si l'utilisateur existe dans notre système
              const { data: connections } = await supabase
                .from('social_connections')
                .select('user_id')
                .eq('platform_user_id', userId)
                .eq('platform', 'instagram');
                
              if (connections && connections.length > 0) {
                // Pour chaque utilisateur connecté avec cet Instagram ID
                for (const connection of connections) {
                  const appUserId = connection.user_id;
                  
                  // Vérifier les workflows actifs
                  const { data: workflows } = await supabase
                    .from('workflows')
                    .select('*')
                    .eq('user_id', appUserId)
                    .eq('source_platform', 'instagram')
                    .eq('is_active', true);
                    
                  if (workflows && workflows.length > 0) {
                    console.log(`Processing ${workflows.length} workflows for user ${appUserId}`);
                    
                    // Ajouter le media à la file de traitement pour chaque workflow
                    for (const workflow of workflows) {
                      await supabase
                        .from('workflow_queue')
                        .insert({
                          workflow_id: workflow.id,
                          source_platform: 'instagram',
                          platform_media_id: mediaId,
                          status: 'pending',
                          metadata: {
                            media_type: mediaType,
                            source_id: userId
                          }
                        });
                        
                      console.log(`Media ${mediaId} added to workflow queue for workflow ${workflow.id}`);
                    }
                  }
                }
              }
            }
          }
        }
        
        // Traitement pour Facebook
        if (entry.id && entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.field === 'feed' && change.value) {
              const feedItem = change.value;
              const postId = feedItem.post_id;
              const pageId = entry.id;
              
              console.log(`New Facebook post detected: ${postId} on page ${pageId}`);
              
              // Vérifier si la page existe dans notre système
              const { data: connections } = await supabase
                .from('social_connections')
                .select('user_id, metadata')
                .eq('platform', 'facebook');
                
              const matchingConnections = connections?.filter(conn => {
                return conn.metadata?.pages?.some((page: any) => page.id === pageId);
              }) || [];
              
              if (matchingConnections.length > 0) {
                // Pour chaque utilisateur connecté avec cette page Facebook
                for (const connection of matchingConnections) {
                  const appUserId = connection.user_id;
                  
                  // Vérifier les workflows actifs
                  const { data: workflows } = await supabase
                    .from('workflows')
                    .select('*')
                    .eq('user_id', appUserId)
                    .eq('source_platform', 'facebook')
                    .eq('is_active', true);
                    
                  if (workflows && workflows.length > 0) {
                    console.log(`Processing ${workflows.length} workflows for user ${appUserId}`);
                    
                    // Ajouter le post à la file de traitement pour chaque workflow
                    for (const workflow of workflows) {
                      await supabase
                        .from('workflow_queue')
                        .insert({
                          workflow_id: workflow.id,
                          source_platform: 'facebook',
                          platform_media_id: postId,
                          status: 'pending',
                          metadata: {
                            media_type: feedItem.item || 'post',
                            source_id: pageId
                          }
                        });
                        
                      console.log(`Post ${postId} added to workflow queue for workflow ${workflow.id}`);
                    }
                  }
                }
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
    
    // Si la requête n'est ni une vérification, ni une notification
    return new Response("Unsupported request", {
      status: 400,
      headers: { ...corsHeaders }
    });

  } catch (error) {
    console.error("Error in webhook handler:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);
