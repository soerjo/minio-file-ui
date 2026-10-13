'use client';

import { useQuery } from '@tanstack/react-query';
import { fileRoutes } from '@/constants';
import { apiClient, queryKeys } from '@/lib';
import type { ApiResponse } from '@/types';
import type { FileUpload } from '@/features/files/types';

export function useGetFile(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.files.detail(id ?? ''),
    queryFn: () => apiClient.get<ApiResponse<FileUpload>>(fileRoutes.detail(id as string)),
    enabled: Boolean(id),
  });
}
