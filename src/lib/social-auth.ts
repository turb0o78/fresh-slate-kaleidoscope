import { supabase } from './supabase';
import type { Platform } from './types';

type OAuthProvider = 
  | { url: string; redirectUri: string; scope: string; clientId: string; clientSecret?: string; }
  | { url: string; redirectUri: string; scope: string; clientKey: string; clientSecret?: string; };

// Mode Sandbox forcé pour TikTok et YouTube
const SANDBOX_MODE = true;

// Configuration TikTok en mode sandbox
const SANDBOX_TIKTOK_CLIENT_KEY = 'sandbox_mode_client_key';
const SANDBOX_TIKTOK_CLIENT_SECRET = 'sandbox_mode_client_secret';

// Configuration YouTube en mode sandbox
const SANDBOX_YOUTUBE_CLIENT_ID = 'sandbox_youtube_client_id';
const SANDBOX_YOUTUBE_CLIENT_SECRET = 'sandbox_youtube_client_secret';

// Log de la configuration en mode sandbox
console.log("Mode Sandbox forcé:", {
  mode: "SANDBOX_MODE",
  tiktok: {
    clientKey: SANDBOX_TIKTOK_CLIENT_KEY
  },
  youtube: {
    clientId: SANDBOX_YOUTUBE_CLIENT_ID
  }
});

// Récupérer les variables d'environnement réelles (seront utilisées si disponibles)
const tikTokClientId = import.meta.env.VITE_TIKTOK_CLIENT_ID || SANDBOX_TIKTOK_CLIENT_KEY;
const tikTokClientSecret = import.meta.env.VITE_TIKTOK_CLIENT_SECRET || SANDBOX_TIKTOK_CLIENT_SECRET;
const tikTokRedirectUri = import.meta.env.VITE_TIKTOK_REDIRECT_URI || window.location.origin + '/dashboard/connections';

