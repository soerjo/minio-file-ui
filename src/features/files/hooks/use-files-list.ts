'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { API_ROUTES } from '@/constants';
import { apiClient, queryKeys } from '@/lib';
import type { ApiResponse } from '@/types';
import type { FilesListParams, FilesListResponse } from '@/features/files/types';

function buildFilesListEndpoint(filters: FilesListParams): string {
  const params = new URLSearchParams();

  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return query ? `${API_ROUTES.files.list}?${query}` : API_ROUTES.files.list;
}

export function useFilesList(filters: FilesListParams = {}) {
  return useQuery({
    queryKey: queryKeys.files.list(filters),
    queryFn: () => apiClient.get<ApiResponse<FilesListResponse>>(buildFilesListEndpoint(filters)),
    placeholderData: keepPreviousData,
  });
}
