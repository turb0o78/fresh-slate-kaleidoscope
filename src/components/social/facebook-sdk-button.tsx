
import { useState } from 'react';
import { Button } from '../ui/button';
import { Facebook, Loader2 } from 'lucide-react';
import { FacebookSDK } from '../../lib/facebook-sdk';
import { useToast } from '../ui/toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

interface FacebookSDKButtonProps {
  onConnected?: (data: any) => void;
}

export function FacebookSDKButton({ onConnected }: FacebookSDKButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLogin = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour lier votre compte Facebook",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Vérifier si le SDK est chargé
      if (!FacebookSDK.isLoaded()) {
        throw new Error("Le SDK Facebook n'est pas chargé correctement");
      }

      // Lancer le processus de connexion
      const loginResponse = await FacebookSDK.login();
      
      if (!loginResponse.authResponse) {
        throw new Error("Échec de la connexion à Facebook");
      }

      // Récupérer les informations de l'utilisateur
      const userInfo = await FacebookSDK.getUserInfo();
      
      // Récupérer les pages de l'utilisateur
      const pages = await FacebookSDK.getUserPages();
      
      // Récupérer les comptes Instagram associés
      const instagramAccounts = await FacebookSDK.getInstagramAccounts(pages);

      // Enregistrer les données dans Supabase
      const { error } = await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: 'facebook',
          platform_user_id: userInfo.id,
          platform_username: userInfo.name,
          access_token: loginResponse.authResponse.accessToken,
          metadata: { 
            profile: userInfo, 
            pages,
            instagram_accounts: instagramAccounts
          }
        }, {
          onConflict: 'user_id, platform'
        });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Votre compte Facebook a été connecté avec succès"
      });

      if (onConnected) {
        onConnected({
          userInfo,
          pages,
          instagramAccounts
        });
      }

    } catch (error) {
      console.error("Erreur lors de la connexion à Facebook:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la connexion à Facebook"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Facebook className="h-4 w-4 mr-2" />
      )}
      Se connecter avec Facebook
    </Button>
  );
}
