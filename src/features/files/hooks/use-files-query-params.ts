'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_SORT, SORT_OPTIONS } from '@/features/files/constants';
import type { FilesSort } from '@/features/files/types';

const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((option) => option.value));

function parsePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function parseSort(value: string | null): FilesSort {
  return value && VALID_SORTS.has(value) ? (value as FilesSort) : DEFAULT_SORT;
}

export function useFilesQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get('page'));
  const search = searchParams.get('search') ?? '';
  const sort = parseSort(searchParams.get('sort'));

  const commit = useCallback(
    (next: { page?: number; search?: string; sort?: FilesSort }) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextPage = next.page ?? page;
      const nextSearch = next.search !== undefined ? next.search : search;
      const nextSort = next.sort ?? sort;

      if (nextPage > 1) params.set('page', String(nextPage));
      else params.delete('page');

      if (nextSearch) params.set('search', nextSearch);
      else params.delete('search');

      if (nextSort !== DEFAULT_SORT) params.set('sort', nextSort);
      else params.delete('sort');

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [page, pathname, router, search, searchParams, sort],
  );

  const setPage = useCallback((nextPage: number) => commit({ page: nextPage }), [commit]);
  const setSearch = useCallback((nextSearch: string) => commit({ search: nextSearch, page: 1 }), [commit]);
  const setSort = useCallback((nextSort: FilesSort) => commit({ sort: nextSort, page: 1 }), [commit]);

  return { page, search, sort, setPage, setSearch, setSort };
}
