'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ROUTES, API_ROUTES } from '@/constants';
import { apiClient, queryKeys } from '@/lib';
import { TokenManager } from '@/features/auth/services/token-manager';
import type { LoginResponse } from '@/features/auth/types';
import type { ApiResponse } from '@/types';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthLoading: boolean;
  logout: () => Promise<void>;
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const verifyTokenQuery = useQuery<ApiResponse<{ valid: boolean }>>({
    queryKey: queryKeys.auth.verify,
    queryFn: () => apiClient.get(API_ROUTES.verifyToken),
    retry: false,
    enabled: typeof window !== 'undefined' && TokenManager.isAccessTokenValid(),
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.post<void>(API_ROUTES.logout),
    onMutate: () => {
      TokenManager.clearTokens();
    },
    onSettled: async () => {
      await verifyTokenQuery.refetch();
      router.push(ROUTES.login);
    },
  });

  const refreshTokenMutation = useMutation({
    mutationFn: () =>
      apiClient.post<ApiResponse<LoginResponse>>(
        API_ROUTES.refreshToken,
        {
          refreshToken: TokenManager.getRefreshToken(),
        },
        { skipAuth: true },
      ),
    onSuccess: (response) => {
      if (response.data?.accessToken) {
        TokenManager.setAccessToken(response.data.accessToken);
        if (response.data.refreshToken) {
          TokenManager.setRefreshToken(response.data.refreshToken);
        }
      }
    },
  });

  const logout = useCallback(async () => {
    TokenManager.clearTokens();
    router.push(ROUTES.login);
  }, [router]);

  const hasToken = !!TokenManager.getAccessToken();
  const isValid = TokenManager.isAccessTokenValid();
  const isVerified = verifyTokenQuery.data?.data?.valid !== false;
  const isAuthenticated = hasToken && isValid && isVerified;

  const isAuthLoading = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return verifyTokenQuery.isLoading;
  }, [verifyTokenQuery.isLoading]);

  const isLoading = useMemo(() => {
    return isAuthLoading || logoutMutation.isPending;
  }, [isAuthLoading, logoutMutation.isPending]);

  const error = useMemo(() => {
    if (verifyTokenQuery.error) return verifyTokenQuery.error;
    if (logoutMutation.error) return logoutMutation.error;
    return null;
  }, [verifyTokenQuery.error, logoutMutation.error]);

  useEffect(() => {
    if (
      !isAuthLoading &&
      !isAuthenticated &&
      pathname !== ROUTES.login &&
      pathname !== ROUTES.register &&
      pathname !== ROUTES.forgotPassword &&
      pathname !== ROUTES.resetPassword
    ) {
      router.push(ROUTES.login);
    }
  }, [isAuthenticated, isAuthLoading, pathname, router]);

  useEffect(() => {
    if (!isAuthenticated || !TokenManager.getAccessToken()) return;

    const checkAndRefreshToken = () => {
      const token = TokenManager.getAccessToken();
      if (!token) return;

      const timeUntilExpiration = TokenManager.getTimeUntilExpiration(token);

      if (timeUntilExpiration <= 5 * 60 * 1000 && timeUntilExpiration > 0) {
        refreshTokenMutation.mutate();
      }
    };

    const token = TokenManager.getAccessToken();
    if (token) {
      const timeUntilExpiration = TokenManager.getTimeUntilExpiration(token);
      const initialDelay = Math.max(0, timeUntilExpiration - 5 * 60 * 1000);

      let intervalId: ReturnType<typeof setInterval> | null = null;

      const timer = setTimeout(() => {
        checkAndRefreshToken();

        intervalId = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
      }, initialDelay);

      return () => {
        clearTimeout(timer);
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [isAuthenticated, refreshTokenMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      isAuthLoading,
      logout,
      error,
    }),
    [isAuthenticated, isLoading, isAuthLoading, logout, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
