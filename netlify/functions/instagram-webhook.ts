import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// This should match what you set in the Instagram App Dashboard
const VERIFY_TOKEN = 'purposify_instagram_webhook_verify_2024';

export const handler: Handler = async (event) => {
  // Enable CORS for webhook verification
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    };
  }

  // Handle webhook verification
  if (event.httpMethod === 'GET') {
    const mode = event.queryStringParameters?.['hub.mode'];
    const token = event.queryStringParameters?.['hub.verify_token'];
    const challenge = event.queryStringParameters?.['hub.challenge'];

    // Log verification attempt
    console.log('Instagram webhook verification attempt:', {
      mode,
      token,
      challenge,
      expectedToken: VERIFY_TOKEN
    });

    // Verify the mode and token
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Instagram webhook verification successful');
      return {
        statusCode: 200,
        body: challenge,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    console.log('Instagram webhook verification failed');
    return {
      statusCode: 403,
      body: 'Forbidden',
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  // Handle webhook events
  if (event.httpMethod === 'POST') {
    try {
      const signature = event.headers['x-hub-signature'] || event.headers['X-Hub-Signature'];
      if (!signature) {
        console.error('Missing X-Hub-Signature');
        return { 
          statusCode: 400, 
          body: 'Missing signature',
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        };
      }

      // Verify signature
      const signatureHash = signature.split('=')[1];
      const expectedHash = crypto
        .createHmac('sha1', process.env.INSTAGRAM_CLIENT_SECRET!)
        .update(event.body!)
        .digest('hex');

      if (signatureHash !== expectedHash) {
        console.error('Invalid signature');
        return { 
          statusCode: 403, 
          body: 'Invalid signature',
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        };
      }

      const data = JSON.parse(event.body!);
      console.log('Received Instagram webhook:', data);
      
      // Process webhook events
      for (const entry of data.entry) {
        if (!entry.changes) continue;
        
        for (const change of entry.changes) {
          if (change.field === 'media') {
            await handleMediaUpdate(change.value);
          } else if (change.field === 'story') {
            await handleStoryUpdate(change.value);
          } else if (change.field === 'mentions') {
            await handleMentionUpdate(change.value);
          }
        }
      }

      return {
        statusCode: 200,
        body: 'OK',
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } catch (error) {
      console.error('Error processing Instagram webhook:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
  }

  return {
    statusCode: 405,
    body: 'Method not allowed',
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    }
  };
};

async function handleMediaUpdate(value: any) {
  try {
    const { error } = await supabase.from('instagram_media').insert({
      media_id: value.id,
      media_type: value.media_type,
      media_url: value.media_url,
      permalink: value.permalink,
      timestamp: new Date().toISOString(),
      caption: value.caption,
      username: value.username,
      raw_data: value
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error handling media update:', error);
    throw error;
  }
}

async function handleStoryUpdate(value: any) {
  try {
    const { error } = await supabase.from('instagram_stories').insert({
      story_id: value.id,
      media_type: value.media_type,
      media_url: value.media_url,
      timestamp: new Date().toISOString(),
      raw_data: value
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error handling story update:', error);
    throw error;
  }
}

async function handleMentionUpdate(value: any) {
  try {
    const { error } = await supabase.from('instagram_mentions').insert({
      mention_id: value.id,
      media_type: value.media_type,
      media_url: value.media_url,
      permalink: value.permalink,
      timestamp: new Date().toISOString(),
      caption: value.caption,
      username: value.username,
      raw_data: value
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error handling mention update:', error);
    throw error;
  }
}