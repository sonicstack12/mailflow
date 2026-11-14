import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Check, Shield, Clock, Zap, Sparkles } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  seoTitle?: string;
  seoDescription?: string;
}

const features = [
  { icon: Zap, text: "Unlimited personalized emails", highlight: true },
  { icon: Shield, text: "Your own SMTP servers" },
  { icon: Clock, text: "Smart scheduling with timezones" },
  { icon: Check, text: "Real-time delivery tracking" },
];

const AuthLayout = ({
  children,
  title,
  subtitle,
  seoTitle,
  seoDescription
}: AuthLayoutProps) => {
  useEffect(() => {
    document.title = seoTitle || `${title} | MailFlow Admin`;
  }, [seoTitle, title]);

  return (
    <>
      <div className="h-screen bg-background overflow-hidden">
        <div className="flex h-full">
          {/* Left Panel - Branding (Hidden on mobile) */}
          <div className="hidden lg:flex lg:w-[42%] xl:w-2/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex flex-col justify-between p-6 xl:p-8 w-full">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary-foreground/30 transition-colors">
                  <Mail className="w-4.5 h-4.5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary-foreground">MailFlow</span>
              </Link>

              {/* Main Content */}
              <div className="flex-1 flex flex-col justify-center py-6">
                <div className="space-y-1.5 mb-6">
                  <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider">
                    Email Automation Platform
                  </p>
                  <h1 className="text-3xl xl:text-4xl font-bold text-primary-foreground leading-tight">
                    Send smarter,
                    <br />
                    <span className="text-primary-foreground/90">grow faster</span>
                  </h1>
                </div>

                <ul className="space-y-2.5">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${feature.highlight
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-primary-foreground/20 text-primary-foreground'
                        }`}>
                        <feature.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-primary-foreground font-medium">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Testimonial - compact */}
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-primary-foreground/90 text-xs leading-relaxed mb-1.5">
                      "MailFlow transformed how we handle email campaigns. The scheduling
                      and template features saved us hours every week."
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary-foreground text-xs">Priya S.</span>
                      <span className="text-primary-foreground/60 text-xs">• HR Manager</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            {/* Mobile Header */}
            <div className="lg:hidden p-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">MailFlow</span>
              </Link>
            </div>

            {/* Form Container */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
              <div className="w-full max-w-sm sm:max-w-md">
                <div className="text-center mb-4 lg:mb-5">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>

                {children}
              </div>
            </div>

            {/* Footer - minimal */}
            <div className="p-3 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} MailFlow. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
