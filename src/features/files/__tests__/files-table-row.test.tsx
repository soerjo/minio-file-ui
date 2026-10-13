import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FilesTableRow } from '@/features/files/components/files-table-row';
import { makeFileUpload } from './factories';

const { mockUseDeleteFile, mockUseGetPresignedUrl, mockUseGetFile } = vi.hoisted(() => ({
  mockUseDeleteFile: vi.fn(),
  mockUseGetPresignedUrl: vi.fn(),
  mockUseGetFile: vi.fn(),
}));

vi.mock('@/features/files/hooks', () => ({
  useDeleteFile: () => mockUseDeleteFile(),
  useGetPresignedUrl: () => mockUseGetPresignedUrl(),
  useGetFile: (id: string | undefined) => mockUseGetFile(id),
}));

function presignResult(overrides: Record<string, unknown> = {}) {
  return {
    reset: vi.fn(),
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({ data: { url: 'https://minio.test/report.pdf' } }),
    data: { data: { url: 'https://minio.test/report.pdf' } },
    error: null,
    isPending: false,
    isError: false,
    ...overrides,
  };
}

function renderRow(file = makeFileUpload({ originalName: 'report.pdf', mimeType: 'application/pdf', size: 2048 })) {
  return render(
    <table>
      <tbody>
        <FilesTableRow file={file} />
      </tbody>
    </table>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseDeleteFile.mockReturnValue({
    reset: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    error: null,
    isPending: false,
  });
  mockUseGetPresignedUrl.mockReturnValue(presignResult());
  mockUseGetFile.mockReturnValue({
    data: { success: true, data: makeFileUpload({ originalName: 'report.pdf', mimeType: 'application/pdf' }) },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('FilesTableRow', () => {
  it('renders the file name, size, status, and action buttons', () => {
    renderRow();

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View details for report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete report.pdf' })).toBeInTheDocument();
  });

  it('requests a presigned URL when downloading', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ data: { url: 'https://minio.test/report.pdf' } });
    mockUseGetPresignedUrl.mockReturnValue(presignResult({ mutateAsync }));

    renderRow();

    await userEvent.click(screen.getByRole('button', { name: 'Download report.pdf' }));

    expect(mutateAsync).toHaveBeenCalledWith('file-1');
  });

  it('opens the confirm dialog and deletes on confirm', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseDeleteFile.mockReturnValue({ reset: vi.fn(), mutateAsync, error: null, isPending: false });

    renderRow();

    await userEvent.click(screen.getByRole('button', { name: 'Delete report.pdf' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Delete file')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(mutateAsync).toHaveBeenCalledWith('file-1');
  });

  it('opens the detail dialog from the view action using the row file id', async () => {
    renderRow();

    await userEvent.click(screen.getByRole('button', { name: 'View details for report.pdf' }));

    const dialog = await screen.findByRole('dialog');
    expect(mockUseGetFile).toHaveBeenCalledWith('file-1');
    expect(within(dialog).getByText('checksum-file-1')).toBeInTheDocument();
  });
});
