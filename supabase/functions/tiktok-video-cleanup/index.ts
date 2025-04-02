
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
    console.log('Starting expired videos cleanup');
    
    // Récupérer les vidéos expirées
    const { data: expiredVideos, error: queryError } = await supabase
      .from('downloaded_videos')
      .select('id, storage_path')
      .lt('expires_at', new Date().toISOString());
      
    if (queryError) {
      throw new Error(`Failed to query expired videos: ${queryError.message}`);
    }
    
    if (!expiredVideos || expiredVideos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired videos to clean up' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${expiredVideos.length} expired videos to clean up`);
    
    // Supprimer les fichiers du stockage
    const deletePromises = expiredVideos.map(async (video) => {
      try {
        const { error: deleteError } = await supabase
          .storage
          .from('videos')
          .remove([video.storage_path]);
          
        if (deleteError) {
          console.error(`Failed to delete video ${video.id}: ${deleteError.message}`);
          return false;
        }
        
        return true;
      } catch (err) {
        console.error(`Error processing video ${video.id}: ${err.message}`);
        return false;
      }
    });
    
    // Attendre que toutes les suppressions soient terminées
    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter(Boolean).length;
    
    // Marquer les vidéos comme supprimées
    const { error: updateError } = await supabase
      .from('downloaded_videos')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', expiredVideos.map(v => v.id));
      
    if (updateError) {
      console.error(`Failed to update deleted_at: ${updateError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${deletedCount} expired videos out of ${expiredVideos.length}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error cleaning up expired videos:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to clean up expired videos' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
