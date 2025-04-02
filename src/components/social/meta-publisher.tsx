
import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/toast';
import { publishToFacebook, publishToInstagram } from '../../lib/meta-api';

interface MetaPublisherProps {
  userId: string;
}

export function MetaPublisher({ userId }: MetaPublisherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'instagram'>('instagram');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');
  const [connections, setConnections] = useState<any>({
    facebook: null,
    instagram: null,
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    loadConnections();
  }, [userId]);
  
  useEffect(() => {
    // Charger les pages Facebook lorsque la connexion Facebook est disponible
    if (connections.facebook) {
      const pages = connections.facebook.metadata?.pages || [];
      setFacebookPages(pages);
      if (pages.length > 0) {
        setSelectedPageId(pages[0].id);
      }
    }
  }, [connections.facebook]);
  
  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', userId)
        .in('platform', ['facebook', 'instagram']);
        
      if (error) throw error;
      
      const connectionsMap = {
        facebook: null,
        instagram: null,
      };
      
      if (data) {
        data.forEach((conn) => {
          connectionsMap[conn.platform] = conn;
        });
      }
      
      setConnections(connectionsMap);
    } catch (err) {
      console.error('Error loading social connections:', err);
      setError('Failed to load social connections');
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      
      // Créer une URL pour la prévisualisation
      const preview = URL.createObjectURL(file);
      setMediaPreview(preview);
    }
  };
  
  const handlePublish = async () => {
    if (!mediaFile) {
      setError('Please select an image or video to publish');
      return;
    }
    
    setIsPublishing(true);
    setError('');
    
    try {
      // 1. Télécharger le fichier vers Supabase Storage
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `uploads/${userId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, mediaFile);
        
      if (uploadError) throw uploadError;
      
      // 2. Obtenir l'URL publique du fichier
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
        
      // 3. Publier sur la plateforme sélectionnée
      let result;
      
      if (selectedPlatform === 'instagram') {
        result = await publishToInstagram(userId, {
          caption,
          mediaUrl: publicUrl,
          mediaType: mediaFile.type.includes('video') ? 'VIDEO' : 'IMAGE',
        });
      } else {
        result = await publishToFacebook(userId, selectedPageId, {
          caption,
          mediaUrl: publicUrl,
          mediaType: mediaFile.type.includes('video') ? 'VIDEO' : 'IMAGE',
        });
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Publication failed');
      }
      
      // 4. Notification de succès
      toast({
        title: 'Posted Successfully',
        description: `Your post was published to ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}`,
      });
      
      // 5. Réinitialiser le formulaire et fermer le dialogue
      setCaption('');
      setMediaFile(null);
      setMediaPreview(null);
      setIsOpen(false);
      
    } catch (err) {
      console.error('Error publishing post:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish post');
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-purple-500 text-white"
      >
        <Upload className="h-4 w-4 mr-2" />
        Publish to Social Media
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Publish to Social Media</DialogTitle>
          <DialogDescription>
            Create a new post for Instagram or Facebook
          </DialogDescription>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2 text-red-600 text-sm mt-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mt-4 space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Platform</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={selectedPlatform === 'instagram' ? 'default' : 'outline'}
                  onClick={() => setSelectedPlatform('instagram')}
                  disabled={!connections.instagram}
                  className={selectedPlatform === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-purple-500' : ''}
                >
                  Instagram
                </Button>
                <Button
                  type="button"
                  variant={selectedPlatform === 'facebook' ? 'default' : 'outline'}
                  onClick={() => setSelectedPlatform('facebook')}
                  disabled={!connections.facebook}
                  className={selectedPlatform === 'facebook' ? 'bg-blue-600' : ''}
                >
                  Facebook
                </Button>
              </div>
              
              {selectedPlatform === 'facebook' && facebookPages.length > 0 && (
                <div className="mt-3">
                  <Label>Select Page</Label>
                  <select
                    value={selectedPageId}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                  >
                    {facebookPages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="caption">Caption</Label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 h-24"
                placeholder="Write a caption for your post..."
              />
            </div>
            
            <div>
              <Label htmlFor="media">Media (image or video)</Label>
              <Input
                id="media"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              
              {mediaPreview && (
                <div className="mt-3 rounded-md overflow-hidden border border-gray-200">
                  {mediaFile?.type.includes('image') ? (
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="max-h-48 w-full object-contain"
                    />
                  ) : (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="max-h-48 w-full"
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !mediaFile}
              >
                {isPublishing ? 'Publishing...' : 'Publish Now'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
