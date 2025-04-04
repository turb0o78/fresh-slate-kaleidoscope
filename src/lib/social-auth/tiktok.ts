
import { supabase } from '../supabase';
import type { OAuthResult } from './types';

export async function handleTikTokCallback(
  user: { id: string },
  code?: string
): Promise<OAuthResult> {
  console.log("Traitement du retour OAuth TikTok");
  console.log("Code d'autorisation reçu:", code ? "Oui" : "Non");
  
  // Si nous avons un code d'autorisation réel, on pourrait l'utiliser pour obtenir un token
  // Mais pour l'instant, nous utilisons le mode sandbox car l'échange de token se fait côté serveur
  const useRealFlow = false;
  
  if (useRealFlow && code) {
    console.log("Utilisation du flux d'authentification TikTok réel avec le code reçu");
    // Ce code devrait être implémenté côté serveur avec un Edge Function
    // car il nécessite le client_secret qui ne peut pas être exposé côté client
  } else {
    // En mode sandbox ou en environnement test, nous simulons une connexion réussie
    console.log("Utilisation du mode sandbox pour TikTok");
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
  
  // Ce code ne devrait pas être atteint avec l'implémentation actuelle
  return { platform: 'tiktok', success: true, sandbox: true };
}
