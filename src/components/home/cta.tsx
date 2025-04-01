
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

export function CTA() {
  return (
    <section className="py-16 md:py-24 bg-primary-500">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 animate-fade-in">
            Ready to streamline your social media workflow?
          </h2>
          <p className="text-primary-50 mb-8 text-lg animate-fade-in">
            Join thousands of content creators who trust Purposify to manage their social media presence.
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-white text-primary-600 border-white hover:bg-primary-50 animate-scale-in"
            asChild
          >
            <Link to="/signup">
              Start your free trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