// Variables YouTube
const youtubeClientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID || SANDBOX_YOUTUBE_CLIENT_ID;
const youtubeRedirectUri = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || window.location.origin + '/dashboard/connections';

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

    // Gestion spéciale pour TikTok
    if (platform === 'tiktok') {
      if (SANDBOX_MODE) {
        console.log("Mode Sandbox TikTok activé - Simulant l'authentification...");
        simulateSandboxAuth(platform, state);
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
    } 
    // Gestion pour YouTube
    else if (platform === 'youtube') {
      if (SANDBOX_MODE) {
        console.log("Mode Sandbox YouTube activé - Simulant l'authentification...");
        simulateSandboxAuth(platform, state);
        return;
      }
      
      if ('clientId' in provider) {
        console.log("Redirection vers l'autorisation YouTube...");
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

// Fonction pour simuler l'authentification en mode sandbox
async function simulateSandboxAuth(platform: Platform, state: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non authentifié");
    
    console.log(`Simulation de connexion ${platform} en mode sandbox pour l'utilisateur:`, user.id);
    
    const sandboxUserId = `sandbox_${platform}_` + Math.random().toString(36).substring(2);
    const platformData = getPlatformSandboxData(platform);
    
    // Créer une connexion sandbox dans la base de données
    const { error: saveError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: user.id,
        platform: platform,
        platform_user_id: sandboxUserId,
        platform_username: platformData.username,
        access_token: platformData.token,
        refresh_token: platformData.refresh,
        metadata: platformData.metadata,
      }, {
        onConflict: 'user_id,platform',
      });

    if (saveError) {
      console.error(`Erreur lors de l'enregistrement de la connexion sandbox ${platform}:`, saveError);
      throw saveError;
    }
    
    console.log(`Connexion ${platform} sandbox créée avec succès`);
    
    // Rediriger vers la page des connexions pour rafraîchir l'UI
    window.location.href = '/dashboard/connections';
    
  } catch (error) {
    console.error("Erreur lors de la simulation d'authentification:", error);
    alert(`Erreur lors de la connexion ${platform} en mode sandbox: ` + (error instanceof Error ? error.message : "Erreur inconnue"));
  }
}

// Fonction pour générer des données sandbox spécifiques à la plateforme
function getPlatformSandboxData(platform: Platform) {
  const token = "sandbox_token_" + Math.random().toString(36).substring(2);
  const refresh = "sandbox_refresh_" + Math.random().toString(36).substring(2);
  
  if (platform === 'tiktok') {
    return {
      username: "TikTok Sandbox User",
      token,
      refresh,
      metadata: {
        profile: {
          data: {
            user: {
              open_id: "sandbox_tiktok_id",
              display_name: "TikTok Sandbox User",
              avatar_url: "https://via.placeholder.com/150"
            }
          }
        },
        scopes: OAUTH_PROVIDERS.tiktok.scope.split(','),
        sandbox_mode: true
      }
    };
  } else if (platform === 'youtube') {
    return {
      username: "YouTube Sandbox User",
      token,
      refresh,
      metadata: {
        profile: {
          items: [
            {
              id: "sandbox_youtube_channel",
              snippet: {
                title: "YouTube Sandbox Channel",
                description: "Chaîne YouTube en mode sandbox pour tests",
                thumbnails: {
                  default: { url: "https://via.placeholder.com/88" },
                  medium: { url: "https://via.placeholder.com/240" },
                  high: { url: "https://via.placeholder.com/800" }
                }
              },
              statistics: {
                viewCount: "1234",
                subscriberCount: "100",
                videoCount: "10"
              }
            }
          ]
        },
        scopes: OAUTH_PROVIDERS.youtube.scope.split(' '),
        sandbox_mode: true,
        videos: generateSandboxYouTubeVideos(5)
      }
    };
  } else {
    return {
      username: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Sandbox User`,
      token,
      refresh,
      metadata: {
        sandbox_mode: true
      }
    };
  }
}

// Génère une liste de vidéos YouTube fictives pour le mode sandbox
function generateSandboxYouTubeVideos(count: number = 5) {
  const videos = [];
  const categories = ['Divertissement', 'Sport', 'Musique', 'Jeux vidéo', 'Éducation', 'Voyage'];
  const titles = [
    'Comment j\'ai doublé ma productivité',
    'Meilleurs conseils pour débuter',
    'Tuto complet pour débutants',
    'Critique de mon nouveau matériel',
    'Ma journée en immersion',
    'Pourquoi j\'ai changé de stratégie',
    'Je teste pendant 30 jours',
    'Ce que personne ne vous dit sur'
  ];
  const prefixes = ['INCROYABLE', 'WOW', 'RÉVÉLATION', 'ENFIN', 'EXCLUSIF'];
  
  for (let i = 0; i < count; i++) {
    const title = `${prefixes[Math.floor(Math.random() * prefixes.length)]} : ${titles[Math.floor(Math.random() * titles.length)]}`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const viewCount = Math.floor(Math.random() * 100000);
    const likeCount = Math.floor(viewCount * (Math.random() * 0.2));
    const commentCount = Math.floor(likeCount * (Math.random() * 0.3));
    const daysAgo = Math.floor(Math.random() * 60);
    const publishDate = new Date();
    publishDate.setDate(publishDate.getDate() - daysAgo);
    
    videos.push({
      id: `sandbox_video_${i}_${Math.random().toString(36).substring(2)}`,
      snippet: {
        title,
        description: `Description détaillée de la vidéo ${title.toLowerCase()}. Cette vidéo parle de ${category.toLowerCase()} et vous montre comment améliorer vos compétences.`,
        publishedAt: publishDate.toISOString(),
        thumbnails: {
          default: { url: `https://picsum.photos/seed/${i+1}/120/90` },
          medium: { url: `https://picsum.photos/seed/${i+1}/320/180` },
          high: { url: `https://picsum.photos/seed/${i+1}/640/480` },
          standard: { url: `https://picsum.photos/seed/${i+1}/1280/720` }
        },
        categoryId: String(i + 10),
        categoryName: category,
        tags: [`${category}`, 'tutoriel', 'conseils', 'astuces']
      },
      statistics: {
        viewCount: String(viewCount),
        likeCount: String(likeCount),
        commentCount: String(commentCount)
      },
      status: {
        privacyStatus: i % 3 === 0 ? 'private' : 'public',
        uploadStatus: 'processed'
      },
      contentDetails: {
        duration: `PT${Math.floor(Math.random() * 15) + 2}M${Math.floor(Math.random() * 59)}S`,
        dimension: 'hd',
      },
      player: {
        videoUrl: `https://www.youtube.com/watch?v=sandbox_${i}`
      }
    });
  }
  
  return videos;
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
    if (SANDBOX_MODE && (platform === 'tiktok' || platform === 'youtube')) {
      // En mode sandbox, simuler une connexion réussie
      console.log(`Traitement du retour OAuth ${platform} (sandbox)`);
      
      const platformData = getPlatformSandboxData(platform);
      
      const { error: saveError } = await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: platform,
          platform_user_id: `sandbox_${platform}_id`,
          platform_username: platformData.username,
          access_token: platformData.token,
          refresh_token: platformData.refresh,
          metadata: platformData.metadata,
        }, {
          onConflict: 'user_id,platform',
        });

      if (saveError) {
        console.error(`Erreur lors de l'enregistrement de la connexion sandbox ${platform}:`, saveError);
        throw saveError;
      }
      
      return { platform: platform, sandbox: true };
    }

    return { platform };
  } catch (error) {
    console.error('Erreur durant le rappel OAuth:', error);
    throw error;
  }
}
