import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReplace, mockSearchParams, mockPathname } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockSearchParams: { value: new URLSearchParams() },
  mockPathname: { value: '/files' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname.value,
  useSearchParams: () => mockSearchParams.value,
}));

import { useFilesQueryParams } from '@/features/files/hooks';

describe('useFilesQueryParams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.value = new URLSearchParams();
    mockPathname.value = '/files';
  });

  it('returns defaults when the URL has no params', () => {
    const { result } = renderHook(() => useFilesQueryParams());

    expect(result.current.page).toBe(1);
    expect(result.current.search).toBe('');
    expect(result.current.sort).toBe('createdAt:desc');
  });

  it('parses page, search and sort from the URL', () => {
    mockSearchParams.value = new URLSearchParams({ page: '3', search: 'report', sort: 'size:desc' });

    const { result } = renderHook(() => useFilesQueryParams());

    expect(result.current.page).toBe(3);
    expect(result.current.search).toBe('report');
    expect(result.current.sort).toBe('size:desc');
  });

  it('coerces invalid page and sort values to defaults', () => {
    mockSearchParams.value = new URLSearchParams({ page: '0', sort: 'bogus:field' });

    const { result } = renderHook(() => useFilesQueryParams());

    expect(result.current.page).toBe(1);
    expect(result.current.sort).toBe('createdAt:desc');
  });

  it('writes page to the URL', () => {
    const { result } = renderHook(() => useFilesQueryParams());

    act(() => result.current.setPage(2));

    expect(mockReplace).toHaveBeenCalledWith('/files?page=2', { scroll: false });
  });

  it('writes search and resets page to 1', () => {
    mockSearchParams.value = new URLSearchParams({ page: '3' });

    const { result } = renderHook(() => useFilesQueryParams());

    act(() => result.current.setSearch('report'));

    expect(mockReplace).toHaveBeenCalledWith('/files?search=report', { scroll: false });
  });

  it('drops default values from the URL', () => {
    mockSearchParams.value = new URLSearchParams({ page: '2', search: 'x', sort: 'size:asc' });

    const { result } = renderHook(() => useFilesQueryParams());

    act(() => result.current.setPage(1));

    const url = mockReplace.mock.calls.at(-1)?.[0] as string;
    expect(url).not.toContain('page=');
    expect(url).toContain('search=x');
    expect(url).toContain('sort=size%3Aasc');
  });
});
