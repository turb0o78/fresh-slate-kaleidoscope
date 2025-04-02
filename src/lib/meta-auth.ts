
import { supabase } from './supabase';
import type { Platform } from './types';

// Configuration pour Facebook et Instagram
const META_PROVIDERS = {
  facebook: {
    url: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: '990797112672585', // Facebook App ID
    clientSecret: '8cc56867f327203d95ab8c7ffb88825f', // Facebook App Secret
    scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  instagram: {
    url: 'https://api.instagram.com/oauth/authorize',
    clientId: '525008276969587', // Instagram App ID
    clientSecret: 'ece5c125352cfce4f0a8b1fe2b1ba4a2', // Instagram App Secret
    scope: 'user_profile,user_media,instagram_basic,instagram_content_publish,pages_show_list',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  }
};

export async function initiateMetaAuth(platform: 'facebook' | 'instagram') {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    sessionStorage.setItem('pending_oauth_platform', platform);
    sessionStorage.setItem('pending_oauth_redirect', window.location.pathname);
    window.location.href = '/login';
    return;
  }

  const provider = META_PROVIDERS[platform];
  if (!provider) throw new Error(`Unsupported platform: ${platform}`);

  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_platform', platform);

  const params = new URLSearchParams();
  params.append('client_id', provider.clientId);
  params.append('response_type', 'code');
  params.append('scope', provider.scope);
  params.append('redirect_uri', provider.redirectUri);
  params.append('state', state);

  window.location.href = `${provider.url}?${params.toString()}`;
}

export async function handleMetaOAuthCallback(code: string, state: string, platform: 'facebook' | 'instagram') {
  const storedState = sessionStorage.getItem('oauth_state');
  const storedPlatform = sessionStorage.getItem('oauth_platform');

  if (!storedState || !storedPlatform) {
    throw new Error('Invalid OAuth state');
  }

  if (state !== storedState || platform !== storedPlatform) {
    throw new Error('OAuth state or platform mismatch');
  }

  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_platform');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const provider = META_PROVIDERS[platform];
  
  try {
    // Exchange code for access token
    const tokenUrl = platform === 'facebook' 
      ? 'https://graph.facebook.com/v18.0/oauth/access_token'
      : 'https://api.instagram.com/oauth/access_token';
      
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', provider.clientId);
    tokenParams.append('client_secret', provider.clientSecret);
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', provider.redirectUri);
    
    if (platform === 'facebook') {
      tokenParams.append('grant_type', 'authorization_code');
    }
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': platform === 'facebook' 
          ? 'application/x-www-form-urlencoded' 
          : 'application/x-www-form-urlencoded',
      },
      body: tokenParams
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(`Meta API error: ${tokenData.error?.message || tokenData.error_message || 'Failed to exchange code for token'}`);
    }

    let accessToken = tokenData.access_token;
    let userId = platform === 'instagram' ? tokenData.user_id : undefined;
    let longLivedToken;
    let pages = [];
    let userData;
    
    // For Facebook, we need to get long-lived token and pages
    if (platform === 'facebook') {
      // Get long-lived token
      const llTokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${provider.clientId}&client_secret=${provider.clientSecret}&fb_exchange_token=${accessToken}`
      );
      
      const llTokenData = await llTokenResponse.json();
      if (!llTokenResponse.ok || llTokenData.error) {
        throw new Error(`Failed to exchange for long-lived token: ${llTokenData.error?.message || 'Unknown error'}`);
      }
      
      longLivedToken = llTokenData.access_token;
      accessToken = longLivedToken;
      
      // Get user info
      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
      userData = await userResponse.json();
      userId = userData.id;
      
      // Get pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();
      
      if (pagesData && pagesData.data) {
        pages = pagesData.data.map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          category: page.category
        }));
      }
    }
    
    // For Instagram, get basic profile info
    if (platform === 'instagram') {
      // For Instagram Business accounts, they're linked to Facebook Pages
      // Get long-lived token first (similar to Facebook)
      const llTokenResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${provider.clientSecret}&access_token=${accessToken}`
      );
      
      const llTokenData = await llTokenResponse.json();
      if (!llTokenResponse.ok || llTokenData.error) {
        throw new Error(`Failed to exchange for long-lived Instagram token: ${llTokenData.error?.message || 'Unknown error'}`);
      }
      
      longLivedToken = llTokenData.access_token;
      accessToken = longLivedToken;
      
      // Get basic profile info
      const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
      userData = await userResponse.json();
    }

    // Save connection to database
    const { error: saveError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: user.id,
        platform: platform,
        platform_user_id: userId,
        platform_username: platform === 'instagram' ? userData?.username : userData?.name,
        access_token: accessToken,
        refresh_token: tokenData.refresh_token || null,
        metadata: {
          profile: userData,
          pages: platform === 'facebook' ? pages : [],
          scopes: provider.scope.split(','),
        },
      }, {
        onConflict: 'user_id,platform',
      });

    if (saveError) {
      console.error('Error saving connection:', saveError);
      throw saveError;
    }

    return { 
      platform, 
      userData, 
      pages: platform === 'facebook' ? pages : [] 
    };
  } catch (error) {
    console.error('Error during Meta OAuth callback:', error);
    throw error;
  }
}
