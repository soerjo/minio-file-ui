'use client';

import { useMutation } from '@tanstack/react-query';
import { fileRoutes } from '@/constants';
import { apiClient } from '@/lib';
import type { ApiResponse } from '@/types';
import type { PresignedUrlResponse } from '@/features/files/types';

export function useGetPresignedUrl() {
  return useMutation({
    mutationFn: (id: string) => apiClient.get<ApiResponse<PresignedUrlResponse>>(fileRoutes.url(id)),
  });
}
