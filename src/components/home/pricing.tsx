
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);
  
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
            }, index * 100);
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
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4 stagger-item">
            Pricing so simple, you buy instantly
          </h2>
          <p className="text-lg md:text-xl text-secondary-600 stagger-item">
            Choose the plan that best fits your needs. All plans include our core features to help you grow your social media presence.
          </p>
        </div>

        <div className="flex justify-center mb-10 animate-on-scroll">
          <div className="bg-secondary-100 p-1 rounded-full flex stagger-item">
            <button
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isAnnual ? 'bg-white shadow-sm text-secondary-900' : 'text-secondary-600'
              }`}
              onClick={() => setIsAnnual(true)}
            >
              Annual (Save 20%)
            </button>
            <button
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isAnnual ? 'bg-white shadow-sm text-secondary-900' : 'text-secondary-600'
              }`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-on-scroll">
          {/* Free Trial */}
          <div className="bg-white rounded-2xl shadow-card border border-secondary-100 overflow-hidden stagger-item">
            <div className="p-8">
              <h3 className="text-xl font-bold mb-2">14-Day Free Trial</h3>
              <p className="text-secondary-600 mb-4">Discover our solutions risk-free</p>
              <div className="flex items-end mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-secondary-500 ml-1 mb-1">forever</span>
              </div>
              
              <Button className="w-full mb-6" variant="outline" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">20 video uploads</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">1 account per platform</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">Basic support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">Basic analytics</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Basic Plan */}
          <div className="bg-white rounded-2xl shadow-card border-2 border-primary relative transform scale-105 stagger-item">
            <div className="absolute top-0 left-0 right-0 bg-primary text-white text-center py-2 text-sm font-medium">
              Most Popular
            </div>
            <div className="p-8 pt-12">
              <h3 className="text-xl font-bold mb-2">Basic</h3>
              <p className="text-secondary-600 mb-4">Perfect for small creators</p>
              <div className="flex items-end mb-6">
                <span className="text-4xl font-bold">${isAnnual ? '10' : '12'}</span>
                <span className="text-secondary-500 ml-1 mb-1">per month</span>
              </div>
              
              <Button className="w-full mb-6 bg-primary hover:bg-primary-600" asChild>
                <Link to="/signup?plan=basic">
                  Choose Basic
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">50 video uploads</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">2 accounts per platform</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">Custom branding</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-card border border-secondary-100 overflow-hidden stagger-item">
            <div className="p-8">
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-secondary-600 mb-4">For growing creators</p>
              <div className="flex items-end mb-6">
                <span className="text-4xl font-bold">${isAnnual ? '18' : '22'}</span>
                <span className="text-secondary-500 ml-1 mb-1">per month</span>
              </div>
              
              <Button className="w-full mb-6" asChild>
                <Link to="/signup?plan=pro">Choose Pro</Link>
              </Button>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">100 video uploads</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">5 accounts per platform</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">Premium support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">Premium analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">White-label exports</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-secondary-700">API access</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
