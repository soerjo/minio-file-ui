import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/__tests__/test-utils';
import { API_ROUTES, fileRoutes } from '@/constants';
import { apiClient, queryKeys } from '@/lib';
import { useDeleteFile, useFilesList, useGetPresignedUrl } from '@/features/files/hooks';
import { makeFilesListResponse, makeFileUpload } from './factories';

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useFilesList', () => {
  it('builds the list endpoint from filters and caches under queryKeys.files.list', async () => {
    const client = createQueryClient();
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ success: true, data: makeFilesListResponse() });
    const filters = { page: 2, limit: 20, search: 'report', sort: 'size:desc' as const };

    const { result } = renderHook(() => useFilesList(filters), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith(`${API_ROUTES.files.list}?page=2&limit=20&search=report&sort=size%3Adesc`);
    expect(client.getQueryData(queryKeys.files.list(filters))).toBeDefined();
  });

  it('omits the query string when filters are empty', async () => {
    const client = createQueryClient();
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ success: true, data: makeFilesListResponse() });

    const { result } = renderHook(() => useFilesList(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith(API_ROUTES.files.list);
    expect(client.getQueryData(queryKeys.files.list({}))).toBeDefined();
  });
});

describe('useDeleteFile', () => {
  it('calls the detail route and invalidates the files cache on success', async () => {
    const client = createQueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const deleteSpy = vi
      .spyOn(apiClient, 'delete')
      .mockResolvedValue({ success: true, data: makeFileUpload({ id: 'file-9' }) });

    const { result } = renderHook(() => useDeleteFile(), { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.mutateAsync('file-9');
    });

    expect(deleteSpy).toHaveBeenCalledWith(fileRoutes.detail('file-9'));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.files.all });
  });
});

describe('useGetPresignedUrl', () => {
  it('requests a presigned URL from the url route', async () => {
    const client = createQueryClient();
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      success: true,
      data: { url: 'https://minio.test/file-7', expiresAt: '2026-01-15T12:15:00.000Z' },
    });

    const { result } = renderHook(() => useGetPresignedUrl(), { wrapper: createWrapper(client) });

    await act(async () => {
      await result.current.mutateAsync('file-7');
    });

    expect(getSpy).toHaveBeenCalledWith(fileRoutes.url('file-7'));
  });
});
