
import { supabase } from './supabase';
import type { Platform } from './types';

type OAuthProvider = 
  | { url: string; redirectUri: string; scope: string; clientId: string; clientSecret?: string; }
  | { url: string; redirectUri: string; scope: string; clientKey: string; clientSecret?: string; };

// Vérifier si les variables d'environnement sont définies
const tikTokClientId = import.meta.env.VITE_TIKTOK_CLIENT_ID;
const tikTokClientSecret = import.meta.env.VITE_TIKTOK_CLIENT_SECRET;
const tikTokRedirectUri = import.meta.env.VITE_TIKTOK_REDIRECT_URI || 'https://opaldesign.fr/dashboard/connections';

// Logging pour le débogage
console.log("Configuration TikTok chargée:", {
  clientIdAvailable: !!tikTokClientId,
  clientSecretAvailable: !!tikTokClientSecret,
  redirectUri: tikTokRedirectUri
});

const OAUTH_PROVIDERS: Record<Platform, OAuthProvider> = {
  youtube: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  tiktok: {
    url: 'https://www.tiktok.com/v2/auth/authorize/',
    clientKey: tikTokClientId,
    clientSecret: tikTokClientSecret,
    scope: 'user.info.basic,video.list,video.upload',
    redirectUri: tikTokRedirectUri
  },
  facebook: {
    url: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID,
    scope: 'email pages_show_list pages_read_engagement pages_manage_posts publish_video',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  instagram: {
    url: 'https://api.instagram.com/oauth/authorize',
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID,
    scope: 'user_profile user_media',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  linkedin: {
    url: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
    scope: 'r_liteprofile r_emailaddress w_member_social',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  },
  twitter: {
    url: 'https://twitter.com/i/oauth2/authorize',
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID,
    scope: 'tweet.read tweet.write users.read',
    redirectUri: 'https://opaldesign.fr/dashboard/connections'
  }
};

export async function initiateSocialAuth(platform: Platform) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      sessionStorage.setItem('pending_oauth_platform', platform);
      sessionStorage.setItem('pending_oauth_redirect', window.location.pathname);
      window.location.href = '/login';
      return;
    }

    const provider = OAUTH_PROVIDERS[platform];
    if (!provider) throw new Error(`Plateforme non supportée: ${platform}`);

    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_platform', platform);

    console.log(`Initialisation de l'authentification ${platform}`);
    console.log('OAuth provider:', provider);

    if (platform === 'tiktok') {
      if ('clientKey' in provider) {
        if (!provider.clientKey) {
          throw new Error("Client key TikTok manquante. Vérifiez la configuration.");
        }
        
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
      } else {
        throw new Error("Configuration TikTok incorrecte - clientKey manquante");
      }
    } else {
      if ('clientId' in provider) {
        if (!provider.clientId) {
          throw new Error(`Client ID manquant pour ${platform}. Vérifiez la configuration.`);
        }
        
        const params = new URLSearchParams();
        params.append('client_id', provider.clientId);
        params.append('response_type', 'code');
        params.append('scope', provider.scope);
        params.append('redirect_uri', provider.redirectUri || `${window.location.origin}/dashboard/connections`);
        params.append('state', state);
        
        window.location.href = `${provider.url}?${params.toString()}`;
        return;
      } else {
        throw new Error(`Configuration ${platform} incorrecte - clientId manquant`);
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'initialisation de l'authentification ${platform}:`, error);
    throw error;
  }
}

export async function handleOAuthCallback(code: string, state: string) {
  const storedState = sessionStorage.getItem('oauth_state');
  const platform = sessionStorage.getItem('oauth_platform') as Platform;

  if (!storedState || !platform) {
    throw new Error("État OAuth invalide ou manquant");
  }

  if (state !== storedState) {
    throw new Error("Non-correspondance de l'état OAuth");
  }

  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_platform');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    if (platform === 'tiktok') {
      const provider = OAUTH_PROVIDERS.tiktok;

      if (!('clientKey' in provider)) {
        throw new Error('Configuration du fournisseur TikTok invalide');
      }

      console.log('Échange du code contre un jeton d\'accès...');
      const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: new URLSearchParams({
          client_key: provider.clientKey,
          client_secret: provider.clientSecret || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: provider.redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Réponse du jeton:', tokenData);

      if (!tokenResponse.ok || tokenData.error) {
        throw new Error(`Erreur de l'API TikTok: ${tokenData.error?.message || tokenData.message || 'Échec de l\'échange du code contre un jeton'}`);
      }

      if (!tokenData.access_token) {
        console.error('Données de jeton invalides:', tokenData);
        throw new Error("Aucun jeton d'accès reçu de TikTok");
      }

      console.log("Récupération des informations de l'utilisateur...");
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
      console.log("Réponse des informations de l'utilisateur:", userData);

      if (!userResponse.ok || userData.error) {
        throw new Error(`Échec de la récupération des informations de l'utilisateur: ${userData.error?.message || userData.message || 'Erreur inconnue'}`);
      }

      if (!userData.data?.user) {
        console.error('Données utilisateur invalides:', userData);
        throw new Error("Réponse de données utilisateur invalide de l'API TikTok");
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
        console.error('Erreur lors de l\'enregistrement de la connexion:', saveError);
        throw saveError;
      }

      return { platform: 'tiktok' };
    }

    return { platform };
  } catch (error) {
    console.error('Erreur durant le rappel OAuth:', error);
    throw error;
  }
}
