
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../ui/toast';
import { Toggle } from '../ui/toggle';
import { Loader2, Trash } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { AlertCircle } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  source_platform: string;
  target_platforms: string[];
  is_active: boolean;
  created_at: string;
  config: {
    auto_publish: boolean;
    preserve_captions: boolean;
    remove_watermarks: boolean;
    [key: string]: any;
  };
}

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <span className="text-black">📱</span>,
  instagram: <span className="text-pink-600">📸</span>,
  facebook: <span className="text-blue-600">👍</span>,
  youtube: <span className="text-red-600">🎬</span>,
};

export function ActiveWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadWorkflows();
    }
  }, [user]);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos workflows",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWorkflowStatus = async (workflowId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: !currentStatus })
        .eq('id', workflowId);

      if (error) throw error;

      setWorkflows(workflows.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, is_active: !currentStatus } 
          : workflow
      ));

      toast({
        title: "Statut mis à jour",
        description: `Workflow ${!currentStatus ? 'activé' : 'désactivé'}`,
      });
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        type: "error"
      });
    }
  };

  const deleteWorkflow = async () => {
    if (!workflowToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowToDelete);

      if (error) throw error;

      setWorkflows(workflows.filter(workflow => workflow.id !== workflowToDelete));
      
      toast({
        title: "Workflow supprimé",
        description: "Le workflow a été supprimé avec succès"
      });
      
      setWorkflowToDelete(null);
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le workflow",
        type: "error"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-lg font-medium mb-2">Aucun workflow actif</h3>
        <p className="text-gray-600 mb-4">
          Créez votre premier workflow pour automatiser le cross-posting de vos contenus
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Workflows actifs</h3>
      </div>
      <div className="divide-y">
        {workflows.map(workflow => (
          <div key={workflow.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="h-8 w-8 flex items-center justify-center">
                  {platformIcons[workflow.source_platform] || '🔄'}
                </div>
                <span className="mx-2">→</span>
                <div className="flex -space-x-1">
                  {workflow.target_platforms.map(platform => (
                    <div 
                      key={platform} 
                      className="h-8 w-8 flex items-center justify-center bg-white rounded-full border border-gray-200"
                    >
                      {platformIcons[platform] || '🔄'}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium">{workflow.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(workflow.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  {workflow.is_active ? 'Actif' : 'Inactif'}
                </span>
                <Toggle 
                  pressed={workflow.is_active} 
                  onPressedChange={() => toggleWorkflowStatus(workflow.id, workflow.is_active)}
                  className={`${
                    workflow.is_active 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  } focus:ring-0`}
                />
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setWorkflowToDelete(workflow.id)}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <DialogContent>
          <DialogTitle>Supprimer le workflow</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce workflow ? Cette action est irréversible.
          </DialogDescription>

          <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">
                La suppression du workflow arrêtera immédiatement tous les processus automatiques associés.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setWorkflowToDelete(null)}
            >
              Annuler
            </Button>
            <Button 
              variant="outline"
              className="bg-red-600 text-white hover:bg-red-700" 
              onClick={deleteWorkflow} 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
