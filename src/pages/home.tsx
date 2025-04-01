import { ArrowRight, Share2, Zap, Shield, BarChart2, Check, Download, Clock, MessageSquare, Star, Users, Rocket, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Cross-Post Your Content
              <span className="text-blue-600"> Effortlessly</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Streamline your social media presence with our powerful content management platform.
              Schedule, analyze, and optimize your posts across multiple platforms from one dashboard.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/demo">View demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">What Benefits Will You Get?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your social media workflow with powerful features designed for content creators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Time Savings */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Save Precious Time</h3>
              <p className="text-gray-600">
                Automate your content distribution across platforms and reduce manual work by up to 80%
              </p>
            </div>

            {/* Reach Growth */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <Rocket className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Grow Your Reach</h3>
              <p className="text-gray-600">
                Expand your audience across multiple platforms while maintaining consistent branding
              </p>
            </div>

            {/* Analytics */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-6">
                <BarChart2 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Data-Driven Insights</h3>
              <p className="text-gray-600">
                Make informed decisions with comprehensive analytics and performance tracking
              </p>
            </div>

            {/* Global Reach */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-6">
                <Globe className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Global Presence</h3>
              <p className="text-gray-600">
                Reach audiences worldwide with smart scheduling and localized content delivery
              </p>
            </div>

            {/* Engagement */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-6">
                <Users className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Boost Engagement</h3>
              <p className="text-gray-600">
                Optimize your content strategy with AI-powered recommendations and timing
              </p>
            </div>

            {/* Support */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-6">
                <MessageSquare className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Expert Support</h3>
              <p className="text-gray-600">
                Get dedicated assistance from our team of social media professionals
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link to="/signup">
                Start Growing Your Audience
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Purposify?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-white">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Share2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cross-Platform Posting</h3>
              <p className="text-gray-600">
                Post your content across multiple social media platforms with a single click.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-white">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Scheduling</h3>
              <p className="text-gray-600">
                Schedule your posts in advance and let our platform handle the publishing.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-white">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">
                Track your content performance with detailed analytics and insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose the plan that best fits your needs. All plans include our core features to help you grow your social media presence.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">14-Day Free Trial</h3>
                <p className="text-gray-600 mb-4">Discover our solutions risk-free</p>
                <div className="text-4xl font-bold">$0</div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>20 video uploads</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>1 account per platform</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Basic support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Basic analytics</span>
                </li>
              </ul>
              
              <Button className="w-full" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
            </div>

            {/* Basic Plan */}
            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-8 relative">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm">
                Popular
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">Basic</h3>
                <p className="text-gray-600 mb-4">Perfect for small creators</p>
                <div className="text-4xl font-bold">$10</div>
                <p className="text-gray-500 text-sm">per month</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>50 video uploads</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>2 accounts per platform</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Advanced analytics</span>
                </li>
              </ul>
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                <Link to="/signup?plan=basic">Choose Basic</Link>
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-gray-600 mb-4">For growing creators</p>
                <div className="text-4xl font-bold">$18</div>
                <p className="text-gray-500 text-sm">per month</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>100 video uploads</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>5 accounts per platform</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Premium support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Premium analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>White-label exports</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>API access</span>
                </li>
              </ul>
              
              <Button className="w-full" asChild>
                <Link to="/signup?plan=pro">Choose Pro</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Trusted by Content Creators</h2>
              <p className="text-gray-600">
                Join thousands of content creators who trust Purposify to manage their social media presence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200"
                  alt="Creator"
                  className="w-12 h-12 rounded-full mb-4"
                />
                <p className="text-gray-600 mb-4">
                  "Purposify has completely transformed how I manage my social media content. The automation features save me hours every week."
                </p>
                <p className="font-medium">Alex Chen</p>
                <p className="text-sm text-gray-500">Digital Creator</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200"
                  alt="Creator"
                  className="w-12 h-12 rounded-full mb-4"
                />
                <p className="text-gray-600 mb-4">
                  "The analytics and insights have helped me understand my audience better and create more engaging content."
                </p>
                <p className="font-medium">Sarah Johnson</p>
                <p className="text-sm text-gray-500">Content Creator</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to streamline your social media workflow?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of content creators who trust Purposify to manage their social media presence.
          </p>
          <Button size="lg" variant="outline" className="bg-white text-blue-600 border-white" asChild>
            <Link to="/signup">Start your free trial</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}