
import { useState } from 'react';
import { Button } from '../ui/button';
import { Music, Plus, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';
import { initiateSocialAuth } from '../../lib/social-auth';
import type { SocialConnection } from '../../lib/types';
import { useToast } from '../../components/ui/toast';

interface TikTokButtonProps {
  connection?: SocialConnection;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  isLoading?: boolean;
}

export function TikTokButton({ connection, onConnect, onDisconnect, isLoading }: TikTokButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleConnect = async () => {
    try {
      setLocalLoading(true);
      setError(null);
      
      // Vérifier si les identifiants TikTok sont configurés
      if (!import.meta.env.VITE_TIKTOK_CLIENT_ID) {
        setError("Clé d'application TikTok (client_key) non configurée");
        toast({
          title: "Erreur de configuration",
          description: "Clé d'application TikTok non configurée",
          type: "error"
        });
        return;
      }
      
      console.log("Tentative de connexion à TikTok...");
      console.log("Client ID disponible:", !!import.meta.env.VITE_TIKTOK_CLIENT_ID);
      
      // Utiliser la fonction de connexion TikTok de social-auth.ts
      await initiateSocialAuth('tiktok');
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'authentification TikTok:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      toast({
        title: "Échec de connexion",
        description: error instanceof Error ? error.message : "Erreur lors de la connexion à TikTok",
        type: "error"
      });
    } finally {
      // Le chargement sera réinitialisé lorsque l'utilisateur reviendra du flux d'autorisation
      setLocalLoading(false);
    }
  };

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-secondary-100 transition-all duration-300 ${connection ? 'hover:border-primary-100' : ''}`}
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-pink-50 p-2.5 rounded-xl">
            <Music className="h-6 w-6 text-pink-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">TikTok</h3>
            {connection && (
              <p className="text-sm text-secondary-500 mt-1">
                Connected as {connection.platform_username || connection.platform_user_id}
              </p>
            )}
          </div>
        </div>
        
        {connection ? (
          <div className="flex items-center space-x-2">
            {isHovered ? (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                onClick={() => onDisconnect(connection.id)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                <span>Disconnect</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2 text-primary bg-primary-50 rounded-full py-1 px-3">
                <Check className="h-4 w-4" />
                <span className="text-xs font-medium">Connected</span>
              </div>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isLoading || localLoading}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {(isLoading || localLoading) ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Connect
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-3 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {connection && (
        <div className="bg-secondary-50 rounded-lg p-3 flex items-center space-x-3">
          <div className="bg-green-100 p-1.5 rounded-full">
            <Check className="h-3.5 w-3.5 text-green-600" />
          </div>
          <div className="flex-1">
            <span className="text-sm text-secondary-700">
              Connected on {new Date(connection.created_at).toLocaleDateString("en-US", {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}

      {!connection && !error && (
        <div className="bg-secondary-50 rounded-lg p-4 border border-dashed border-secondary-200 text-center">
          <p className="text-sm text-secondary-600">
            Connect your TikTok account to enable cross-posting and analytics tracking
          </p>
        </div>
      )}
    </div>
  );
}
