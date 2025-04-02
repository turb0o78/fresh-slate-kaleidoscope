
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { videoId, workflowId, userId } = await req.json();
    
    if (!videoId || !workflowId) {
      return new Response(
        JSON.stringify({ error: 'VideoId and workflowId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Vérifier si l'utilisateur a droit au téléchargement sans watermark
    const { data: userPlan, error: userPlanError } = await supabase
      .from('user_plans')
      .select('plan_id')
      .eq('user_id', userId)
      .eq('active', true)
      .single();
      
    if (userPlanError || !userPlan) {
      return new Response(
        JSON.stringify({ error: 'User does not have an active subscription' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Vérifier si le workflow appartient à l'utilisateur et a l'option sans watermark activée
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('config')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single();
      
    if (workflowError || !workflow) {
      return new Response(
        JSON.stringify({ error: 'Workflow not found or not owned by user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const config = workflow.config;
    if (!config.removeWatermark) {
      return new Response(
        JSON.stringify({ error: 'Workflow is not configured for watermark removal' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Téléchargement de la vidéo sans watermark
    const videoUrl = `https://www.tikwm.com/video/media/hdplay/${videoId}.mp4`;
    
    console.log(`Downloading video without watermark: ${videoUrl}`);
    
    const response = await fetch(videoUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download TikTok video: ${response.status}`);
    }
    
    // Récupération des données vidéo
    const videoBlob = await response.blob();
    
    // Créer un nom de fichier unique
    const filename = `tiktok_${videoId}_${Date.now()}.mp4`;
    
    // Vérifier si le bucket "videos" existe, sinon le créer
    const { data: bucket } = await supabase
      .storage
      .getBucket('videos');
      
    if (!bucket) {
      await supabase.storage.createBucket('videos', {
        public: false,
        allowedMimeTypes: ['video/mp4'],
        fileSizeLimit: 104857600 // 100MB
      });
    }
    
    // Convertir le blob en ArrayBuffer pour le téléchargement vers Supabase Storage
    const arrayBuffer = await videoBlob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Uploader la vidéo dans Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload(`${userId}/${filename}`, buffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }
    
    // Créer un enregistrement pour la vidéo téléchargée
    const { data: videoRecord, error: videoRecordError } = await supabase
      .from('downloaded_videos')
      .insert({
        user_id: userId,
        workflow_id: workflowId,
        tiktok_video_id: videoId,
        storage_path: `${userId}/${filename}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expire après 24h
      })
      .select('id')
      .single();
      
    if (videoRecordError) {
      throw new Error(`Failed to record video download: ${videoRecordError.message}`);
    }
    
    // Créer une URL signée pour accéder temporairement à la vidéo
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from('videos')
      .createSignedUrl(`${userId}/${filename}`, 3600); // Lien valide 1 heure
      
    if (signedUrlError) {
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        video_id: videoRecord.id,
        url: signedUrl.signedUrl,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error downloading TikTok video:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to download TikTok video' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
