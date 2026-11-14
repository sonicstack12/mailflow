import { Link } from "react-router-dom";
import { Mail, Users, Globe, TrendingUp, Quote, ArrowRight } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  seoTitle?: string;
  seoDescription?: string;
}

const stats = [
  { value: "1M+", label: "Emails sent daily" },
  { value: "10K+", label: "Active users" },
  { value: "99.9%", label: "Deliverability" },
  { value: "4.9/5", label: "User rating" },
];

const AuthLayout = ({ 
  children, 
  title, 
  subtitle, 
  seoTitle,
  seoDescription 
}: AuthLayoutProps) => {
  return (
    <>
      <SEOHead 
        title={seoTitle || `${title} | MailFlow`}
        description={seoDescription || subtitle}
      />
      <div className="h-screen bg-background overflow-hidden">
        <div className="flex h-full">
          {/* Left Panel - Branding (Hidden on mobile) */}
          <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden bg-slate-900">
            {/* Abstract Background Pattern */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-white">MailFlow</span>
              </div>

              {/* Main Content - Stats */}
              <div className="flex-1 flex flex-col justify-center py-8">
                <h2 className="text-3xl xl:text-4xl font-bold text-white mb-3 leading-tight">
                  Trusted by thousands
                  <span className="block text-primary">of professionals</span>
                </h2>
                <p className="text-slate-400 mb-8 max-w-sm">
                  Join the growing community of businesses using MailFlow for their email automation needs.
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="text-2xl xl:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                      <div className="text-sm text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Use Case Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-medium">
                    <Users className="w-3.5 h-3.5" />
                    HR Teams
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Sales
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-medium">
                    <Globe className="w-3.5 h-3.5" />
                    Marketing
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Link to="/" className="mt-6 inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors group">
                Learn more about MailFlow
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
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
