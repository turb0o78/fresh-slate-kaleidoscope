import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Share2 } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Share2 className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">Purposify</span>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/features" className="text-gray-600 hover:text-gray-900">
            Features
          </Link>
          <Link to="/pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link to="/about" className="text-gray-600 hover:text-gray-900">
            About
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}