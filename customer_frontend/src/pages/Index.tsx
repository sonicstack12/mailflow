import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import SEOHead from "@/components/seo/SEOHead";
import StructuredData from "@/components/seo/StructuredData";
import {
  Mail,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";
import { useContent, getIcon, PricingPlan } from "@/hooks/useContent";
import { apiFetch } from "@/lib/api";

const PricingSection = memo(function PricingSection({ plans }: { plans: PricingPlan[] }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handlePlanCta = (_plan: PricingPlan) => {
    window.location.href = "/signup";
  };

  return (
    <>
      <Tabs defaultValue="monthly" className="w-fit mx-auto mb-8" onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">
            Yearly
            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Save 30%</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((plan, index) => {
          const IconComponent = getIcon(plan.icon);
          return (
            <Card key={index} className={`border relative overflow-hidden ${plan.popular ? "border-primary border-2" : "border-border"}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Popular
                </div>
              )}
              <CardHeader className="text-center pb-3 pt-5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <IconComponent className={`w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                <div className="text-center">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.monthlyPrice === 0 ? "Free" : `₹${billingCycle === "monthly" ? plan.monthlyPrice.toLocaleString() : plan.yearlyPrice.toLocaleString()}`}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <span className="text-muted-foreground text-sm"> for 1 month</span>
                  )}
                  {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      (₹{Math.round(plan.yearlyPrice / 12).toLocaleString()}/month)
                    </p>
                  )}
                </div>

                <ul className="space-y-1.5 text-xs">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className={plan.popular ? "text-foreground" : "text-muted-foreground"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full text-sm h-9"
                  onClick={() => handlePlanCta(plan)}
                >
                  {plan.cta}
                  {plan.popular && <ArrowRight className="w-3.5 h-3.5 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
});

const Index = () => {
  const location = useLocation();
  const { content, loading, error } = useContent();
  const [statusData, setStatusData] = useState<{ max_emails_per_day_free?: string }>({});

  useEffect(() => {
    apiFetch<{ max_emails_per_day_free: string }>("/api/public/status")
      .then((data) => setStatusData(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Loading skeleton component
  const SectionSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <SEOHead
        title="MailFlow - Email Automation Made Simple | Free Bulk Email Platform"
        description="Send personalized bulk emails using your own SMTP. Create dynamic templates with variables, schedule emails for any timezone, and track delivery - completely free."
        keywords="email automation, bulk email sender, SMTP email, email templates, scheduled emails, email marketing, personalized emails, free email tool"
      />
      <StructuredData
        organization={{
          name: "MailFlow",
          url: window.location.origin,
          description: "Free email automation platform for sending personalized bulk emails using your own SMTP.",
        }}
        softwareApplication={{
          name: "MailFlow",
          description: "Email automation platform with dynamic templates, scheduling, and SMTP integration",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: {
            price: "0",
            priceCurrency: "INR",
          },
        }}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section - Modern Premium Design */}
        <section className="relative pt-28 pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-slate-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-200/20 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-navy-800 text-sm font-semibold mb-8 shadow-sm">
                <Zap className="w-4 h-4 text-yellow-500" />
                Smart Email Automation Platform
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-navy-900 mb-6 leading-[1.1] tracking-tight">
                Email Automation
                <span className="block text-yellow-500 mt-2">Made Simple</span>
              </h1>

              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Send personalized bulk emails using your own SMTP. Create dynamic templates,
                schedule emails, and track everything — completely free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  asChild 
                  className="text-lg px-8 h-14 rounded-full bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold shadow-lg shadow-yellow-400/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Link to="/signup">
                    Start Free Today
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-14 rounded-full border-2 border-navy-200 text-navy-700 font-semibold hover:bg-navy-50 transition-all"
                  onClick={() => scrollToSection("how-it-works")}
                >
                  See How It Works
                </Button>
              </div>

              <div className="mt-16 flex flex-wrap justify-center gap-10 text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-yellow-600" />
                  </div>
                  <span className="font-medium">No credit card required</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-yellow-600" />
                  </div>
                  <span className="font-medium">{statusData.max_emails_per_day_free || "..."} emails/day free</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-yellow-600" />
                  </div>
                  <span className="font-medium">Use your own SMTP</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Features Section - Card Based Design */}
        <section id="features" className="py-24 bg-slate-50/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-navy-800 text-sm font-semibold mb-4">
                Features
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-5">
                Everything You Need
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                A complete email automation platform without the expensive price tag.
                All the features of premium tools, completely free.
              </p>
            </div>

            {loading ? (
              <SectionSkeleton count={6} />
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {content?.features.map((feature) => {
                  const IconComponent = getIcon(feature.icon);
                  return (
                    <Card key={feature.id} className="group border-0 shadow-card rounded-2xl overflow-hidden bg-white hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-7 h-7 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold text-navy-900 mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Benefits Section - Modern Cards */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-navy-800 text-sm font-semibold mb-4">
                Why Us
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-5">
                Why Choose MailFlow?
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Built for reliability, security, and scale. Here's what sets us apart.
              </p>
            </div>

            {loading ? (
              <SectionSkeleton count={6} />
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content?.benefits.map((benefit) => {
                  const IconComponent = getIcon(benefit.icon);
                  return (
                    <div key={benefit.id} className="group flex gap-5 p-6 rounded-2xl bg-slate-50 hover:bg-yellow-50/50 transition-colors duration-300">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-navy-900 mb-2 text-lg">{benefit.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* How It Works Section - Step Cards */}
        <section id="how-it-works" className="py-24 bg-slate-50/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-navy-800 text-sm font-semibold mb-4">
                Process
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-5">
                How It Works
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Get started in minutes with our simple 4-step process. No technical knowledge required.
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {content?.steps.map((step) => {
                  const IconComponent = getIcon(step.icon);
                  return (
                    <Card key={step.id} className="group relative overflow-hidden border-0 shadow-card rounded-2xl bg-white hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-8 text-center relative">
                        <div className="absolute top-4 right-4 text-6xl font-bold text-yellow-100/80">
                          {step.number}
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center mx-auto mb-5 relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold text-navy-900 mb-3 relative z-10">
                          {step.title}
                        </h3>
                        <p className="text-slate-600 relative z-10 leading-relaxed">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Use Cases Section - Team Cards */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-navy-800 text-sm font-semibold mb-4">
                Use Cases
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-5">
                Perfect For Every Team
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                From startups to enterprises, MailFlow powers email automation across industries.
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {content?.useCases.map((useCase) => {
                  const IconComponent = getIcon(useCase.icon);
                  return (
                    <Card key={useCase.id} className="group border-0 shadow-card rounded-2xl bg-white hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="font-bold text-navy-900 mb-3 text-lg">{useCase.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{useCase.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Pricing Section - Premium Cards */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-navy-800 text-sm font-semibold mb-4">
                Pricing
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-5">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Start free, upgrade when you need more. No hidden fees, no surprises.
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <Skeleton className="h-96 rounded-2xl" />
                <Skeleton className="h-96 rounded-2xl" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : content?.pricingPlans ? (
              <PricingSection plans={content.pricingPlans} />
            ) : null}
          </div>
        </section>

        {/* Footer - Dark Navy */}
        <footer className="py-16 bg-navy-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-navy-900" />
                  </div>
                  <span className="text-2xl font-bold">MailFlow</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Email automation platform. Send personalized bulk emails using your own SMTP.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-5 text-lg">Product</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><button onClick={() => scrollToSection("features")} className="hover:text-yellow-400 transition-colors">Features</button></li>
                  <li><button onClick={() => scrollToSection("pricing")} className="hover:text-yellow-400 transition-colors">Pricing</button></li>
                  <li><button onClick={() => scrollToSection("how-it-works")} className="hover:text-yellow-400 transition-colors">How It Works</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-5 text-lg">Legal</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><Link to="/privacy" className="hover:text-yellow-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="hover:text-yellow-400 transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-navy-800 text-center text-slate-400">
              <p> {new Date().getFullYear()} MailFlow. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;