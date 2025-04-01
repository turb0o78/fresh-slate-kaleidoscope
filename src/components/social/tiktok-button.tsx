
import { useState } from 'react';
import { Button } from '../ui/button';
import { BrandTiktok, Plus, Trash2 } from 'lucide-react';
import type { SocialConnection } from '../../lib/types';

interface TikTokButtonProps {
  connection?: SocialConnection;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  isLoading?: boolean;
}

export function TikTokButton({ connection, onConnect, onDisconnect, isLoading }: TikTokButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-black">
            <BrandTiktok className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium">TikTok</h3>
            {connection && (
              <p className="text-sm text-gray-500">
                Connected as {connection.platform_username || connection.platform_user_id}
              </p>
            )}
          </div>
        </div>
        {connection ? (
          <Button
            variant="ghost"
            size="sm"
            className={`text-red-600 hover:text-red-700 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => onDisconnect(connection.id)}
            disabled={isLoading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={isLoading}
            className="bg-black hover:bg-gray-900 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        )}
      </div>
      {connection && (
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-500">
            Connected {new Date(connection.created_at).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}
