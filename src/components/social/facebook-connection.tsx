
import { useState, useEffect } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { initiateMetaAuth } from '../../lib/meta-auth';
import { supabase } from '../../lib/supabase';
import type { SocialConnection } from '../../lib/types';

interface FacebookConnectionProps {
  userId: string;
}

export function FacebookConnection({ userId }: FacebookConnectionProps) {
  const [connection, setConnection] = useState<SocialConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPages, setShowPages] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConnection();
  }, [userId]);

  const loadConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .single();

      if (error) throw error;
      setConnection(data);
    } catch (err) {
      console.error('Error loading Facebook connection:', err);
      // Si l'erreur est "No rows found", c'est normal et nous ne l'affichons pas
      if (!(err as any)?.message?.includes('No rows found')) {
        setError('Failed to load Facebook connection');
      }
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await initiateMetaAuth('facebook');
    } catch (err) {
      setError('Failed to connect to Facebook');
      console.error('Error connecting to Facebook:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;
      setConnection(null);
    } catch (err) {
      setError('Failed to disconnect Facebook');
      console.error('Error disconnecting Facebook:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-full">
            <FaFacebook className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">Facebook</h3>
            {connection && (
              <p className="text-sm text-gray-500">
                Connected
                {connection.platform_username && (
                  <> as {connection.platform_username}</>
                )}
              </p>
            )}
          </div>
        </div>

        {connection ? (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPages(true)}
            >
              View Pages
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {connection && (
        <div className="flex items-center space-x-2 mt-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-500">
            Connected {new Date(connection.created_at).toLocaleDateString()}
          </span>
        </div>
      )}

      <Dialog open={showPages} onOpenChange={setShowPages}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center justify-between">
            Facebook Pages
            <button onClick={() => setShowPages(false)} className="w-6 h-6">
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
          <DialogDescription>
            Pages connected to your Facebook account that can be used for posts
          </DialogDescription>
          
          <div className="mt-4 space-y-3">
            {connection?.metadata?.pages?.map((page: any) => (
              <div key={page.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <h4 className="font-medium">{page.name}</h4>
                  <p className="text-xs text-gray-500">{page.category}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}

            {(!connection?.metadata?.pages || connection.metadata.pages.length === 0) && (
              <div className="p-4 text-center text-gray-500">
                No Facebook pages connected
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
