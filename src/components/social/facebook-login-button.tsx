
import { useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth';
import { useToast } from '../ui/toast';
import { useFacebookAuth } from '../../hooks/useFacebookAuth';

declare global {
  interface Window {
    checkLoginState: () => void;
  }
}

interface FacebookLoginButtonProps {
  onConnected?: (data: any) => void;
}

export function FacebookLoginButton({ onConnected }: FacebookLoginButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fbAuthStatus, isLoading, login } = useFacebookAuth();
  const buttonRef = useRef<HTMLDivElement>(null);

  // Définir la fonction de callback globale pour le bouton FB
  useEffect(() => {
    // Définir la fonction de callback globale que le bouton FB appellera
    window.checkLoginState = () => {
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Vous devez être connecté pour lier votre compte Facebook",
        });
        return;
      }

      // Le bouton FB appellera FB.login pour nous, donc nous utilisons notre fonction login existante
      login().then((response) => {
        if (response && response.status === 'connected' && onConnected) {
          const callbackData = {
            userInfo: response.profile,
            pages: response.pages,
            instagramAccounts: response.instagramAccounts
          };
          onConnected(callbackData);
        }
      }).catch((error) => {
        console.error("Erreur lors de la connexion à Facebook:", error);
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la connexion à Facebook"
        });
      });
    };

    return () => {
      // Nettoyer la fonction globale à la suppression du composant
      delete window.checkLoginState;
    };
  }, [user, toast, login, onConnected]);

  // Rendre le bouton FB natif
  useEffect(() => {
    // Vérifier si le SDK FB est chargé
    if (window.FB && buttonRef.current) {
      // Forcer le rendu XFBML du bouton
      window.FB.XFBML.parse(buttonRef.current);
    }
  }, [buttonRef]);

  return (
    <div className="fb-login-container">
      {/* Conteneur pour le bouton FB natif */}
      <div ref={buttonRef}>
        <div 
          className="fb-login-button" 
          data-width=""
          data-size="large" 
          data-button-type="continue_with" 
          data-layout="default" 
          data-auto-logout-link="false" 
          data-use-continue-as="true"
          data-onlogin="checkLoginState();"
        ></div>
      </div>

      {/* Afficher un message de chargement si besoin */}
      {isLoading && (
        <div className="text-sm text-gray-500 mt-2">
          Connexion en cours...
        </div>
      )}
    </div>
  );
}
