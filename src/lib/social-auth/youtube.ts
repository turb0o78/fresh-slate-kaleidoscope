
import { supabase } from '../supabase';
import type { OAuthResult } from './types';

export async function handleYouTubeCallback(
  code: string,
  user: { id: string }, 
  redirectUri: string
): Promise<OAuthResult> {
  console.log("Traitement du retour OAuth YouTube");
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
