
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { TikTokButton } from '../../components/social/tiktok-button';
import { YouTubeButton } from '../../components/social/youtube-button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { initiateSocialAuth, handleOAuthCallback } from '../../lib/social-auth';
import { handleMetaOAuthCallback } from '../../lib/meta-auth';
import { FacebookConnection } from '../../components/social/facebook-connection';
import { InstagramConnection } from '../../components/social/instagram-connection';
import { MetaPublisher } from '../../components/social/meta-publisher';
import type { SocialConnection, Platform } from '../../lib/types';

export function ConnectionsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const platform = sessionStorage.getItem('meta_auth_platform') || 
                     sessionStorage.getItem('oauth_platform') as Platform | null;

    if (code && state && platform) {
      handleCallback(code, state, platform as Platform);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const handleCallback = async (code: string, state: string, platform: Platform) => {
    try {
      if (platform === 'facebook' || platform === 'instagram') {
        await handleMetaOAuthCallback(code, state, platform);
      } else {
        await handleOAuthCallback(code, state);
      }
      await loadConnections();
      navigate('/dashboard/connections', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: Platform) => {
    try {
      setError(null);
      setConnectingPlatform(platform);
      await initiateSocialAuth(platform);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate connection');
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      await loadConnections();
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      setError('Failed to disconnect platform');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Social Media Connections</h1>
        <p className="text-gray-600">Connect your social media accounts to enable cross-posting</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Publisher Component - Pour tester la publication */}
      {user && connections.length > 0 && (
        <div className="mb-6">
          <MetaPublisher userId={user.id} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <YouTubeButton
          connection={connections.find(c => c.platform === 'youtube')}
          onConnect={() => handleConnect('youtube')}
          onDisconnect={handleDisconnect}
          isLoading={connectingPlatform === 'youtube'}
        />

        <TikTokButton
          connection={connections.find(c => c.platform === 'tiktok')}
          onConnect={() => handleConnect('tiktok')}
          onDisconnect={handleDisconnect}
          isLoading={connectingPlatform === 'tiktok'}
        />
        
        {/* Connexions Facebook et Instagram */}
        {user && (
          <FacebookConnection 
            userId={user.id} 
          />
        )}
        
        {user && (
          <InstagramConnection 
            userId={user.id}
          />
        )}
      </div>
    </div>
  );
}
