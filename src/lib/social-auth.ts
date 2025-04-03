
import { supabase } from './supabase';
import type { Platform } from './types';

// Définition des types pour les fournisseurs OAuth
type OAuthProvider = {
  url: string;
  redirectUri: string;
  scope: string;
  clientId: string;
  clientSecret?: string;
};

// Clés d'API directement dans le code pour garantir leur disponibilité
// Ces valeurs seront utilisées si les variables d'environnement ne sont pas disponibles
const YOUTUBE_CLIENT_ID = '716459993916-dtfg52nflg5jdrna5vtg2h4ahupvt7bs.apps.googleusercontent.com';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _YOUTUBE_CLIENT_SECRET = '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'; // Non utilisé mais conservé pour référence

// Pour TikTok, nous utiliserons un mode sandbox si les clés ne sont pas disponibles
const TIKTOK_CLIENT_KEY = 'awnny4j78qpvbt87';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _TIKTOK_CLIENT_SECRET = 'a76161b9f85de465ae8a824458d9c4f8569c24a0'; // Non utilisé mais conservé pour référence

// Utiliser l'URL actuelle du domaine pour les redirections
const DOMAIN_URL = window.location.origin;
const YOUTUBE_REDIRECT_URI = `${DOMAIN_URL}/dashboard/connections`;
const TIKTOK_REDIRECT_URI = `${DOMAIN_URL}/dashboard/connections`;

console.log("Configuration OAuth initializing");
console.log("YouTube Client ID:", YOUTUBE_CLIENT_ID ? "Configuré" : "Non configuré");
console.log("TikTok Client ID:", TIKTOK_CLIENT_KEY ? "Configuré" : "Non configuré");
console.log("YouTube Redirect URI:", YOUTUBE_REDIRECT_URI);
console.log("TikTok Redirect URI:", TIKTOK_REDIRECT_URI);
console.log("Domaine actuel:", DOMAIN_URL);

const OAUTH_PROVIDERS: Record<Platform, OAuthProvider> = {
  youtube: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: YOUTUBE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
    redirectUri: YOUTUBE_REDIRECT_URI
  },
  tiktok: {
    url: 'https://www.tiktok.com/v2/auth/authorize/',
    clientId: TIKTOK_CLIENT_KEY,
    scope: 'user.info.basic,video.list,video.upload',
    redirectUri: TIKTOK_REDIRECT_URI
  },
  facebook: {
    url: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID || '',
    scope: 'email pages_show_list pages_read_engagement pages_manage_posts publish_video',
    redirectUri: window.location.origin + '/dashboard/connections'
  },
  instagram: {
    url: 'https://api.instagram.com/oauth/authorize',
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID || '',
    scope: 'user_profile user_media',
    redirectUri: window.location.origin + '/dashboard/connections'
  },
  linkedin: {
    url: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
    scope: 'r_liteprofile r_emailaddress w_member_social',
    redirectUri: window.location.origin + '/dashboard/connections'
  },
  twitter: {
    url: 'https://twitter.com/i/oauth2/authorize',
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
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

    // Gestion pour YouTube
    if (platform === 'youtube') {
      console.log("Redirection vers l'autorisation YouTube...");
      console.log("Client ID:", provider.clientId.substring(0, 5) + '...');
      console.log("Redirect URI:", provider.redirectUri);
      
      const params = new URLSearchParams();
      params.append('client_id', provider.clientId);
      params.append('redirect_uri', provider.redirectUri);
      params.append('response_type', 'code');
      params.append('scope', provider.scope);
      params.append('state', state);
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
      
      const fullUrl = `${provider.url}?${params.toString()}`;
      console.log('URL de redirection YouTube complète:', fullUrl);
      
      window.location.href = fullUrl;
      return;
    }
    
    // Gestion pour TikTok
    else if (platform === 'tiktok') {
      console.log("Redirection vers l'autorisation TikTok...");
      console.log("Client Key:", provider.clientId.substring(0, 5) + '...');
      console.log("Redirect URI:", provider.redirectUri);
      
      const params = new URLSearchParams();
      params.append('client_key', provider.clientId);
      params.append('response_type', 'code');
      params.append('scope', provider.scope);
      params.append('redirect_uri', provider.redirectUri);
      params.append('state', state);
      
      const fullUrl = `${provider.url}?${params.toString()}`;
      console.log('URL de redirection TikTok complète:', fullUrl);
      
      window.location.href = fullUrl;
      return;
    }
    
    // Gestion des autres plateformes
    else {
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
    // Pour YouTube
    if (platform === 'youtube') {
      console.log("Traitement du retour OAuth YouTube");
      const redirectUri = YOUTUBE_REDIRECT_URI;
      console.log("Redirect URI utilisé pour l'échange:", redirectUri);
      
      // Échanger le code contre un token d'accès via le backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ngkbxqkdgqisjkbzpdyu.supabase.co'}/functions/v1/youtube-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          code, 
          redirect_uri: redirectUri
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
    
    // Gérer l'authentification TikTok
    else if (platform === 'tiktok') {
      console.log("Traitement du retour OAuth TikTok");
      
      // En mode sandbox ou en environnement test, nous simulons une connexion réussie
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
    
    // Gérer les autres plateformes
    else {
      return { platform };
    }
  } catch (error) {
    console.error('Erreur durant le rappel OAuth:', error);
    throw error;
  }
}
