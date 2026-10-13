'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, ROUTES } from '@/constants';
import { apiClient, queryKeys } from '@/lib';
import { TokenManager } from '@/features/auth/services/token-manager';
import type { LoginFormValues, LoginResponse } from '@/features/auth/types';
import type { ApiResponse } from '@/types';
import { useRouter } from 'next/navigation';

interface LoginContextValue {
  login: (data: LoginFormValues) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const LoginContext = createContext<LoginContextValue | undefined>(undefined);

export function LoginProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) => apiClient.post<ApiResponse<LoginResponse>>(API_ROUTES.login, data),
    onSuccess: (response) => {
      if (response.data?.accessToken) {
        TokenManager.setAccessToken(response.data.accessToken);
        TokenManager.setRefreshToken(response.data.refreshToken);
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.verify });
        router.push(ROUTES.home);
      }
    },
  });

  const { mutateAsync, isPending, error } = loginMutation;

  const value = useMemo<LoginContextValue>(
    () => ({
      login: async (data: LoginFormValues) => {
        await mutateAsync(data);
      },
      isLoading: isPending,
      error,
    }),
    [mutateAsync, isPending, error],
  );

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
}

export function useLogin() {
  const context = useContext(LoginContext);
  if (context === undefined) {
    throw new Error('useLogin must be used within a LoginProvider');
  }
  return context;
}
