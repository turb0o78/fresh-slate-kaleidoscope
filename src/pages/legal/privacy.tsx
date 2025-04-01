import { Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Share2 className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">Purposify</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>This Privacy Policy explains how Purposify ("we", "us", "our") collects, uses, and protects your personal information. This policy applies to all users of our service and website visitors.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium mb-2">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Name and email address</li>
                <li>Social media account information</li>
                <li>Payment information</li>
                <li>Usage data and analytics</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6">
                <li>IP address and device information</li>
                <li>Browser type and settings</li>
                <li>Usage patterns and preferences</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6">
                <li>Provide and maintain our services</li>
                <li>Process your transactions</li>
                <li>Send service updates and marketing communications</li>
                <li>Improve our services and user experience</li>
                <li>Detect and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Third Parties</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6">
                <li>Service providers and business partners</li>
                <li>Social media platforms (with your consent)</li>
                <li>Law enforcement (when legally required)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Cookie Policy</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6">
                <li>Remember your preferences</li>
                <li>Analyze site usage</li>
                <li>Personalize content</li>
                <li>Improve our services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights and Data Deletion</h2>
              <p>Under GDPR, CCPA, and other privacy regulations, you have the right to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request data deletion</li>
                <li>Object to data processing</li>
                <li>Request data portability</li>
                <li>Withdraw consent</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">Data Deletion Process</h3>
              <p>To request deletion of your data:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Log into your account and visit the Settings page</li>
                <li>Click on "Delete Account and Data"</li>
                <li>Confirm your decision by entering your password</li>
                <li>Your data will be permanently deleted within 30 days</li>
              </ul>

              <p>For Facebook-connected accounts:</p>
              <ul className="list-disc pl-6">
                <li>You can request data deletion through Facebook's Settings</li>
                <li>Visit Facebook's "Apps and Websites" settings</li>
                <li>Find Purposify and remove access</li>
                <li>We will automatically process the deletion request</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
              <ul className="list-disc pl-6">
                <li>Encryption in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Employee training and confidentiality agreements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
              <p>We retain your personal data for as long as necessary to:</p>
              <ul className="list-disc pl-6">
                <li>Provide our services</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Updates to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by:</p>
              <ul className="list-disc pl-6">
                <li>Posting the new policy on our website</li>
                <li>Sending an email notification</li>
                <li>Displaying a prominent notice in our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <p>For privacy-related inquiries, please contact our Data Protection Officer:</p>
              <ul className="list-disc pl-6">
                <li>Email: privacy@purposify.com</li>
                <li>Address: [Your Business Address]</li>
                <li>Phone: [Your Phone Number]</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}