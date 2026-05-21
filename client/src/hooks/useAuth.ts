import { useQuery } from "@tanstack/react-query";
import type { GlobalRole } from "@shared/schema";

interface User {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  hallName?: string;
  city?: string;
  state?: string;
  subscriptionTier?: string;
  accountStatus: string;
  onboardingComplete: boolean;
}

interface AuthResponse {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useAuth(): AuthResponse {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      // If 401, user is not authenticated - return null instead of throwing
      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`);
      }

      const userData = await response.json();
      return userData;
    },
    retry: false, // Don't retry auth failures
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error: error as Error | null,
  };
}