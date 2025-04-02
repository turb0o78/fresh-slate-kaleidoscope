
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/toast';
import { UploadIcon, Share2 } from 'lucide-react';

interface SocialConnection {
  platform: 'facebook' | 'instagram';
  access_token: string;
  profile_name: string;
  profile_id: string;
  page_id?: string;
  page_name?: string;
}

interface Connections {
  facebook: SocialConnection | null;
  instagram: SocialConnection | null;
  [key: string]: SocialConnection | null; // Index signature pour permettre l'accès dynamique
}

export function MetaPublisher({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<Connections>({ facebook: null, instagram: null });
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram' | null>(null);
  const { toast } = useToast();

  // Charger les connections de l'utilisateur
  React.useEffect(() => {
    async function loadConnections() {
      try {
        const { data, error } = await supabase
          .from('social_connections')
          .select('*')
          .eq('user_id', userId)
          .in('platform', ['facebook', 'instagram']);
        
        if (error) throw error;
        
        const metaConnections: Connections = { facebook: null, instagram: null };
        
        if (data) {
          data.forEach((connection) => {
            if (connection.platform === 'facebook' || connection.platform === 'instagram') {
              metaConnections[connection.platform] = connection as SocialConnection;
            }
          });
        }
        
        setConnections(metaConnections);
      } catch (error) {
        console.error('Error loading connections:', error);
      }
    }
    
    loadConnections();
  }, [userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlatform) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une plateforme",
      });
      return;
    }
    
    if (!connections[selectedPlatform]) {
      toast({
        title: "Erreur",
        description: `Vous n'êtes pas connecté à ${selectedPlatform}`,
      });
      return;
    }
    
    if (!file) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier à publier",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Uploader le fichier sur Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Récupérer l'URL publique du fichier
      const { data: publicUrl } = await supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      if (!publicUrl) throw new Error("Impossible d'obtenir l'URL publique du fichier");
      
      // Envoyer la demande de publication
      const { error: publishError } = await supabase.functions.invoke('meta-publish', {
        body: {
          platform: selectedPlatform,
          mediaUrl: publicUrl.publicUrl,
          caption: caption,
          connection_id: connections[selectedPlatform]?.profile_id,
          page_id: connections[selectedPlatform]?.page_id,
        },
      });
      
      if (publishError) throw publishError;
      
      toast({
        title: "Succès",
        description: `Contenu publié sur ${selectedPlatform} avec succès`,
      });
      
      // Réinitialiser le formulaire
      setFile(null);
      setCaption('');
      
    } catch (error) {
      console.error('Error publishing content:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la publication",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-4">Publier du contenu</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Sélectionner une plateforme</label>
          <div className="flex space-x-4">
            <Button
              type="button"
              variant={selectedPlatform === 'facebook' ? 'default' : 'outline'}
              onClick={() => setSelectedPlatform('facebook')}
              disabled={!connections.facebook}
              className="flex-1"
            >
              Facebook {!connections.facebook && '(Non connecté)'}
            </Button>
            <Button
              type="button"
              variant={selectedPlatform === 'instagram' ? 'default' : 'outline'}
              onClick={() => setSelectedPlatform('instagram')}
              disabled={!connections.instagram}
              className="flex-1"
            >
              Instagram {!connections.instagram && '(Non connecté)'}
            </Button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Légende</label>
          <textarea
            className="w-full p-2 border rounded-md"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Écrivez une légende pour votre publication..."
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Image ou Vidéo</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                </p>
                <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 10MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,video/*"
              />
            </label>
          </div>
          {file && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Fichier sélectionné: {file.name}</p>
            </div>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={loading || !selectedPlatform || !file}
          className="w-full"
        >
          {loading ? (
            <span className="flex items-center">
              <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
              Publication en cours...
            </span>
          ) : (
            <span className="flex items-center">
              <Share2 className="mr-2 h-4 w-4" />
              Publier sur {selectedPlatform && selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
