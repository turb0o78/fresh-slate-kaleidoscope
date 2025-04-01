
import { BarChart2, Clock, Share2, MessageSquare, LayoutDashboard, Shield } from 'lucide-react';
import { useEffect } from 'react';

export function Features() {
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
    <section className="py-16 md:py-24" id="features">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4 stagger-item">Go from question to lead</h2>
          <p className="text-lg md:text-xl text-secondary-600 stagger-item">
            Our platform streamlines your workflow and helps you focus on what matters most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-on-scroll">
          {/* Feature 1 */}
          <div className="feature-card stagger-item">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-5">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Cross-Platform Posting</h3>
            <p className="text-secondary-600">
              Post your content across multiple social media platforms with a single click.
              Save time and maintain consistent messaging everywhere.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card stagger-item">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-5">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Automated Scheduling</h3>
            <p className="text-secondary-600">
              Schedule your posts in advance and let our platform handle the publishing.
              Post at optimal times for maximum engagement.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card stagger-item">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-5">
              <BarChart2 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Analytics Dashboard</h3>
            <p className="text-secondary-600">
              Track your content performance with detailed analytics and insights.
              Make data-driven decisions for your social media strategy.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card stagger-item">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-5">
              <LayoutDashboard className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Intuitive Interface</h3>
            <p className="text-secondary-600">
              Our user-friendly dashboard makes managing your social media presence simple and efficient.
              No steep learning curve, start posting right away.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="feature-card stagger-item">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-5">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Engagement Tools</h3>
            <p className="text-secondary-600">
              Monitor and respond to comments and messages across platforms from one unified inbox.
              Build stronger relationships with your audience.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="feature-card stagger-item">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-5">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Content Security</h3>
            <p className="text-secondary-600">
              Keep your content safe with our secure storage and backup solutions.
              Control access and permissions for team collaboration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
