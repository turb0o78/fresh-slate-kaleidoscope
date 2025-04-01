import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart2, Settings, Users, Video, Activity, LogOut, Share2, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">Purposify</span>
          </div>
        </div>
        <nav className="px-4 py-2">
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${
                  isActive('/dashboard')
                    ? 'text-gray-700 bg-gray-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart2 className="h-5 w-5" />
                <span>Overview</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/connections"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${
                  isActive('/dashboard/connections')
                    ? 'text-gray-700 bg-gray-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Connections</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/workflows"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${
                  isActive('/dashboard/workflows')
                    ? 'text-gray-700 bg-gray-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Activity className="h-5 w-5" />
                <span>Workflows</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/analytics"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${
                  isActive('/dashboard/analytics')
                    ? 'text-gray-700 bg-gray-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart2 className="h-5 w-5" />
                <span>Analytics</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/referrals"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${
                  isActive('/dashboard/referrals')
                    ? 'text-gray-700 bg-gray-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Share2 className="h-5 w-5" />
                <span>Referrals</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/billing"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${
                  isActive('/dashboard/billing')
                    ? 'text-gray-700 bg-gray-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Billing</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/settings"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${
                  isActive('/dashboard/settings')
                    ? 'text-gray-700 bg-gray-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="px-4 py-2 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
            disabled={loading}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}