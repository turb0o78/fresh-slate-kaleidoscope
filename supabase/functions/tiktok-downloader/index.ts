
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('https://ngkbxqkdgqisjkbzpdyu.supabase.co')!;
const supabaseServiceKey = Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2J4cWtkZ3Fpc2prYnpwZHl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY1Nzc4OCwiZXhwIjoyMDU4MjMzNzg4fQ.UUD1tE8K4_N4m7d0Yo9cSesvXoAcni7HCO-KbzHTUg0')!;

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
async function downloadTikTokVideo(videoId: string): Promise<ArrayBuffer> {
  try {
    console.log(`Téléchargement de la vidéo TikTok ${videoId} sans watermark`);
    
    // Construire l'URL TikTok complète si seulement l'ID est fourni
    const tiktokUrl = videoId.includes('tiktok.com') 
      ? videoId 
      : `https://www.tiktok.com/@username/video/${videoId}`;
    
    // Utiliser une API tierce pour télécharger sans watermark
    // Note: Ceci est un exemple, remplacer par une API réelle
    const apiUrl = `https://api.example.com/tiktok/download?url=${encodeURIComponent(tiktokUrl)}&no_watermark=1`;
    
    console.log(`Appel de l'API de téléchargement: ${apiUrl}`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Échec du téléchargement: ${response.status} - ${errorText}`);
    }
    
    // Récupérer la vidéo en tant qu'ArrayBuffer
    const videoBuffer = await response.arrayBuffer();
    console.log(`Vidéo téléchargée avec succès, taille: ${videoBuffer.byteLength} octets`);
    
    return videoBuffer;
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
    const { videoId, userId, workflowId, expiresAt } = await req.json();

    if (!videoId || !userId || !workflowId || !expiresAt) {
      throw new Error('Paramètres manquants: videoId, userId, workflowId et expiresAt sont requis');
    }

    console.log(`Demande de téléchargement pour la vidéo ${videoId}, utilisateur ${userId}, workflow ${workflowId}`);
    
    // Télécharger la vidéo sans watermark
    const videoBuffer = await downloadTikTokVideo(videoId);
    
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
