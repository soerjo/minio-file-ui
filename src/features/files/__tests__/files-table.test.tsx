import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FilesTable } from '@/features/files/components/files-table';
import { makeFileUpload, makeFilesListResponse } from './factories';

const { mockUseFilesList, mockUseDeleteFile, mockUseGetPresignedUrl } = vi.hoisted(() => ({
  mockUseFilesList: vi.fn(),
  mockUseDeleteFile: vi.fn(),
  mockUseGetPresignedUrl: vi.fn(),
}));

vi.mock('@/features/files/hooks', () => ({
  useFilesList: () => mockUseFilesList(),
  useDeleteFile: () => mockUseDeleteFile(),
  useGetPresignedUrl: () => mockUseGetPresignedUrl(),
}));

type ListResult = {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isPlaceholderData: boolean;
  refetch: ReturnType<typeof vi.fn>;
};

function listResult(overrides: Partial<ListResult> = {}): ListResult {
  return {
    data: { success: true, data: makeFilesListResponse() },
    isPending: false,
    isError: false,
    error: null,
    isPlaceholderData: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseFilesList.mockReturnValue(listResult());
  mockUseDeleteFile.mockReturnValue({
    reset: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    error: null,
    isPending: false,
  });
  mockUseGetPresignedUrl.mockReturnValue({
    reset: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({ data: { url: 'https://minio.test/file' } }),
    error: null,
    isPending: false,
  });
});

describe('FilesTable', () => {
  it('renders a loading skeleton while pending', () => {
    mockUseFilesList.mockReturnValue(listResult({ isPending: true, data: undefined }));

    render(<FilesTable />);

    expect(screen.getByLabelText('Loading files')).toBeInTheDocument();
  });

  it('renders an error message with a working retry button', async () => {
    const refetch = vi.fn();
    mockUseFilesList.mockReturnValue(listResult({ isError: true, error: new Error('Boom'), refetch }));

    render(<FilesTable />);

    expect(screen.getByText('Boom')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the default empty state when there are no files', () => {
    mockUseFilesList.mockReturnValue(
      listResult({ data: { success: true, data: makeFilesListResponse({ items: [], total: 0 }) } }),
    );

    render(<FilesTable />);

    expect(screen.getByText('No files yet.')).toBeInTheDocument();
  });

  it('renders the search-specific empty state after typing a search term', async () => {
    mockUseFilesList.mockReturnValue(
      listResult({ data: { success: true, data: makeFilesListResponse({ items: [], total: 0 }) } }),
    );

    render(<FilesTable />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search files' }), 'nope');

    await waitFor(() => expect(screen.getByText('No files match your search.')).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it('renders a row per file', () => {
    const items = [
      makeFileUpload({ id: 'a', originalName: 'alpha.png' }),
      makeFileUpload({ id: 'b', originalName: 'beta.pdf', mimeType: 'application/pdf' }),
    ];
    mockUseFilesList.mockReturnValue(
      listResult({ data: { success: true, data: makeFilesListResponse({ items, total: items.length }) } }),
    );

    render(<FilesTable />);

    expect(screen.getByText('alpha.png')).toBeInTheDocument();
    expect(screen.getByText('beta.pdf')).toBeInTheDocument();
  });

  it('disables pagination when there is a single page', () => {
    render(<FilesTable />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('paginates and toggles button disabled states', async () => {
    mockUseFilesList.mockReturnValue(
      listResult({ data: { success: true, data: makeFilesListResponse({ total: 25 }) } }),
    );

    render(<FilesTable />);

    const previous = screen.getByRole('button', { name: 'Previous' });
    const next = screen.getByRole('button', { name: 'Next' });

    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    await userEvent.click(next);

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(previous).toBeEnabled();
    expect(next).toBeDisabled();
  });
});
