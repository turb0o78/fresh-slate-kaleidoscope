
import { Hero } from '../components/home/hero';
import { Features } from '../components/home/features';
import { Showcase } from '../components/home/showcase';
import { Pricing } from '../components/home/pricing';
import { Testimonials } from '../components/home/testimonials';
import { CTA } from '../components/home/cta';

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <Features />
      
      {/* Showcase Section */}
      <Showcase />
      
      {/* Pricing Section */}
      <Pricing />
      
      {/* Testimonials Section */}
      <Testimonials />
      
      {/* CTA Section */}
      <CTA />
    </div>
  );
}
