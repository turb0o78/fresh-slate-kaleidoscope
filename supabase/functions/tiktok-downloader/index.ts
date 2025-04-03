
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

// Récupération des variables d'environnement
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_ID')!;
const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')!;

// Vérification et logging des variables d'environnement
console.log("Function tiktok-downloader initialized");
console.log("Supabase URL configured:", !!supabaseUrl);
console.log("Supabase service key configured:", !!supabaseServiceKey);
console.log("TikTok client key configured:", !!tiktokClientKey);
console.log("TikTok client secret configured:", !!tiktokClientSecret);
console.log("Mode: Sandbox");

if (!tiktokClientKey) {
  console.warn("ATTENTION: TIKTOK_CLIENT_ID n'est pas configuré dans l'environnement Supabase, utilisation du mode sandbox");
}

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

// Fonction pour télécharger une vidéo TikTok sans watermark
async function downloadTikTokVideo(videoId: string, isSandboxMode: boolean = false): Promise<ArrayBuffer> {
  try {
    console.log(`Téléchargement de la vidéo TikTok ${videoId} sans watermark (mode: ${isSandboxMode ? 'sandbox' : 'production'})`);
    
    // Construire l'URL TikTok complète si seulement l'ID est fourni
    const tiktokUrl = videoId.includes('tiktok.com') 
      ? videoId 
      : `https://www.tiktok.com/@username/video/${videoId}`;
    
    if (isSandboxMode) {
      console.log("Mode sandbox activé - Génération d'une vidéo fictive");
      
      // En mode sandbox, on génère une vidéo fictive
      // Pour cet exemple, nous utilisons un GIF d'exemple converti en ArrayBuffer
      const sampleVideoUrl = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2xvcGRuN3hzOHR4N3BjanA5NnlmcXQ5dWlscWlyOGZpNmhma2k0MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lLs970IlDrkKpG/giphy.gif';
      
      const response = await fetch(sampleVideoUrl);
      if (!response.ok) {
        throw new Error(`Échec du téléchargement de l'exemple: ${response.status}`);
      }
      
      const videoBuffer = await response.arrayBuffer();
      console.log(`Vidéo d'exemple générée, taille: ${videoBuffer.byteLength} octets`);
      
      return videoBuffer;
    } else {
      // Utiliser l'API TikTok ou un service tiers pour télécharger sans watermark
      // Cette implémentation dépendra de l'API spécifique que vous utilisez
      
      // Exemple simplifié - Dans une implémentation réelle, vous utiliseriez l'API TikTok
      // ou un service tiers avec les identifiants appropriés
      const apiUrl = `https://api.example.com/tiktok/download?url=${encodeURIComponent(tiktokUrl)}&client_key=${tiktokClientKey}`;
      
      console.log(`Appel de l'API de téléchargement`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Échec du téléchargement: ${response.status}`);
      }
      
      // Récupérer la vidéo en tant qu'ArrayBuffer
      const videoBuffer = await response.arrayBuffer();
      console.log(`Vidéo téléchargée avec succès, taille: ${videoBuffer.byteLength} octets`);
      
      return videoBuffer;
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement de la vidéo TikTok:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification (JWT token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authentification requise');
    }

    // Récupérer les données de la requête
    const { videoId, userId, workflowId, expiresAt, sandbox = (!tiktokClientKey || !tiktokClientSecret) } = await req.json();

    if (!videoId || !userId || !workflowId || !expiresAt) {
      throw new Error('Paramètres manquants: videoId, userId, workflowId et expiresAt sont requis');
    }

    console.log(`Demande de téléchargement pour la vidéo ${videoId}, utilisateur ${userId}, workflow ${workflowId}, mode: ${sandbox ? 'sandbox' : 'production'}`);
    
    // Télécharger la vidéo sans watermark
    const videoBuffer = await downloadTikTokVideo(videoId, sandbox);
    
    // Chemin de stockage dans le bucket (user_id/workflow_id/video_id.mp4)
    const storagePath = `${userId}/${workflowId}/${videoId}.mp4`;
    
    // Sauvegarder la vidéo dans le stockage Supabase
    console.log(`Sauvegarde de la vidéo dans le stockage: ${storagePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload(storagePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Erreur lors du téléchargement vers le stockage: ${uploadError.message}`);
    }
    
    // Enregistrer les informations de la vidéo téléchargée dans la base de données
    const { data: insertData, error: insertError } = await supabase
      .from('downloaded_videos')
      .insert({
        user_id: userId,
        workflow_id: workflowId,
        tiktok_video_id: videoId,
        storage_path: storagePath,
        expires_at: expiresAt,
        processing_status: 'completed'
      })
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Erreur lors de l'insertion des données: ${insertError.message}`);
    }
    
    // Renvoyer les détails du téléchargement
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vidéo téléchargée avec succès',
        sandbox_mode: sandbox,
        video_id: insertData.id,
        storage_path: storagePath,
        expires_at: expiresAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors du téléchargement de la vidéo:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur est survenue lors du téléchargement' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
