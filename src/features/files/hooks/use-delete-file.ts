'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileRoutes } from '@/constants';
import { apiClient, queryKeys } from '@/lib';
import type { ApiResponse } from '@/types';
import type { FileUpload } from '@/features/files/types';

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<ApiResponse<FileUpload>>(fileRoutes.detail(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });
}
