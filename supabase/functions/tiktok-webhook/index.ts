
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_ID')!;
const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')!;

// Vérifier que les variables d'environnement essentielles sont définies
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Variables d'environnement Supabase manquantes");
}

// En mode sandbox, on continue même sans les clés TikTok
if (!tiktokClientKey || !tiktokClientSecret) {
  console.warn("Variables d'environnement TikTok manquantes - Mode sandbox activé");
}

console.log("TikTok Webhook démarré en mode:", (!tiktokClientKey || !tiktokClientSecret) ? "sandbox" : "production");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier que le requête est une requête POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enregistrer la réception du webhook pour débogage
    console.log("Webhook TikTok reçu:", new Date().toISOString());

    // Récupérer les données de la requête
    const payload = await req.json();
    console.log('Webhook TikTok détails:', JSON.stringify(payload, null, 2));
    
    // Déterminer si nous sommes en mode sandbox
    const isSandboxMode = (!tiktokClientKey || !tiktokClientSecret) || payload.sandbox_mode === true;
    console.log("Mode webhook:", isSandboxMode ? "sandbox" : "production");

    // Enregistrer le webhook dans la base de données pour débogage
    try {
      const { error: logError } = await supabase
        .from('tiktok_webhooks')
        .insert({
          event_type: payload.event_type || 'unknown',
          payload: payload,
          signature: req.headers.get('X-TIKTOK-SIGNATURE') || null,
          sandbox_mode: isSandboxMode
        });

      if (logError) {
        console.error("Erreur lors de l'enregistrement du webhook:", logError);
      }
    } catch (logErr) {
      console.error("Exception lors de l'enregistrement du webhook:", logErr);
    }

    // Vérifier si c'est un événement de nouvelle vidéo
    // Note: Il faut adapter cela selon le format exact des webhooks TikTok
    if (!payload.event_type || payload.event_type !== 'video_created') {
      return new Response(
        JSON.stringify({ message: 'Événement ignoré, non pertinent pour le traitement', sandbox_mode: isSandboxMode }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire les informations de la vidéo publiée
    const videoData = payload.video || payload.data?.video;
    if (!videoData || !videoData.id) {
      throw new Error('Données de vidéo invalides dans le webhook');
    }

    const videoId = videoData.id;
    const creatorId = payload.creator_id || videoData.creator_id || payload.data?.creator_id;

    // Vérifier si ce créateur est connecté à notre application
    const { data: connections, error: connectionError } = await supabase
      .from('social_connections')
      .select('user_id, metadata')
      .eq('platform', 'tiktok')
      .eq('platform_user_id', creatorId);

    if (connectionError) {
      throw new Error(`Erreur lors de la recherche de la connexion: ${connectionError.message}`);
    }

    if (!connections || connections.length === 0) {
      console.log(`Aucune connexion trouvée pour le créateur TikTok ${creatorId}`);
      
      if (isSandboxMode) {
        console.log("Mode sandbox - Recherche de tous les comptes TikTok pour simulation");
        
        // En mode sandbox, on cherche tous les comptes TikTok connectés
        const { data: allTikTokConnections, error: allConnectionsError } = await supabase
          .from('social_connections')
          .select('user_id, metadata')
          .eq('platform', 'tiktok');
          
        if (allConnectionsError || !allTikTokConnections || allTikTokConnections.length === 0) {
          return new Response(
            JSON.stringify({ message: 'Aucun utilisateur connecté à TikTok', sandbox_mode: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Utiliser ces connexions pour le traitement en mode sandbox
        console.log(`Mode sandbox - Utilisation de ${allTikTokConnections.length} connexions TikTok pour simulation`);
        await processTikTokConnections(allTikTokConnections, videoId, isSandboxMode);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Webhook traité avec succès en mode sandbox', 
            sandbox_mode: true,
            connections_processed: allTikTokConnections.length
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ message: 'Aucun utilisateur associé à ce compte TikTok' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Traiter les connexions
    await processTikTokConnections(connections, videoId, isSandboxMode);

    // Renvoyer une réponse de succès
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook traité avec succès', 
        sandbox_mode: isSandboxMode,
        connections_processed: connections.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur lors du traitement du webhook TikTok:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur est survenue lors du traitement' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processTikTokConnections(connections: any[], videoId: string, isSandboxMode: boolean = false) {
  // Pour chaque utilisateur connecté à ce compte TikTok
  const processPromises = connections.map(async (connection) => {
    const userId = connection.user_id;

    // Trouver les workflows actifs de l'utilisateur pour TikTok comme source
    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .eq('source_platform', 'tiktok')
      .eq('is_active', true);

    if (workflowError) {
      throw new Error(`Erreur lors de la recherche des workflows: ${workflowError.message}`);
    }

    if (!workflows || workflows.length === 0) {
      console.log(`Aucun workflow actif pour l'utilisateur ${userId} avec TikTok comme source`);
      return null;
    }

    // Traiter chaque workflow
    return Promise.all(workflows.map(async (workflow) => {
      console.log(`Traitement du workflow ${workflow.id} pour la vidéo ${videoId} (mode: ${isSandboxMode ? 'sandbox' : 'production'})`);
      
      // Vérifier si l'option "remove watermark" est activée
      const removeWatermark = workflow.config?.removeWatermark === true;
      
      if (removeWatermark) {
        // Appeler la fonction edge de téléchargement sans watermark
        console.log(`Lancement du téléchargement sans watermark pour la vidéo ${videoId}`);
        
        try {
          // Durée d'expiration: 24h à partir de maintenant
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);
          
          const downloadResponse = await fetch(`${supabaseUrl}/functions/v1/tiktok-downloader`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              videoId,
              userId,
              workflowId: workflow.id,
              expiresAt: expiresAt.toISOString(),
              sandbox: isSandboxMode
            })
          });
          
          const downloadResult = await downloadResponse.json();
          console.log('Résultat du téléchargement:', downloadResult);
          
          // Ici, on pourrait ajouter la logique pour publier immédiatement sur les plateformes cibles
          
        } catch (err) {
          console.error(`Erreur lors du téléchargement de la vidéo ${videoId}:`, err);
        }
      } else {
        // Si l'option est désactivée, utiliser l'URL standard avec watermark
        console.log(`Option "remove watermark" non activée pour le workflow ${workflow.id}`);
        // Logique pour le téléchargement standard ici
      }
      
      return { workflowId: workflow.id, processed: true };
    }));
  });

  await Promise.all(processPromises.filter(Boolean));
}
