
import type { Platform } from '../types';

// Définition des types pour les fournisseurs OAuth
export type OAuthProvider = {
  url: string;
  redirectUri: string;
  scope: string;
  clientId: string;
  clientSecret?: string;
};

// Type pour les résultats des opérations OAuth
export interface OAuthResult {
  platform: Platform;
  success: boolean;
  sandbox?: boolean;
}
