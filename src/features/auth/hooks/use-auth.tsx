"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth as useAuthContext } from "@/features/auth/providers/auth-provider";
import { useIsMounted } from "@/hooks";
import { ROUTES } from "@/constants";

export function useAuth() {
  return useAuthContext();
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const mounted = useIsMounted();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(ROUTES.login);
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (!mounted || isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const mounted = useIsMounted();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push(ROUTES.home);
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (!mounted || isAuthLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}