import { supabase } from './supabase';
import type { Platform } from './types';

type OAuthProvider = 
  | { url: string; redirectUri: string; scope: string; clientId: string; clientSecret: string; }
  | { url: string; redirectUri: string; scope: string; clientKey: string; clientSecret: string; };

const OAUTH_PROVIDERS: Record<Platform, OAuthProvider> = {
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
    redirectUri: import.meta.env.VITE_TIKTOK_REDIRECT_URI || 'https://opaldesign.fr/dashboard/connections'
  },
  facebook: {
    url: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID,
    clientSecret: import.meta.env.VITE_FACEBOOK_CLIENT_SECRET,
    scope: 'email pages_show_list pages_read_engagement pages_manage_posts publish_video',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  instagram: {
    url: 'https://api.instagram.com/oauth/authorize',
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID,
    clientSecret: import.meta.env.VITE_INSTAGRAM_CLIENT_SECRET,
    scope: 'user_profile user_media',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  linkedin: {
    url: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
    clientSecret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET,
    scope: 'r_liteprofile r_emailaddress w_member_social',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  twitter: {
    url: 'https://twitter.com/i/oauth2/authorize',
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID,
    clientSecret: import.meta.env.VITE_TWITTER_CLIENT_SECRET,
    scope: 'tweet.read tweet.write users.read',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
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

  console.log(`Initialisation de l'authentification ${platform}`);
  console.log('OAuth provider:', provider);

  if (platform === 'tiktok') {
    if ('clientKey' in provider) {
      const params = new URLSearchParams();
      params.append('client_key', provider.clientKey);
      params.append('response_type', 'code');
      params.append('scope', provider.scope);
      params.append('redirect_uri', provider.redirectUri);
      params.append('state', state);
      
      const fullUrl = `${provider.url}?${params.toString()}`;
      console.log('URL de redirection TikTok:', fullUrl);
      
      window.location.href = fullUrl;
      return;
    }
  } else {
    if ('clientId' in provider) {
      const params = new URLSearchParams();
      params.append('client_id', provider.clientId);
      params.append('response_type', 'code');
      params.append('scope', provider.scope);
      params.append('redirect_uri', provider.redirectUri || `${window.location.origin}/dashboard/connections`);
      params.append('state', state);
      
      window.location.href = `${provider.url}?${params.toString()}`;
      return;
    }
  }

  throw new Error(`Configuration incorrecte pour ${platform}`);
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

      if (!('clientKey' in provider)) {
        throw new Error('Invalid TikTok provider configuration');
      }

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

      console.log('Fetching user info...');
      const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        method: 'POST',
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

    return { platform };
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    throw error;
  }
}
