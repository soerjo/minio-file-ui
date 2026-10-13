'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileRoutes } from '@/constants';
import { apiClient, queryKeys } from '@/lib';
import type { ApiResponse } from '@/types';
import type { FileUpload, FilesListResponse } from '@/features/files/types';

interface DeleteFileContext {
  snapshots: [readonly unknown[], FilesListResponse | undefined][];
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<FileUpload>, Error, string, DeleteFileContext>({
    mutationFn: (id: string) => apiClient.delete<ApiResponse<FileUpload>>(fileRoutes.detail(id)),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.files.all });

      const snapshots = queryClient.getQueriesData<FilesListResponse>({
        queryKey: queryKeys.files.all,
      });

      queryClient.setQueriesData<FilesListResponse>({ queryKey: queryKeys.files.all }, (data) => {
        if (!data?.items) return data;
        return {
          ...data,
          items: data.items.filter((item) => item.id !== id),
          total: Math.max(0, data.total - 1),
        };
      });

      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });
}
