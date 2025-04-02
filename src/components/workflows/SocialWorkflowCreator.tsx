
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../ui/toast';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  isConnected: boolean;
  details?: any;
}

export function SocialWorkflowCreator() {
  const [platforms, setPlatforms] = useState<Record<string, SocialPlatform>>({});
  const [sourcePlatform, setSourcePlatform] = useState<string | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Structure de données pour les plateformes
      const platformsData: Record<string, SocialPlatform> = {
        tiktok: {
          id: 'tiktok',
          name: 'TikTok',
          icon: <span className="text-black">📱</span>,
          isConnected: false
        },
        instagram: {
          id: 'instagram',
          name: 'Instagram',
          icon: <span className="text-pink-600">📸</span>,
          isConnected: false
        },
        facebook: {
          id: 'facebook',
          name: 'Facebook',
          icon: <span className="text-blue-600">👍</span>,
          isConnected: false
        },
        youtube: {
          id: 'youtube',
          name: 'YouTube',
          icon: <span className="text-red-600">🎬</span>,
          isConnected: false
        }
      };

      // Mise à jour avec les connexions existantes
      if (data) {
        data.forEach(connection => {
          if (platformsData[connection.platform]) {
            platformsData[connection.platform].isConnected = true;
            platformsData[connection.platform].details = connection;
          }
        });
      }

      setPlatforms(platformsData);
    } catch (error) {
      console.error('Error loading connections:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos connexions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceSelect = (platformId: string) => {
    if (platforms[platformId]?.isConnected) {
      setSourcePlatform(platformId);
    } else {
      toast({
        title: "Connexion requise",
        description: `Veuillez d'abord connecter votre compte ${platforms[platformId]?.name}`,
        variant: "destructive"
      });
    }
  };

  const handleTargetSelect = (platformId: string) => {
    if (platforms[platformId]?.isConnected) {
      setTargetPlatform(platformId);
      setShowConfirmation(true);
    } else {
      toast({
        title: "Connexion requise",
        description: `Veuillez d'abord connecter votre compte ${platforms[platformId]?.name}`,
        variant: "destructive"
      });
    }
  };

  const createWorkflow = async () => {
    if (!sourcePlatform || !targetPlatform || !user) return;
    
    setIsCreating(true);
    
    try {
      // Vérifier si un workflow identique existe déjà
      const { data: existingWorkflows } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_platform', sourcePlatform)
        .eq('target_platforms', [targetPlatform]);
      
      if (existingWorkflows && existingWorkflows.length > 0) {
        toast({
          title: "Workflow existant",
          description: "Un workflow similaire existe déjà",
          variant: "destructive"
        });
        setShowConfirmation(false);
        setIsCreating(false);
        return;
      }

      // Créer le nouveau workflow
      const { data, error } = await supabase
        .from('workflows')
        .insert([
          {
            user_id: user.id,
            name: `${platforms[sourcePlatform].name} ➝ ${platforms[targetPlatform].name}`,
            source_platform: sourcePlatform,
            target_platforms: [targetPlatform],
            is_active: true,
            config: {
              auto_publish: true,
              preserve_captions: true,
              remove_watermarks: true
            }
          }
        ]);

      if (error) throw error;

      toast({
        title: "Workflow créé",
        description: "Votre workflow a été créé avec succès",
        variant: "default"
      });

      // Réinitialiser l'état
      setSourcePlatform(null);
      setTargetPlatform(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le workflow",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-6">Créer un workflow automatique</h2>
      
      {!sourcePlatform ? (
        <div className="space-y-5">
          <p className="text-gray-600 mb-4">Étape 1: Choisir la source de contenu</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(platforms).map(platform => (
              <Button
                key={platform.id}
                onClick={() => handleSourceSelect(platform.id)}
                disabled={!platform.isConnected}
                className={`flex items-center justify-start space-x-2 h-14 px-4 ${
                  platform.isConnected 
                    ? 'hover:bg-gray-100 hover:text-gray-900 border border-gray-200' 
                    : 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                }`}
                variant="outline"
              >
                <div className="flex-shrink-0 text-2xl">{platform.icon}</div>
                <span>{platform.name}</span>
                {!platform.isConnected && (
                  <span className="text-xs ml-2 bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    Non connecté
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      ) : !targetPlatform ? (
        <div className="space-y-5">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => setSourcePlatform(null)}
              className="mr-2 px-3"
            >
              ← Retour
            </Button>
            
            <p className="text-gray-600">
              Étape 2: Choisir la destination pour 
              <span className="font-medium ml-1">
                {platforms[sourcePlatform]?.name}
              </span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(platforms)
              .filter(p => p.id !== sourcePlatform)
              .map(platform => (
                <Button
                  key={platform.id}
                  onClick={() => handleTargetSelect(platform.id)}
                  disabled={!platform.isConnected}
                  className={`flex items-center justify-start space-x-2 h-14 px-4 ${
                    platform.isConnected 
                      ? 'hover:bg-gray-100 hover:text-gray-900 border border-gray-200' 
                      : 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                  }`}
                  variant="outline"
                >
                  <div className="flex-shrink-0 text-2xl">{platform.icon}</div>
                  <span>{platform.name}</span>
                  {!platform.isConnected && (
                    <span className="text-xs ml-2 bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      Non connecté
                    </span>
                  )}
                </Button>
              ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-3 text-lg">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
            {platforms[sourcePlatform]?.icon}
          </div>
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
            {platforms[targetPlatform]?.icon}
          </div>
        </div>
      )}

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogTitle>Confirmer la création du workflow</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de créer un workflow automatique qui republiera votre contenu de {platforms[sourcePlatform!]?.name} vers {platforms[targetPlatform!]?.name}.
          </DialogDescription>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Important :</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Ce workflow sera actif immédiatement après sa création</li>
                  <li>Vous pouvez le désactiver à tout moment dans la section Workflows</li>
                  <li>Assurez-vous d'avoir les droits appropriés sur le contenu que vous republierez</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Annuler
            </Button>
            <Button 
              onClick={createWorkflow} 
              disabled={isCreating}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
