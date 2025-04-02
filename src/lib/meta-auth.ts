
import { supabase } from './supabase';

// Paramètres de configuration Meta
const FACEBOOK_APP_ID = '990797112672585';
const INSTAGRAM_APP_ID = '525008276969587';

// Fonction générique pour l'authentification Meta
export function initiateMetaAuth(platform: 'facebook' | 'instagram') {
  if (platform === 'facebook') {
    return initiateFacebookAuth();
  } else if (platform === 'instagram') {
    return initiateInstagramAuth();
  } else {
    throw new Error('Plateforme non supportée');
  }
}

// Fonctions pour l'authentification Meta
export async function initiateFacebookAuth() {
  // Générer et sauvegarder l'état pour la vérification CSRF
  const state = Math.random().toString(36).substring(2);
  sessionStorage.setItem('meta_auth_state', state);
  sessionStorage.setItem('meta_auth_platform', 'facebook');

  // URL d'autorisation
  const redirectUri = `${window.location.origin}/dashboard/connections`;
  const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}&response_type=code`;

  window.location.href = authUrl;
}

export async function initiateInstagramAuth() {
  // Générer et sauvegarder l'état pour la vérification CSRF
  const state = Math.random().toString(36).substring(2);
  sessionStorage.setItem('meta_auth_state', state);
  sessionStorage.setItem('meta_auth_platform', 'instagram');

  // URL d'autorisation
  const redirectUri = `${window.location.origin}/dashboard/connections`;
  const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_posts';

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;

  window.location.href = authUrl;
}

export async function handleMetaOAuthCallback(code: string, state: string, platform: 'facebook' | 'instagram') {
  // Vérifier l'état pour prévenir les attaques CSRF
  const savedState = sessionStorage.getItem('meta_auth_state');
  const savedPlatform = sessionStorage.getItem('meta_auth_platform');

  if (state !== savedState || platform !== savedPlatform) {
    throw new Error("État ou plateforme invalide");
  }

  try {
    // Échanger le code contre un token d'accès
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: {
        code,
        platform,
        redirect_uri: `${window.location.origin}/dashboard/connections`
      }
    });

    if (error) throw error;
    if (!data) throw new Error("Aucune donnée reçue");

    // Nettoyer les données de session
    sessionStorage.removeItem('meta_auth_state');
    sessionStorage.removeItem('meta_auth_platform');

    return data;
  } catch (error) {
    console.error('Error handling Meta OAuth callback:', error);
    throw error;
  }
}
