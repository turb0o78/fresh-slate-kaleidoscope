import { Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsPage() {
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
          <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p>By accessing and using Purposify ("the Service"), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the Service.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. User Rights and Responsibilities</h2>
              <p>As a user of Purposify, you have the right to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access and use the Service in accordance with these terms</li>
                <li>Manage your social media content through our platform</li>
                <li>Receive technical support for service-related issues</li>
                <li>Cancel your subscription at any time</li>
              </ul>
              <p>Your responsibilities include:</p>
              <ul className="list-disc pl-6">
                <li>Maintaining the security of your account credentials</li>
                <li>Ensuring your content complies with all applicable laws and regulations</li>
                <li>Using the Service in a manner that doesn't interfere with other users</li>
                <li>Promptly reporting any security vulnerabilities or misuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Intellectual Property</h2>
              <p>The Service and its original content, features, and functionality are owned by Purposify and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
              <p>You retain all rights to any content you submit, post or display on or through the Service. By providing content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Disclaimer of Warranties</h2>
              <p>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p>In no event shall Purposify be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Account Termination</h2>
              <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
              <p>We reserve the right to modify or replace these Terms at any time. Material changes will be notified to users at least 30 days before they become effective.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <p>For any questions about these Terms, please contact us at:</p>
              <ul className="list-disc pl-6">
                <li>Email: legal@purposify.com</li>
                <li>Address: [Your Business Address]</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}