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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tiktok-sign',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-tiktok-sign');
    
    // Store webhook event
    const body = await req.json();
    const { error: logError } = await supabase
      .from('tiktok_webhooks')
      .insert({
        event_type: body.event_type,
        signature,
        payload: body,
      });

    if (logError) throw logError;

    // Handle different event types
    const { event_type, event } = body;
    
    switch (event_type) {
      case 'video.upload': {
        await handleVideoUpload(event);
        break;
      }
      case 'video.delete': {
        await handleVideoDelete(event);
        break;
      }
      case 'video.publish': {
        await handleVideoPublish(event);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Log error
    await supabase
      .from('tiktok_webhooks')
      .update({
        status: 'error',
        error_message: error.message
      })
      .eq('id', error.webhook_id);

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleVideoUpload(event: any) {
  const { error } = await supabase
    .from('tiktok_videos')
    .insert({
      video_id: event.video_id,
      creator_id: event.creator_id,
      title: event.title,
      description: event.description,
      thumbnail_url: event.thumbnail_url,
      share_url: event.share_url,
      raw_data: event
    });

  if (error) throw error;
}

async function handleVideoDelete(event: any) {
  const { error } = await supabase
    .from('tiktok_videos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('video_id', event.video_id);

  if (error) throw error;
}

async function handleVideoPublish(event: any) {
  const { error } = await supabase
    .from('tiktok_videos')
    .update({
      share_url: event.share_url,
      raw_data: {
        ...event,
        published_at: new Date().toISOString()
      }
    })
    .eq('video_id', event.video_id);

  if (error) throw error;
}