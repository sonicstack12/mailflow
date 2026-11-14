import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Eye, EyeOff, Loader2, Mail, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [statusData, setStatusData] = useState<{ max_emails_per_day_free?: string }>({});

  useEffect(() => {
    apiFetch<{ max_emails_per_day_free: string }>("/api/public/status")
      .then((data) => setStatusData(data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast({
        title: "Terms required",
        description: "Please agree to the terms of service.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password, name);
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    toast({
      title: "Account created!",
      description: "Redirecting to your dashboard...",
    });
    setIsLoading(false);
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your free trial today"
      seoTitle="Sign Up | MailFlow - Email Automation Platform"
      seoDescription={`Create your free MailFlow account. Get ${statusData.max_emails_per_day_free || "..."} emails per day free for 1 month with dynamic templates and smart scheduling.`}
    >
      <div className="space-y-4">
        {/* Free Trial Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse" />
            Free for 1 month • {statusData.max_emails_per_day_free || "..."} emails/day
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="h-10 pl-10" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 pl-10" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="h-10 pl-10 pr-12" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} className="mt-0.5" />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:text-primary/80 underline-offset-4 hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:text-primary/80 underline-offset-4 hover:underline">Privacy Policy</Link>
            </label>
          </div>

          <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
            ) : (
              <>Create account<ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in to your account<ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;
