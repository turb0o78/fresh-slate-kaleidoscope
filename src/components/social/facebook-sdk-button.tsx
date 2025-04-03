
import { useState } from 'react';
import { Button } from '../ui/button';
import { Facebook, Loader2 } from 'lucide-react';
import { useToast } from '../ui/toast';
import { useAuth } from '../../lib/auth';
import { useFacebookAuth } from '../../hooks/useFacebookAuth';

interface FacebookSDKButtonProps {
  onConnected?: (data: any) => void;
}

export function FacebookSDKButton({ onConnected }: FacebookSDKButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { login } = useFacebookAuth();

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
      // Utiliser le hook de connexion Facebook
      const loginResponse = await login();
      
      if (!loginResponse || loginResponse.status !== 'connected') {
        throw new Error("Échec de la connexion à Facebook");
      }

      // Récupérer les données Facebook pour les passer au callback
      const callbackData = {
        userInfo: loginResponse.profile,
        pages: loginResponse.pages,
        instagramAccounts: loginResponse.instagramAccounts
      };

      if (onConnected) {
        onConnected(callbackData);
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
