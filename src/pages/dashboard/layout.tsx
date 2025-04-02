
import { Link, useLocation } from 'react-router-dom';
import { Home, Link2, Activity, Settings, CreditCard, Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../lib/auth';
import { useState, useEffect } from 'react';

type NavItemProps = {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
};

function NavItem({ to, icon: Icon, children, onClick, isActive }: NavItemProps) {
  return (
    <li>
      <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={onClick}
      >
        <Icon className="h-5 w-5" />
        <span>{children}</span>
      </Link>
    </li>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Check on mount
    checkSize();

    // Add event listener
    window.addEventListener('resize', checkSize);

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:relative ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`flex items-center justify-between p-4 border-b ${!isSidebarOpen && 'lg:justify-center'}`}>
            {isSidebarOpen ? (
              <Link to="/" className="text-xl font-bold text-primary">VideVault</Link>
            ) : (
              <Link to="/" className="text-xl font-bold text-primary">VV</Link>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none lg:block hidden"
            >
              {isSidebarOpen ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              <NavItem to="/dashboard" icon={Home} isActive={isActive('/dashboard')}>
                {isSidebarOpen && "Dashboard"}
              </NavItem>
              <NavItem to="/dashboard/connections" icon={Link2} isActive={isActive('/dashboard/connections')}>
                {isSidebarOpen && "Connections"}
              </NavItem>
              <NavItem to="/dashboard/workflows" icon={Activity} isActive={isActive('/dashboard/workflows')}>
                {isSidebarOpen && "Workflows"}
              </NavItem>
              <NavItem to="/dashboard/analytics" icon={Activity} isActive={isActive('/dashboard/analytics')}>
                {isSidebarOpen && "Analytics"}
              </NavItem>
              <NavItem to="/dashboard/billing" icon={CreditCard} isActive={isActive('/dashboard/billing')}>
                {isSidebarOpen && "Billing"}
              </NavItem>
              <NavItem to="/dashboard/referrals" icon={Users} isActive={isActive('/dashboard/referrals')}>
                {isSidebarOpen && "Referrals"}
              </NavItem>
              <NavItem to="/dashboard/settings" icon={Settings} isActive={isActive('/dashboard/settings')}>
                {isSidebarOpen && "Settings"}
              </NavItem>
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => signOut()}
            >
              {isSidebarOpen ? "Sign out" : "Exit"}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile header with menu button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-xl font-bold text-primary">VideVault</div>
          <div className="w-8"></div> {/* Spacer to center title */}
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
