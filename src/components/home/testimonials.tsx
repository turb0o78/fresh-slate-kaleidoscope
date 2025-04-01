
import { useEffect } from 'react';
import { Star } from 'lucide-react';

export function Testimonials() {
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
    <section className="py-16 md:py-24 bg-cta-pattern">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll">
          <div className="flex justify-center mb-4 stagger-item">
            <Star className="h-12 w-12 text-yellow-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4 stagger-item">
            Recruiters love us
          </h2>
          <p className="text-lg text-secondary-600 stagger-item">
            Join thousands of content creators who trust Purposify to manage their social media presence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-on-scroll">
          {/* Testimonial 1 */}
          <div className="bg-white p-6 rounded-xl shadow-card border border-secondary-100 stagger-item">
            <div className="flex items-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-secondary-700 mb-6">
              "Purposify has completely transformed how I manage my social media content. The automation features save me hours every week and the analytics provide valuable insights for my strategy."
            </p>
            <div className="flex items-center">
              <img
                src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&h=100"
                alt="Alex Chen"
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <h4 className="font-medium">Alex Chen</h4>
                <p className="text-sm text-secondary-500">Digital Creator</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white p-6 rounded-xl shadow-card border border-secondary-100 stagger-item">
            <div className="flex items-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-secondary-700 mb-6">
              "The analytics and insights have helped me understand my audience better and create more engaging content. I've seen a 40% increase in engagement since I started using Purposify."
            </p>
            <div className="flex items-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100"
                alt="Sarah Johnson"
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <h4 className="font-medium">Sarah Johnson</h4>
                <p className="text-sm text-secondary-500">Content Creator</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white p-6 rounded-xl shadow-card border border-secondary-100 stagger-item">
            <div className="flex items-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-secondary-700 mb-6">
              "As a social media manager handling multiple client accounts, Purposify has been a game-changer for my workflow. The intuitive interface and powerful scheduling tools have simplified my daily tasks."
            </p>
            <div className="flex items-center">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100"
                alt="Michael Torres"
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <h4 className="font-medium">Michael Torres</h4>
                <p className="text-sm text-secondary-500">Social Media Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
