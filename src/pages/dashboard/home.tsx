import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

export function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPosts: 0,
    connectedPlatforms: 0,
    scheduledPosts: 0,
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [connectionsResponse, postsResponse] = await Promise.all([
        supabase.from('social_connections').select('*', { count: 'exact' }),
        supabase.from('posts').select('*', { count: 'exact' }),
      ]);

      setStats({
        totalPosts: postsResponse.count || 0,
        connectedPlatforms: connectionsResponse.count || 0,
        scheduledPosts: 0, // TODO: Add scheduled posts count
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Purposify dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Posts</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Connected Platforms</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.connectedPlatforms}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Scheduled Posts</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.scheduledPosts}</p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">1</span>
            </div>
            <div>
              <h3 className="font-medium">Connect your social media accounts</h3>
              <p className="text-gray-600">Link your social media profiles to start cross-posting</p>
              <Button size="sm" className="mt-2" asChild>
                <Link to="/dashboard/connections">Connect Accounts</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">2</span>
            </div>
            <div>
              <h3 className="font-medium">Create your first workflow</h3>
              <p className="text-gray-600">Set up automated content sharing between platforms</p>
              <Button size="sm" className="mt-2" asChild>
                <Link to="/dashboard/workflows">Create Workflow</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">3</span>
            </div>
            <div>
              <h3 className="font-medium">Monitor your analytics</h3>
              <p className="text-gray-600">Track the performance of your cross-posted content</p>
              <Button size="sm" className="mt-2" asChild>
                <Link to="/dashboard/analytics">View Analytics</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}