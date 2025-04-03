
import type { Platform } from '../types';
import type { OAuthProvider } from './types';

// Déterminer l'URL de domaine actuelle pour les redirections
export const DOMAIN_URL = window.location.origin;

// YouTube configuration
export const YOUTUBE_CLIENT_ID = '716459993916-dtfg52nflg5jdrna5vtg2h4ahupvt7bs.apps.googleusercontent.com';
export const YOUTUBE_REDIRECT_URI = `${DOMAIN_URL}/dashboard/connections`;
/* eslint-disable @typescript-eslint/no-unused-vars */
// Secrets conservés en commentaire pour référence uniquement, ne sont pas utilisés dans le code frontend
// const YOUTUBE_CLIENT_SECRET = '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'; 
/* eslint-enable @typescript-eslint/no-unused-vars */

// TikTok configuration
export const TIKTOK_CLIENT_KEY = 'awnny4j78qpvbt87';
export const TIKTOK_REDIRECT_URI = `${DOMAIN_URL}/dashboard/connections`;
/* eslint-disable @typescript-eslint/no-unused-vars */
// Secrets conservés en commentaire pour référence uniquement, ne sont pas utilisés dans le code frontend
// const TIKTOK_CLIENT_SECRET = 'a76161b9f85de465ae8a824458d9c4f8569c24a0';
/* eslint-enable @typescript-eslint/no-unused-vars */

// Configuration des fournisseurs OAuth
export const OAUTH_PROVIDERS: Record<Platform, OAuthProvider> = {
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

// Journalisation de la configuration au démarrage
console.log("Configuration OAuth initializing");
console.log("YouTube Client ID:", YOUTUBE_CLIENT_ID ? "Configuré" : "Non configuré");
console.log("TikTok Client ID:", TIKTOK_CLIENT_KEY ? "Configuré" : "Non configuré");
console.log("YouTube Redirect URI:", YOUTUBE_REDIRECT_URI);
console.log("TikTok Redirect URI:", TIKTOK_REDIRECT_URI);
console.log("Domaine actuel:", DOMAIN_URL);
