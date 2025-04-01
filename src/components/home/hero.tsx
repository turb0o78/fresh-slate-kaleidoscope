
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export function Hero() {
  useEffect(() => {
    // Simple animation for staggered appearance
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Stagger animations for child elements
          const children = entry.target.querySelectorAll('.stagger-item');
          children.forEach((child, index) => {
            setTimeout(() => {
              (child as HTMLElement).classList.add('stagger-visible');
            }, index * 150);
          });
        }
      });
    }, { threshold: 0.1 });

    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="pt-24 pb-16 md:pt-32 md:pb-24 bg-hero-pattern">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col-reverse lg:flex-row items-center">
          <div className="w-full lg:w-1/2 pr-0 lg:pr-12 mt-8 lg:mt-0 animate-on-scroll">
            <div className="stagger-item">
              <div className="flex items-center space-x-2 bg-white py-1.5 px-3 rounded-full border border-secondary-100 shadow-sm w-fit mb-6">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm font-medium text-secondary-700">New: TikTok Integration Available</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-secondary-900 mb-6 stagger-item">
              Record interviews. <br />
              <span className="text-primary">Centralize feedback</span> automatically.
            </h1>
            
            <p className="text-lg md:text-xl text-secondary-600 mb-8 stagger-item">
              Streamline your social media presence with our powerful content management platform.
              Schedule, analyze, and optimize your posts across multiple platforms from one dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8 stagger-item">
              <Button size="lg" className="bg-primary hover:bg-primary-600" asChild>
                <Link to="/signup">
                  Get started for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/demo">Watch demo</Link>
              </Button>
            </div>
            
            <div className="space-y-3 stagger-item">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                <span className="text-secondary-700">No credit card required</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                <span className="text-secondary-700">14-day free trial</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                <span className="text-secondary-700">Cancel anytime</span>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 animate-on-scroll">
            <div className="relative stagger-item">
              <div className="bg-white p-4 rounded-2xl shadow-card border border-secondary-100 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&h=800" 
                  alt="Dashboard preview" 
                  className="rounded-lg shadow-sm w-full"
                />
              </div>
              
              {/* Floating decoration elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-100 rounded-full z-[-1] floating"></div>
              <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-secondary-200 rounded-full z-[-1] floating"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
