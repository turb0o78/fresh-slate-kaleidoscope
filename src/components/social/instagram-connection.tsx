
import { useState, useEffect } from 'react';
import { FaInstagram } from 'react-icons/fa';
import { Button } from '../ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { initiateMetaAuth } from '../../lib/meta-auth';
import { supabase } from '../../lib/supabase';
import type { SocialConnection } from '../../lib/types';

interface InstagramConnectionProps {
  userId: string;
}

export function InstagramConnection({ userId }: InstagramConnectionProps) {
  const [connection, setConnection] = useState<SocialConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        .eq('platform', 'instagram')
        .single();

      if (error) throw error;
      setConnection(data);
    } catch (err) {
      console.error('Error loading Instagram connection:', err);
      // Si l'erreur est "No rows found", c'est normal et nous ne l'affichons pas
      if (!(err as any)?.message?.includes('No rows found')) {
        setError('Failed to load Instagram connection');
      }
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await initiateMetaAuth('instagram');
    } catch (err) {
      setError('Failed to connect to Instagram');
      console.error('Error connecting to Instagram:', err);
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
      setError('Failed to disconnect Instagram');
      console.error('Error disconnecting Instagram:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded-full">
            <FaInstagram className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">Instagram</h3>
            {connection && (
              <p className="text-sm text-gray-500">
                Connected
                {connection.platform_username && (
                  <> as @{connection.platform_username}</>
                )}
              </p>
            )}
          </div>
        </div>

        {connection ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
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
    </div>
  );
}
