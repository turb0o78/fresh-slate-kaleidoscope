
import { useState } from 'react';
import { Button } from '../ui/button';
import { Youtube, Plus, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';
import type { SocialConnection } from '../../lib/types';
import { useToast } from '../ui/toast';

interface YouTubeButtonProps {
  connection?: SocialConnection;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  isLoading?: boolean;
}

export function YouTubeButton({ connection, onConnect, onDisconnect, isLoading }: YouTubeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const { toast } = useToast();
  
  // Déterminer si le compte est en mode sandbox
  const isSandboxMode = connection?.metadata?.sandbox_mode === true;
  
  const handleConnect = async () => {
    try {
      setLocalLoading(true);
      setShowError(false);
      console.log("Tentative de connexion à YouTube...");
      await onConnect();
    } catch (error) {
      console.error("Erreur lors de la connexion à YouTube:", error);
      setShowError(true);
      toast({
        title: "Échec de connexion",
        description: error instanceof Error ? error.message : "Erreur lors de la connexion à YouTube",
        type: "error"
      });
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-secondary-100"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-red-50 p-2.5 rounded-xl">
            <Youtube className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-lg">YouTube</h3>
            {connection && (
              <p className="text-sm text-gray-500 mt-1">
                Connecté en tant que {connection.platform_username}
                {isSandboxMode && (
                  <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                    Sandbox
                  </span>
                )}
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
                disabled={isLoading || localLoading}
              >
                {isLoading || localLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1.5" />
                )}
                <span>Déconnecter</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2 text-primary bg-primary-50 rounded-full py-1 px-3">
                <Check className="h-4 w-4" />
                <span className="text-xs font-medium">Connecté</span>
              </div>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isLoading || localLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {(isLoading || localLoading) ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Connecter
          </Button>
        )}
      </div>

      {showError && !connection && (
        <div className="bg-red-50 rounded-lg p-3 mt-3 mb-3 flex items-center space-x-3 border border-red-200">
          <div className="bg-red-100 p-1.5 rounded-full">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
          </div>
          <div className="flex-1">
            <span className="text-sm text-red-700">
              Problème de connexion. Vérifiez que les URLs de redirection correspondent dans la console Google.
            </span>
          </div>
        </div>
      )}

      {connection && (
        <div className="bg-secondary-50 rounded-lg p-3 flex items-center space-x-3">
          <div className="bg-green-100 p-1.5 rounded-full">
            <Check className="h-3.5 w-3.5 text-green-600" />
          </div>
          <div className="flex-1">
            <span className="text-sm text-secondary-700">
              Connecté le {new Date(connection.created_at).toLocaleDateString("fr-FR", {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}

      {!connection && (
        <div className="bg-secondary-50 rounded-lg p-4 border border-dashed border-secondary-200 text-center">
          <p className="text-sm text-secondary-600">
            Connectez votre compte YouTube pour permettre le cross-posting et le suivi analytique.
          </p>
        </div>
      )}
    </div>
  );
}
