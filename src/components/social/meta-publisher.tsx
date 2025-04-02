
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/toast';
import { UploadIcon, Share2, VideoIcon, X } from 'lucide-react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

interface SocialConnection {
  platform: 'facebook' | 'instagram';
  access_token: string;
  profile_name: string;
  profile_id: string;
  page_id?: string;
  page_name?: string;
  metadata?: any;
  platform_username?: string;
}

interface Connections {
  facebook: SocialConnection | null;
  instagram: SocialConnection | null;
  [key: string]: SocialConnection | null; // Index signature pour permettre l'accès dynamique
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

export function MetaPublisher({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<Connections>({ facebook: null, instagram: null });
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram' | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const { toast } = useToast();

  // Charger les connections de l'utilisateur
  useEffect(() => {
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
              
              // Si on a une connexion Facebook, charger les pages
              if (connection.platform === 'facebook' && connection.metadata?.pages) {
                setFacebookPages(connection.metadata.pages);
              }
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
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Créer une prévisualisation
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target?.result) {
          setFilePreview(e.target.result as string);
        }
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handlePlatformSelect = (platform: 'facebook' | 'instagram') => {
    setSelectedPlatform(platform);
    setSelectedPageId(null);
    
    // Si c'est Facebook et qu'on a des pages, sélectionner la première par défaut
    if (platform === 'facebook' && facebookPages.length > 0) {
      setSelectedPageId(facebookPages[0].id);
    }
  };

  const isMediaTypeSupported = (file: File): boolean => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    
    return [...imageTypes, ...videoTypes].includes(file.type);
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
    
    if (!isMediaTypeSupported(file)) {
      toast({
        title: "Format non supporté",
        description: "Seuls les formats JPEG, PNG, GIF et MP4 sont supportés",
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
          page_id: selectedPlatform === 'facebook' ? selectedPageId : undefined,
        },
      });
      
      if (publishError) throw publishError;
      
      toast({
        title: "Succès",
        description: `Contenu publié sur ${selectedPlatform} avec succès`,
      });
      
      // Réinitialiser le formulaire
      setFile(null);
      setFilePreview(null);
      setCaption('');
      setSelectedPlatform(null);
      setSelectedPageId(null);
      
    } catch (error) {
      console.error('Error publishing content:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la publication: " + (error as Error).message,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = selectedPlatform && file && (selectedPlatform !== 'facebook' || selectedPageId);

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
              onClick={() => handlePlatformSelect('facebook')}
              disabled={!connections.facebook}
              className={`flex-1 flex items-center justify-center ${selectedPlatform === 'facebook' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            >
              <FaFacebook className="mr-2 h-4 w-4" />
              Facebook {!connections.facebook && '(Non connecté)'}
            </Button>
            <Button
              type="button"
              variant={selectedPlatform === 'instagram' ? 'default' : 'outline'}
              onClick={() => handlePlatformSelect('instagram')}
              disabled={!connections.instagram}
              className={`flex-1 flex items-center justify-center ${
                selectedPlatform === 'instagram' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' 
                  : ''
              }`}
            >
              <FaInstagram className="mr-2 h-4 w-4" />
              Instagram {!connections.instagram && '(Non connecté)'}
            </Button>
          </div>
        </div>
        
        {selectedPlatform === 'facebook' && facebookPages.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Sélectionner une page Facebook</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {facebookPages.map(page => (
                <Button
                  key={page.id}
                  type="button"
                  variant={selectedPageId === page.id ? 'default' : 'outline'}
                  onClick={() => setSelectedPageId(page.id)}
                  className={`justify-start ${selectedPageId === page.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  <FaFacebook className="mr-2 h-4 w-4" />
                  {page.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        
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
          {filePreview ? (
            <div className="relative border rounded-lg overflow-hidden">
              {file?.type.includes('image') ? (
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                  <VideoIcon className="h-16 w-16 text-gray-400" />
                  <p className="ml-2 text-gray-500">{file?.name}</p>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white text-red-500 hover:bg-red-50"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">JPG, PNG, GIF ou MP4 (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                />
              </label>
            </div>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={loading || !isFormValid}
          className={`w-full ${
            selectedPlatform === 'instagram'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
              : selectedPlatform === 'facebook'
                ? 'bg-blue-600 hover:bg-blue-700' 
                : ''
          }`}
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
