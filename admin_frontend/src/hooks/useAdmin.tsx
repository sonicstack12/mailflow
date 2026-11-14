import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

export const useAdmin = () => {
  const { user, loading } = useAuth();
  const isAdmin = useMemo(() => !!user?.roles?.includes("admin"), [user]);
  return { isAdmin, loading };
};
