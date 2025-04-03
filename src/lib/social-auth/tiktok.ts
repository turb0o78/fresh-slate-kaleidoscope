
import { supabase } from '../supabase';
import type { OAuthResult } from './types';

export async function handleTikTokCallback(
  user: { id: string }
): Promise<OAuthResult> {
  console.log("Traitement du retour OAuth TikTok");
  
  // En mode sandbox ou en environnement test, nous simulons une connexion réussie
  const sandboxUserId = `tiktok_sandbox_${Math.random().toString(36).substring(2)}`;
  const token = "sandbox_token_" + Math.random().toString(36).substring(2);
  const refresh = "sandbox_refresh_" + Math.random().toString(36).substring(2);
  
  console.log("TikTok utilisant le mode sandbox avec l'utilisateur ID:", sandboxUserId);
  
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
        scopes: ['user.info.basic', 'video.list', 'video.upload']
      }
    }, {
      onConflict: 'user_id,platform'
    });
    
  if (saveError) {
    console.error("Erreur lors de l'enregistrement de la connexion TikTok:", saveError);
    throw saveError;
  }
  
  console.log("Connexion TikTok sauvegardée avec succès en mode sandbox");
  return { platform: 'tiktok', success: true, sandbox: true };
}
