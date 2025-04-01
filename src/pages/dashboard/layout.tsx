
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart2, Settings, Users, Video, Activity, 
  LogOut, Share2, CreditCard, Menu, X, Bell, Search, User
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  
  const menuItems = [
    { path: '/dashboard', title: 'Overview', icon: BarChart2 },
    { path: '/dashboard/connections', title: 'Connections', icon: Users },
    { path: '/dashboard/workflows', title: 'Workflows', icon: Activity },
    { path: '/dashboard/analytics', title: 'Analytics', icon: BarChart2 },
    { path: '/dashboard/referrals', title: 'Referrals', icon: Share2 },
    { path: '/dashboard/billing', title: 'Billing', icon: CreditCard },
    { path: '/dashboard/settings', title: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r z-30 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        } lg:relative lg:z-10`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
                <Video className="h-5 w-5 text-white" />
              </div>
              {(sidebarOpen || window.innerWidth >= 1024) && (
                <span className={`font-bold text-lg ${!sidebarOpen && window.innerWidth >= 1024 ? 'hidden' : ''}`}>
                  Purposify
                </span>
              )}
            </Link>
            <button 
              className="lg:hidden text-secondary-500 hover:text-secondary-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary text-white'
                        : 'text-secondary-600 hover:bg-secondary-100'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${sidebarOpen || window.innerWidth < 1024 ? '' : 'mx-auto'}`} />
                    {(sidebarOpen || window.innerWidth < 1024) && (
                      <span className="text-sm font-medium">{item.title}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className={`w-full justify-${sidebarOpen || window.innerWidth < 1024 ? 'start' : 'center'} text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900`}
              onClick={handleSignOut}
              disabled={loading}
            >
              <LogOut className={`h-5 w-5 ${sidebarOpen || window.innerWidth < 1024 ? 'mr-3' : ''}`} />
              {(sidebarOpen || window.innerWidth < 1024) && <span>Sign out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            <button 
              className="lg:hidden mr-4 text-secondary-500 hover:text-secondary-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              className="hidden lg:block text-secondary-500 hover:text-secondary-700 mr-4"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-full max-w-xs text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications dropdown */}
            <div className="relative">
              <button 
                className="p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserMenuOpen(false);
                }}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-secondary-200 z-50 animate-fade-in">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    <div className="p-3 hover:bg-secondary-50 rounded-lg cursor-pointer border-l-2 border-primary">
                      <p className="text-sm font-medium">New follower on TikTok</p>
                      <p className="text-xs text-secondary-500">2 minutes ago</p>
                    </div>
                    <div className="p-3 hover:bg-secondary-50 rounded-lg cursor-pointer">
                      <p className="text-sm font-medium">Your post reached 1,000 views</p>
                      <p className="text-xs text-secondary-500">1 hour ago</p>
                    </div>
                    <div className="p-3 hover:bg-secondary-50 rounded-lg cursor-pointer">
                      <p className="text-sm font-medium">Workflow completed successfully</p>
                      <p className="text-xs text-secondary-500">3 hours ago</p>
                    </div>
                  </div>
                  <div className="p-2 border-t text-center">
                    <button className="text-sm text-primary hover:underline">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* User menu dropdown */}
            <div className="relative">
              <button 
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-50"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotificationsOpen(false);
                }}
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary font-medium">
                  {user?.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 z-50 animate-fade-in">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-secondary-500">Basic Plan</p>
                  </div>
                  <div className="p-2">
                    <Link to="/dashboard/settings" className="block px-3 py-2 text-sm hover:bg-secondary-50 rounded-md" onClick={() => setUserMenuOpen(false)}>
                      Profile Settings
                    </Link>
                    <Link to="/dashboard/billing" className="block px-3 py-2 text-sm hover:bg-secondary-50 rounded-md" onClick={() => setUserMenuOpen(false)}>
                      Subscription
                    </Link>
                    <button 
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
