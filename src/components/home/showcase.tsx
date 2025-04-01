
import { useEffect } from 'react';

export function Showcase() {
  useEffect(() => {
    // Animation observer setup
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
    <section className="py-16 md:py-24 bg-secondary-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4 stagger-item">
            Features that make your life easier
          </h2>
          <p className="text-lg text-secondary-600 stagger-item">
            Our platform is designed with your workflow in mind, providing tools that simplify your social media management
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-on-scroll">
          {/* First showcase item */}
          <div className="flex flex-col lg:flex-row items-center gap-8 stagger-item">
            <div className="w-full lg:w-1/2">
              <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100 relative">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&h=600" 
                  alt="Analytics dashboard" 
                  className="rounded-lg shadow-sm w-full"
                />
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary-100 rounded-full z-[-1]"></div>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <h3 className="text-2xl font-bold mb-4 text-secondary-900">Real-time Analytics</h3>
              <p className="text-secondary-600 mb-6">
                Monitor the performance of your content across all platforms in real-time. 
                Get insights into engagement, reach, and audience demographics to optimize your strategy.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium text-sm">1</span>
                  </div>
                  <span className="text-secondary-700">Engagement tracking across platforms</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium text-sm">2</span>
                  </div>
                  <span className="text-secondary-700">Audience growth metrics</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium text-sm">3</span>
                  </div>
                  <span className="text-secondary-700">Content performance comparison</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Second showcase item */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-8 stagger-item">
            <div className="w-full lg:w-1/2">
              <h3 className="text-2xl font-bold mb-4 text-secondary-900">Easy Social Automation</h3>
              <p className="text-secondary-600 mb-6">
                Set up powerful automation workflows that save you time and ensure consistent posting.
                Schedule content months in advance or respond to trends quickly.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-sm">1</span>
                  </div>
                  <span className="text-secondary-700">Bulk content scheduling</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-sm">2</span>
                  </div>
                  <span className="text-secondary-700">Smart posting time optimization</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-sm">3</span>
                  </div>
                  <span className="text-secondary-700">Content recycling for evergreen posts</span>
                </li>
              </ul>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100 relative">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&h=600" 
                  alt="Content calendar" 
                  className="rounded-lg shadow-sm w-full"
                />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-blue-100 rounded-full z-[-1]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
