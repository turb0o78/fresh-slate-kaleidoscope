
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { BarChart, Calendar, ChevronRight, Loader2, RefreshCcw, TrendingUp, UserPlus } from 'lucide-react';

export function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPosts: 0,
    connectedPlatforms: 0,
    scheduledPosts: 0,
    engagementRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [connectionsResponse, postsResponse] = await Promise.all([
        supabase.from('social_connections').select('*', { count: 'exact' }),
        supabase.from('posts').select('*', { count: 'exact' }),
      ]);

      setStats({
        totalPosts: postsResponse.count || 0,
        connectedPlatforms: connectionsResponse.count || 0,
        scheduledPosts: Math.floor(Math.random() * 5), // Placeholder for demo
        engagementRate: (Math.random() * 10).toFixed(1), // Placeholder for demo
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600">Welcome back! Here's an overview of your content.</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadStats} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
          Refresh Data
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-500">Total Posts</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">{stats.totalPosts}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <BarChart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1.5" />
            <span className="text-green-600 font-medium">12%</span>
            <span className="text-secondary-500 ml-1.5">vs. last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-500">Connected Platforms</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">{stats.connectedPlatforms}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-medium">F</div>
              <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-xs text-pink-700 font-medium">T</div>
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs text-red-700 font-medium">Y</div>
            </div>
            <Link to="/dashboard/connections" className="text-primary ml-2 hover:underline">
              Manage
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-500">Scheduled Posts</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">{stats.scheduledPosts}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-secondary-500">Next post in 2 hours</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-500">Engagement Rate</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">{stats.engagementRate}%</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1.5" />
            <span className="text-green-600 font-medium">3.2%</span>
            <span className="text-secondary-500 ml-1.5">vs. last month</span>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-100 mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">Getting Started</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-secondary-900 mb-1">Connect your social media accounts</h3>
                <p className="text-secondary-600 mb-3 text-sm">Link your social media profiles to start cross-posting</p>
                <Button size="sm" asChild variant="outline" className="text-primary border-primary-200 bg-primary-50 hover:bg-primary-100">
                  <Link to="/dashboard/connections">
                    Connect Accounts
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-secondary-900 mb-1">Create your first workflow</h3>
                <p className="text-secondary-600 mb-3 text-sm">Set up automated content sharing between platforms</p>
                <Button size="sm" asChild>
                  <Link to="/dashboard/workflows">
                    Create Workflow
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-secondary-900 mb-1">Monitor your analytics</h3>
                <p className="text-secondary-600 mb-3 text-sm">Track the performance of your cross-posted content</p>
                <Button size="sm" asChild variant="outline">
                  <Link to="/dashboard/analytics">
                    View Analytics
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-100">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">Recent Activity</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : stats.totalPosts > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-secondary-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <BarChart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">New post analytics available</h4>
                  <p className="text-sm text-secondary-500">Your recent TikTok post reached 1.2k views</p>
                </div>
                <Button size="sm" variant="ghost" className="ml-auto">
                  View
                </Button>
              </div>
              <div className="flex items-center p-3 bg-secondary-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Post scheduled successfully</h4>
                  <p className="text-sm text-secondary-500">Scheduled for tomorrow at 9:00 AM</p>
                </div>
                <Button size="sm" variant="ghost" className="ml-auto">
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-secondary-50 rounded-lg border border-dashed border-secondary-200">
              <p className="text-secondary-600">No recent activity to display</p>
              <p className="text-sm text-secondary-500 mt-1">Connect your accounts to get started</p>
              <Button size="sm" className="mt-4" asChild>
                <Link to="/dashboard/connections">Connect Accounts</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
