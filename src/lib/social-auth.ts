
import { supabase } from './supabase';
import type { Platform } from './types';

type OAuthProvider = 
  | { url: string; redirectUri: string; scope: string; clientId: string; clientSecret?: string; }
  | { url: string; redirectUri: string; scope: string; clientKey: string; clientSecret?: string; };

// Configuration du mode sandbox pour TikTok
const TIKTOK_SANDBOX_MODE = false; // On désactive le mode sandbox simulé pour utiliser la vraie sandbox TikTok
const YOUTUBE_SANDBOX_MODE = false;

// Récupérer les variables d'environnement
const tikTokClientId = import.meta.env.VITE_TIKTOK_CLIENT_ID;
const tikTokClientSecret = import.meta.env.VITE_TIKTOK_CLIENT_SECRET;
const tikTokRedirectUri = import.meta.env.VITE_TIKTOK_REDIRECT_URI || window.location.origin + '/dashboard/connections';

// Variables YouTube
const youtubeClientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
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

    // Gestion spéciale pour TikTok - toujours utiliser la vraie API TikTok Sandbox
    if (platform === 'tiktok') {
      if ('clientKey' in provider) {
        console.log("Redirection vers l'autorisation TikTok Sandbox...");
        
        const params = new URLSearchParams();
        params.append('client_key', provider.clientKey);
        params.append('response_type', 'code');
        params.append('scope', provider.scope);
        params.append('redirect_uri', provider.redirectUri);
        params.append('state', state);
        
        const fullUrl = `${provider.url}?${params.toString()}`;
        console.log('URL de redirection TikTok Sandbox:', fullUrl);
        
        window.location.href = fullUrl;
        return;
      } else {
        throw new Error("Configuration TikTok incorrecte - clientKey manquante");
      }
    } 
    // Gestion pour YouTube - toujours en mode réel
    else if (platform === 'youtube') {
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
    // Pour TikTok, utiliser l'API TikTok Sandbox directement
    if (platform === 'tiktok') {
      console.log(`Traitement du retour OAuth TikTok (API Sandbox)`);
      
      // Ici, implémentation pour gérer le retour de l'API TikTok Sandbox
      // Cette partie serait à implémenter selon les spécifications de l'API TikTok Sandbox
      // Pour l'instant, nous utilisons une implémentation simplifiée
      
      const provider = OAUTH_PROVIDERS.tiktok;
      if (!('clientKey' in provider) || !provider.clientKey || !provider.clientSecret) {
        throw new Error("Configuration TikTok incorrecte");
      }
      
      // Dans un cas réel, ici on ferait l'échange du code contre un token
      // Mais pour cet exemple, nous simulons une connexion réussie
      
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
    // Gérer l'authentification YouTube en mode réel
    else if (platform === 'youtube') {
      console.log("Traitement du retour OAuth YouTube (mode réel)");
      
      // Échanger le code contre un token d'accès via le backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({ code, redirect_uri: OAUTH_PROVIDERS.youtube.redirectUri })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur d'authentification YouTube: ${error.message || response.statusText}`);
      }
      
      const authData = await response.json();
      
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
    // Gérer les autres plateformes (code existant)
    else {
      return { platform };
    }
  } catch (error) {
    console.error('Erreur durant le rappel OAuth:', error);
    throw error;
  }
}
