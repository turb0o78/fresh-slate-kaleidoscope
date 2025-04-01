
import { supabase } from './supabase';
import type { Platform } from './types';

const OAUTH_PROVIDERS = {
  youtube: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
    clientSecret: import.meta.env.VITE_YOUTUBE_CLIENT_SECRET,
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  tiktok: {
    url: 'https://www.tiktok.com/v2/auth/authorize/',
    clientKey: import.meta.env.VITE_TIKTOK_CLIENT_ID,
    clientSecret: import.meta.env.VITE_TIKTOK_CLIENT_SECRET,
    scope: 'user.info.basic,video.list,video.upload',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  facebook: {
    url: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID,
    clientSecret: import.meta.env.VITE_FACEBOOK_CLIENT_SECRET,
    scope: 'email pages_show_list pages_read_engagement pages_manage_posts publish_video',
  },
  instagram: {
    url: 'https://api.instagram.com/oauth/authorize',
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID,
    clientSecret: import.meta.env.VITE_INSTAGRAM_CLIENT_SECRET,
    scope: 'user_profile user_media',
  }
};

export async function initiateSocialAuth(platform: Platform) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    sessionStorage.setItem('pending_oauth_platform', platform);
    sessionStorage.setItem('pending_oauth_redirect', window.location.pathname);
    window.location.href = '/login';
    return;
  }

  const provider = OAUTH_PROVIDERS[platform];
  if (!provider) throw new Error(`Unsupported platform: ${platform}`);

  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_platform', platform);

  const params = new URLSearchParams();
  
  if (platform === 'tiktok') {
    params.append('client_key', provider.clientKey);
    params.append('response_type', 'code');
    params.append('scope', provider.scope);
    params.append('redirect_uri', provider.redirectUri);
    params.append('state', state);
  } else {
    params.append('client_id', provider.clientId);
    params.append('response_type', 'code');
    params.append('scope', provider.scope);
    params.append('redirect_uri', provider.redirectUri || `${window.location.origin}/dashboard/connections`);
    params.append('state', state);
  }

  window.location.href = `${provider.url}?${params.toString()}`;
}

export async function handleOAuthCallback(code: string, state: string) {
  const storedState = sessionStorage.getItem('oauth_state');
  const platform = sessionStorage.getItem('oauth_platform') as Platform;

  if (!storedState || !platform) {
    throw new Error('Invalid OAuth state');
  }

  if (state !== storedState) {
    throw new Error('OAuth state mismatch');
  }

  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_platform');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    if (platform === 'tiktok') {
      const provider = OAUTH_PROVIDERS.tiktok;

      // Exchange code for access token using TikTok v2 API
      console.log('Exchanging code for access token...');
      const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: new URLSearchParams({
          client_key: provider.clientKey,
          client_secret: provider.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: provider.redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Token response:', tokenData);

      if (!tokenResponse.ok || tokenData.error) {
        throw new Error(`TikTok API error: ${tokenData.error?.message || tokenData.message || 'Failed to exchange code for token'}`);
      }

      if (!tokenData.access_token) {
        console.error('Invalid token data:', tokenData);
        throw new Error('No access token received from TikTok');
      }

      // Get user info using TikTok v2 API - Adding the required fields parameter
      console.log('Fetching user info...');
      const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        method: 'POST', // Changed to POST method
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: ['open_id', 'union_id', 'avatar_url', 'avatar_url_100', 'avatar_url_200', 'display_name', 'bio_description']
        }),
      });

      const userData = await userResponse.json();
      console.log('User info response:', userData);

      if (!userResponse.ok || userData.error) {
        throw new Error(`Failed to fetch user info: ${userData.error?.message || userData.message || 'Unknown error'}`);
      }

      if (!userData.data?.user) {
        console.error('Invalid user data:', userData);
        throw new Error('Invalid user data response from TikTok API');
      }

      // Save connection
      const { error: saveError } = await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: 'tiktok',
          platform_user_id: userData.data.user.open_id,
          platform_username: userData.data.user.display_name,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          metadata: {
            profile: userData.data,
            scopes: provider.scope.split(','),
          },
        }, {
          onConflict: 'user_id,platform',
        });

      if (saveError) {
        console.error('Error saving connection:', saveError);
        throw saveError;
      }

      return { platform: 'tiktok' };
    }

    // Handle other platforms...
    return { platform };
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    throw error;
  }
}
