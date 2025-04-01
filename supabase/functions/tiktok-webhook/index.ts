import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { createHmac } from 'node:crypto';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('TIKTOK_WEBHOOK_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tiktok-sign',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-tiktok-sign');
    if (!signature) {
      throw new Error('Missing TikTok signature');
    }

    const body = await req.text();
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    const data = JSON.parse(body);
    
    // Log webhook event
    const { data: webhook, error: logError } = await supabase
      .from('tiktok_webhooks')
      .insert({
        event_type: data.event_type,
        signature,
        payload: data,
      })
      .select()
      .single();

    if (logError) throw logError;

    // Handle Content Posting API events
    switch (data.event_type) {
      case 'video.upload.complete':
        await handleVideoUpload(data.event);
        break;
      case 'video.publish.success':
        await handleVideoPublish(data.event);
        break;
      case 'video.publish.failed':
        await handleVideoPublishError(data.event);
        break;
      case 'video.delete':
        await handleVideoDelete(data.event);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleVideoUpload(event: any) {
  const { error } = await supabase
    .from('tiktok_videos')
    .insert({
      video_id: event.video_id,
      creator_id: event.creator_id,
      title: event.title || null,
      description: event.description || null,
      thumbnail_url: event.thumbnail_url || null,
      raw_data: event
    });

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

async function handleVideoPublishError(event: any) {
  const { error } = await supabase
    .from('tiktok_videos')
    .update({
      raw_data: {
        ...event,
        error: event.error,
        error_at: new Date().toISOString()
      }
    })
    .eq('video_id', event.video_id);

  if (error) throw error;
}

async function handleVideoDelete(event: any) {
  const { error } = await supabase
    .from('tiktok_videos')
    .update({
      deleted_at: new Date().toISOString(),
      raw_data: {
        ...event,
        deleted_at: new Date().toISOString()
      }
    })
    .eq('video_id', event.video_id);

  if (error) throw error;
}