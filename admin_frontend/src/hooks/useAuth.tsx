import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiFetch, setAccessToken } from "@/lib/api";

export interface Profile {
  user_id: string;
  subscription_tier: "free" | "premium";
  subscription_expires_at: string | null;
  daily_email_count: number;
  last_email_reset_date: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  roles: Array<"admin" | "moderator" | "user">;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const data = await apiFetch<{ user: AuthUser; profile: Profile | null }>("/api/auth/me");
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setAccessToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const data = await apiFetch<{ ok: true; token?: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName }),
      });
      if (data.token) setAccessToken(data.token);
      await refreshProfile();
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e : new Error("Signup failed") };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiFetch<{ ok: true; token?: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.token) setAccessToken(data.token);
      await refreshProfile();
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e : new Error("Login failed") };
    }
  };

  const signOut = async () => {
    try {
      await apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {
      // Backend may not be running — that's ok
    } finally {
      setAccessToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
