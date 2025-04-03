
import { useState, useEffect } from 'react';
import { FacebookSDK } from '../lib/facebook-sdk';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/toast';

// Définition du type pour la réponse de statut Facebook
export interface FacebookAuthResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    expiresIn: string;
    signedRequest: string;
    userID: string;
  };
  profile?: {
    id: string;
    name: string;
    email?: string;
  };
  pages?: any[];
  instagramAccounts?: any[];
}

export function useFacebookAuth() {
  const [fbAuthStatus, setFbAuthStatus] = useState<FacebookAuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fonction pour gérer le changement de statut
  const statusChangeCallback = async (response: any) => {
    console.log('Facebook status change:', response);
    
    // Si connecté, on récupère les informations supplémentaires
    if (response.status === 'connected') {
      try {
        // Récupérer profil utilisateur
        const profile = await FacebookSDK.getUserInfo();
        
        // Récupérer les pages
        const pages = await FacebookSDK.getUserPages();
        
        // Récupérer les comptes Instagram associés
        const instagramAccounts = await FacebookSDK.getInstagramAccounts(pages);
        
        // Mettre à jour l'état avec toutes les informations
        setFbAuthStatus({
          ...response,
          profile,
          pages,
          instagramAccounts
        });

        // Si l'utilisateur est connecté à notre app, enregistrer dans Supabase
        if (user) {
          const { error } = await supabase
            .from('social_connections')
            .upsert({
              user_id: user.id,
              platform: 'facebook',
              platform_user_id: profile.id,
              platform_username: profile.name,
              access_token: response.authResponse.accessToken,
              metadata: { 
                profile, 
                pages,
                instagram_accounts: instagramAccounts
              }
            }, {
              onConflict: 'user_id, platform'
            });

          if (error) {
            console.error("Erreur lors de l'enregistrement dans Supabase:", error);
            toast({
              title: "Erreur",
              description: "Impossible d'enregistrer la connexion Facebook"
            });
          } else {
            toast({
              title: "Connexion réussie",
              description: "Votre compte Facebook a été connecté avec succès"
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données Facebook:", error);
        setFbAuthStatus(response);
      }
    } else {
      // Si non connecté, on garde simplement le statut
      setFbAuthStatus(response);
    }
    
    setIsLoading(false);
  };

  // Vérification du statut de connexion au chargement
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        if (FacebookSDK.isLoaded()) {
          const response = await FacebookSDK.getLoginStatus();
          statusChangeCallback(response);
        } else {
          // Si le SDK n'est pas chargé, on attend et on réessaie
          const checkInterval = setInterval(() => {
            if (FacebookSDK.isLoaded()) {
              clearInterval(checkInterval);
              FacebookSDK.getLoginStatus().then(statusChangeCallback);
            }
          }, 1000);
          
          // Nettoyage en cas de démontage du composant
          return () => clearInterval(checkInterval);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut de connexion:", error);
        setIsLoading(false);
      }
    };
    
    checkLoginStatus();
  }, [user]);

  // Fonction pour se connecter à Facebook
  const login = async () => {
    if (!FacebookSDK.isLoaded()) {
      toast({
        title: "Erreur",
        description: "Le SDK Facebook n'est pas chargé correctement"
      });
      return null;
    }
    
    setIsLoading(true);
    try {
      const response = await FacebookSDK.login();
      await statusChangeCallback(response);
      return response;
    } catch (error) {
      console.error("Erreur de connexion Facebook:", error);
      toast({
        title: "Erreur",
        description: "Échec de la connexion à Facebook"
      });
      setIsLoading(false);
      return null;
    }
  };

  // Fonction pour se déconnecter de Facebook
  const logout = async () => {
    if (!FacebookSDK.isLoaded()) return;
    
    try {
      await FacebookSDK.logout();
      setFbAuthStatus({
        status: 'unknown'
      });
      
      // Si connecté à notre app, on supprime la connexion de Supabase
      if (user) {
        await supabase
          .from('social_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('platform', 'facebook');
        
        toast({
          title: "Déconnexion réussie",
          description: "Vous êtes déconnecté de Facebook"
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Échec de la déconnexion de Facebook"
      });
    }
  };

  return {
    fbAuthStatus,
    isLoading,
    login,
    logout
  };
}
