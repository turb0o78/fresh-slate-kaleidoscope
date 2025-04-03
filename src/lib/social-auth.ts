
import { supabase } from './supabase';
import type { Platform } from './types';

type OAuthProvider = 
  | { url: string; redirectUri: string; scope: string; clientId: string; clientSecret?: string; }
  | { url: string; redirectUri: string; scope: string; clientKey: string; clientSecret?: string; };

// Récupérer les variables d'environnement
const tikTokClientId = import.meta.env.VITE_TIKTOK_CLIENT_ID;
const tikTokRedirectUri = import.meta.env.VITE_TIKTOK_REDIRECT_URI || window.location.origin + '/dashboard/connections';

// Variables YouTube
const youtubeClientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
const youtubeRedirectUri = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || window.location.origin + '/dashboard/connections';

console.log("Configuration OAuth initializing");
console.log("YouTube Client ID:", youtubeClientId ? "Configuré" : "Non configuré");
console.log("TikTok Client ID:", tikTokClientId ? "Configuré" : "Non configuré");
console.log("YouTube Redirect URI:", youtubeRedirectUri);
console.log("TikTok Redirect URI:", tikTokRedirectUri);

const OAUTH_PROVIDERS: Record<Platform, OAuthProvider> = {
  youtube: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: youtubeClientId,
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
    redirectUri: youtubeRedirectUri
  },
  tiktok: {
    url: 'https://www.tiktok.com/v2/auth/authorize/',
    clientKey: tikTokClientId,
    scope: 'user.info.basic,video.list,video.upload',
    redirectUri: tikTokRedirectUri
  },
  facebook: {
    url: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID,
    scope: 'email pages_show_list pages_read_engagement pages_manage_posts publish_video',
    redirectUri: window.location.origin + '/dashboard/connections'
  },
  instagram: {
    url: 'https://api.instagram.com/oauth/authorize',
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID,
    scope: 'user_profile user_media',
    redirectUri: window.location.origin + '/dashboard/connections'
  },
  linkedin: {
    url: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
    scope: 'r_liteprofile r_emailaddress w_member_social',
    redirectUri: window.location.origin + '/dashboard/connections'
  },
  twitter: {
    url: 'https://twitter.com/i/oauth2/authorize',
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID,
    scope: 'tweet.read tweet.write users.read',
    redirectUri: window.location.origin + '/dashboard/connections'
  }
};

export async function initiateSocialAuth(platform: Platform) {
  try {
    console.log(`Initialisation de l'authentification ${platform}...`);
    
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

    // Gestion spéciale pour TikTok
    if (platform === 'tiktok') {
      if (!('clientKey' in provider) || !provider.clientKey) {
        console.error("Configuration TikTok manquante: clientKey non définie");
        throw new Error("Configuration TikTok manquante. Impossible de se connecter.");
      }

      console.log("Redirection vers l'autorisation TikTok...");
      console.log("Client Key:", provider.clientKey.substring(0, 5) + '...');
      
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
    
    // Gestion pour YouTube
    else if (platform === 'youtube') {
      if (!('clientId' in provider) || !provider.clientId) {
        console.error("Configuration YouTube manquante: clientId non défini");
        throw new Error("Configuration YouTube manquante. Impossible de se connecter.");
      }
      
      console.log("Redirection vers l'autorisation YouTube...");
      console.log("Client ID:", provider.clientId.substring(0, 5) + '...');
      
      const params = new URLSearchParams();
      params.append('client_id', provider.clientId);
      params.append('redirect_uri', provider.redirectUri);
      params.append('response_type', 'code');
      params.append('scope', provider.scope);
      params.append('state', state);
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
      
      const fullUrl = `${provider.url}?${params.toString()}`;
      console.log('URL de redirection YouTube:', fullUrl);
      
      window.location.href = fullUrl;
      return;
    }
    
    // Gestion des autres plateformes
    else {
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
    // Pour TikTok
    if (platform === 'tiktok') {
      console.log("Traitement du retour OAuth TikTok");
      
      // Dans un environnement réel, on appelerait la fonction Edge pour échanger le code contre un token
      // Pour cet exemple, nous simulerons une connexion réussie
      
      const sandboxUserId = `tiktok_sandbox_${Math.random().toString(36).substring(2)}`;
      const token = "sandbox_token_" + Math.random().toString(36).substring(2);
      const refresh = "sandbox_refresh_" + Math.random().toString(36).substring(2);
      
      // Sauvegarder les informations dans la base de données
      const { error: saveError } = await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: 'tiktok',
          platform_user_id: sandboxUserId,
          platform_username: "TikTok Sandbox User",
          access_token: token,
          refresh_token: refresh,
          metadata: {
            sandbox_mode: true,
            scopes: OAUTH_PROVIDERS.tiktok.scope.split(',')
          }
        }, {
          onConflict: 'user_id,platform'
        });
        
      if (saveError) {
        throw saveError;
      }
      
      return { platform: 'tiktok', sandbox: true };
    }
    
    // Gérer l'authentification YouTube
    else if (platform === 'youtube') {
      console.log("Traitement du retour OAuth YouTube");
      
      // Échanger le code contre un token d'accès via le backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          code, 
          redirect_uri: OAUTH_PROVIDERS.youtube.redirectUri 
        })
      });
      
      console.log("Réponse reçue du serveur YouTube Auth:", response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Erreur détaillée du serveur:", error);
        throw new Error(`Erreur d'authentification YouTube: ${error.message || response.statusText}`);
      }
      
      const authData = await response.json();
      console.log("Données d'authentification YouTube reçues:", authData.channel_name);
      
      // Sauvegarder les informations dans la base de données
      const { error: saveError } = await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: 'youtube',
          platform_user_id: authData.channel_id,
          platform_username: authData.channel_name,
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          metadata: {
            profile: authData.profile,
            scopes: authData.scopes
          }
        }, {
          onConflict: 'user_id,platform'
        });
        
      if (saveError) {
        throw saveError;
      }
      
      return { platform: 'youtube', success: true };
    } 
    
    // Gérer les autres plateformes
    else {
      return { platform };
    }
  } catch (error) {
    console.error('Erreur durant le rappel OAuth:', error);
    throw error;
  }
}
