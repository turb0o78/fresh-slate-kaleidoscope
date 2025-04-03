
import { supabase } from './supabase';
import type { Platform } from './types';

type OAuthProvider = 
  | { url: string; redirectUri: string; scope: string; clientId: string; clientSecret?: string; }
  | { url: string; redirectUri: string; scope: string; clientKey: string; clientSecret?: string; };

// Mode Sandbox forcé pour TikTok
const SANDBOX_MODE = true;
const SANDBOX_TIKTOK_CLIENT_KEY = 'sandbox_mode_client_key';
const SANDBOX_TIKTOK_CLIENT_SECRET = 'sandbox_mode_client_secret';

// Log de la configuration en mode sandbox
console.log("TikTok en mode Sandbox forcé:", {
  mode: "SANDBOX_MODE",
  clientKey: SANDBOX_TIKTOK_CLIENT_KEY
});

// Récupérer les variables d'environnement réelles (seront utilisées si disponibles)
const tikTokClientId = import.meta.env.VITE_TIKTOK_CLIENT_ID || SANDBOX_TIKTOK_CLIENT_KEY;
const tikTokClientSecret = import.meta.env.VITE_TIKTOK_CLIENT_SECRET || SANDBOX_TIKTOK_CLIENT_SECRET;
const tikTokRedirectUri = import.meta.env.VITE_TIKTOK_REDIRECT_URI || window.location.origin + '/dashboard/connections';

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

    if (platform === 'tiktok') {
      if (SANDBOX_MODE) {
        console.log("Mode Sandbox TikTok activé - Simulant l'authentification...");
        
        // En mode sandbox, nous simulons directement l'authentification réussie
        // sans rediriger vers TikTok
        const code = "sandbox_code_" + Math.random().toString(36).substring(2);
        
        console.log("Simulation de code d'autorisation:", code);
        console.log("Simulation d'état:", state);
        
        // Stocker les valeurs pour la simulation
        sessionStorage.setItem('sandbox_code', code);
        
        // Attendre un peu pour simuler le flux d'autorisation
        setTimeout(() => {
          // Simuler un retour d'autorisation
          console.log("Simulation de retour d'autorisation TikTok");
          handleSandboxAuth(code, state);
        }, 1500);
        
        return;
      }
      
      if ('clientKey' in provider) {
        console.log("Redirection vers l'autorisation TikTok...");
        
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

// Fonction pour simuler l'authentification en mode sandbox
async function handleSandboxAuth(code: string, state: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non authentifié");
    
    console.log("Simulation de connexion TikTok en mode sandbox pour l'utilisateur:", user.id);
    
    const sandboxUserId = "sandbox_" + Math.random().toString(36).substring(2);
    const sandboxUsername = "TikTok Sandbox User";
    const sandboxToken = "sandbox_token_" + Math.random().toString(36).substring(2);
    const sandboxRefresh = "sandbox_refresh_" + Math.random().toString(36).substring(2);
    
    // Créer une connexion sandbox dans la base de données
    const { error: saveError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: user.id,
        platform: 'tiktok',
        platform_user_id: sandboxUserId,
        platform_username: sandboxUsername,
        access_token: sandboxToken,
        refresh_token: sandboxRefresh,
        metadata: {
          profile: {
            data: {
              user: {
                open_id: sandboxUserId,
                display_name: sandboxUsername,
                avatar_url: "https://via.placeholder.com/150"
              }
            }
          },
          scopes: OAUTH_PROVIDERS.tiktok.scope.split(','),
          sandbox_mode: true
        },
      }, {
        onConflict: 'user_id,platform',
      });

    if (saveError) {
      console.error('Erreur lors de l\'enregistrement de la connexion sandbox:', saveError);
      throw saveError;
    }
    
    console.log("Connexion TikTok sandbox créée avec succès");
    
    // Rediriger vers la page des connexions pour rafraîchir l'UI
    window.location.href = '/dashboard/connections';
    
  } catch (error) {
    console.error("Erreur lors de la simulation d'authentification:", error);
    alert("Erreur lors de la connexion TikTok en mode sandbox: " + (error instanceof Error ? error.message : "Erreur inconnue"));
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
      // En mode sandbox, simuler une connexion réussie
      console.log("Traitement du retour OAuth TikTok (sandbox)");
      
      const sandboxUserId = "sandbox_" + Math.random().toString(36).substring(2);
      const sandboxUsername = "TikTok Sandbox User";
      const sandboxToken = "sandbox_token_" + Math.random().toString(36).substring(2);
      const sandboxRefresh = "sandbox_refresh_" + Math.random().toString(36).substring(2);
      
      const { error: saveError } = await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: 'tiktok',
          platform_user_id: sandboxUserId,
          platform_username: sandboxUsername,
          access_token: sandboxToken,
          refresh_token: sandboxRefresh,
          metadata: {
            profile: {
              data: {
                user: {
                  open_id: sandboxUserId,
                  display_name: sandboxUsername,
                  avatar_url: "https://via.placeholder.com/150"
                }
              }
            },
            scopes: OAUTH_PROVIDERS.tiktok.scope.split(','),
            sandbox_mode: true
          },
        }, {
          onConflict: 'user_id,platform',
        });

      if (saveError) {
        console.error('Erreur lors de l\'enregistrement de la connexion sandbox:', saveError);
        throw saveError;
      }
      
      return { platform: 'tiktok', sandbox: true };
    }

    return { platform };
  } catch (error) {
    console.error('Erreur durant le rappel OAuth:', error);
    throw error;
  }
}
