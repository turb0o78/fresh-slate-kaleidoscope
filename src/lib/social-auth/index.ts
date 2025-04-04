import { supabase } from '../supabase';
import type { Platform } from '../types';
import { OAUTH_PROVIDERS, YOUTUBE_REDIRECT_URI } from './config';
import { handleYouTubeCallback } from './youtube';
import { handleTikTokCallback } from './tiktok';

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
      console.log("Client Key:", provider.clientId);
      console.log("Redirect URI:", provider.redirectUri);
      
      const params = new URLSearchParams();
      params.append('client_key', provider.clientId);
      params.append('response_type', 'code');
      params.append('scope', provider.scope);
      params.append('redirect_uri', provider.redirectUri);
      params.append('state', state);
      
      const fullUrl = `${provider.url}?${params.toString()}`;
      console.log('URL de redirection TikTok complète:', fullUrl);
      
      setTimeout(() => {
        window.location.href = fullUrl;
      }, 100);
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

  console.log(`Traitement du callback OAuth pour ${platform} avec code: ${code.substring(0, 5)}...`);
  
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_platform');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  try {
    // Pour YouTube
    if (platform === 'youtube') {
      return await handleYouTubeCallback(code, user, YOUTUBE_REDIRECT_URI);
    } 
    
    // Gérer l'authentification TikTok
    else if (platform === 'tiktok') {
      return await handleTikTokCallback(user, code);
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

// Export des modules individuels
export * from './youtube';
export * from './tiktok';
