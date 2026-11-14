import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { apiFetch } from "@/lib/api";

const Terms = () => {
  const [statusData, setStatusData] = useState<{ max_emails_per_day_free?: string }>({});

  useEffect(() => {
    apiFetch<{ max_emails_per_day_free: string }>("/api/public/status")
      .then((data) => setStatusData(data))
      .catch(console.error);
  }, []);
  return (
    <>
      <SEOHead 
        title="Terms of Service | MailFlow"
        description="Read MailFlow's terms of service. Understand your rights and responsibilities when using our email automation platform."
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
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using MailFlow ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service. These terms apply to all users, 
              including visitors, registered users, and others who access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              MailFlow is an email automation platform that allows users to send personalized bulk emails 
              using their own SMTP servers. The Service includes email template creation, scheduling, 
              Excel data import, and delivery tracking features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Responsibilities</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>You must provide accurate and complete registration information</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must comply with all applicable laws regarding email communications</li>
              <li>You agree not to use the Service for spamming or sending unsolicited emails</li>
              <li>You must have proper consent from recipients before sending marketing emails</li>
              <li>You are responsible for your own SMTP server configuration and deliverability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Free Tier Limitations</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The free tier of MailFlow is available for 1 month and includes the following limitations:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Free for 1 month only</li>
              <li>Maximum of {statusData.max_emails_per_day_free || "..."} emails per day</li>
              <li>Email logs and reports are stored for 24 hours only</li>
              <li>Access to standard templates only (premium templates are locked)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Premium Subscription</h2>
            <p className="text-muted-foreground leading-relaxed">
              Premium plans are available at ₹499 for 2 months or ₹2,100/year. Premium users enjoy unlimited emails, 
              logs stored for 7 days, access to all templates (standard + premium), priority email delivery, 
              and priority support. Subscription fees are non-refundable except as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Anti-Spam Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              MailFlow has zero tolerance for spam. Users must comply with CAN-SPAM, GDPR, and other 
              applicable anti-spam laws. Violation of this policy will result in immediate account 
              termination without refund. We recommend using proper rate limiting (2-3 seconds between emails) 
              to ensure deliverability and avoid spam filters.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. SMTP Credentials</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for your SMTP server credentials. While we encrypt your credentials 
              using AES-256 encryption, you agree that MailFlow is not liable for any issues arising from 
              your SMTP configuration, including delivery failures, bounces, or account suspensions by 
              your email provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its original content, features, and functionality, is owned by MailFlow 
              and is protected by international copyright, trademark, and other intellectual property laws. 
              Your email templates and data remain your property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              MailFlow shall not be liable for any indirect, incidental, special, consequential, or punitive 
              damages resulting from your use of the Service. This includes but is not limited to email 
              delivery failures, data loss, or business interruption.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to terminate or suspend your account at any time for violations of these 
              terms. You may also delete your account at any time through the settings page. Upon termination, 
              your data will be deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes via email. Continued use of the Service after changes constitutes acceptance of the 
              new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact us at support@mailflow.com
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

export default Terms;