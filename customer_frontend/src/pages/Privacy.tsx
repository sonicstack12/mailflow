import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

const Privacy = () => {
  return (
    <>
      <SEOHead 
        title="Privacy Policy | MailFlow"
        description="Learn how MailFlow collects, uses, and protects your personal information. Our privacy policy explains data handling practices."
      />
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">MailFlow</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              MailFlow ("we", "our", or "us") respects your privacy and is committed to protecting your 
              personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our email automation service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We collect the following types of information:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Email address, name, company name, and password (hashed)</li>
              <li><strong>SMTP Credentials:</strong> Your SMTP server settings (encrypted with AES-256)</li>
              <li><strong>Email Templates:</strong> Templates you create including subject lines and content</li>
              <li><strong>Recipient Data:</strong> Email addresses and data from uploaded Excel files (processed temporarily)</li>
              <li><strong>Usage Data:</strong> Email sending logs, delivery status, and scheduling information</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide and maintain our email automation service</li>
              <li>To send emails on your behalf using your SMTP credentials</li>
              <li>To schedule and manage your email sending queue</li>
              <li>To generate delivery reports and analytics</li>
              <li>To communicate with you about service updates and support</li>
              <li>To improve our service and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We retain your data based on your subscription tier:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Free Tier:</strong> Email logs and reports are stored for 24 hours</li>
              <li><strong>Premium Tier:</strong> Logs stored for 7 days</li>
              <li><strong>Uploaded Excel Files:</strong> Automatically deleted after processing (within 24 hours)</li>
              <li><strong>Account Data:</strong> Retained until you delete your account</li>
              <li><strong>SMTP Credentials:</strong> Stored encrypted until you remove them or delete your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>SMTP passwords are encrypted using AES-256 encryption</li>
              <li>All data is transmitted over HTTPS/TLS</li>
              <li>Passwords are hashed using bcrypt</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal data. We may share data only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>With your consent</li>
              <li>To comply with legal obligations or valid legal requests</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and preferences. We may use analytics 
              cookies to understand how you use our service. You can control cookie preferences through 
              your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data may be processed in countries outside your country of residence. We ensure 
              appropriate safeguards are in place for such transfers in compliance with applicable 
              data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for children under 16 years of age. We do not knowingly 
              collect personal information from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or want to exercise your rights, 
              please contact us at privacy@mailflow.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2024 MailFlow. All rights reserved.
        </div>
      </footer>
    </div>
    </>
  );
};

export default Privacy;