import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/auth/AuthLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Welcome back!",
      description: "Redirecting to admin panel...",
    });
    navigate("/admin");
  };

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Sign in to access the admin panel"
      seoTitle="Admin Login | MailFlow"
      seoDescription="Sign in to the MailFlow admin panel to manage users, subscriptions, and analytics."
    >
      <div className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-navy-800">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="h-12 pl-12 rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-navy-800">Password</Label>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="h-12 pr-12 rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20" 
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors" 
                onClick={() => setShowPassword(!showPassword)} 
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold rounded-xl bg-yellow-400 hover:bg-yellow-500 text-navy-900 shadow-lg shadow-yellow-400/25 transition-all hover:scale-[1.02] active:scale-[0.98]" 
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Signing in...</>
            ) : (
              <>Sign in<ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500 font-medium">
            This login is for administrators only.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
