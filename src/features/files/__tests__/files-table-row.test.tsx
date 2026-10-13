import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FilesTableRow } from '@/features/files/components/files-table-row';
import { makeFileUpload } from './factories';

const { mockUseDeleteFile, mockUseGetPresignedUrl } = vi.hoisted(() => ({
  mockUseDeleteFile: vi.fn(),
  mockUseGetPresignedUrl: vi.fn(),
}));

vi.mock('@/features/files/hooks', () => ({
  useDeleteFile: () => mockUseDeleteFile(),
  useGetPresignedUrl: () => mockUseGetPresignedUrl(),
}));

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
  mockUseGetPresignedUrl.mockReturnValue({
    reset: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({ data: { url: 'https://minio.test/report.pdf' } }),
    error: null,
    isPending: false,
  });
});

describe('FilesTableRow', () => {
  it('renders the file name, size, status, and action buttons', () => {
    renderRow();

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete report.pdf' })).toBeInTheDocument();
  });

  it('requests a presigned URL when downloading', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ data: { url: 'https://minio.test/report.pdf' } });
    mockUseGetPresignedUrl.mockReturnValue({ reset: vi.fn(), mutateAsync, error: null, isPending: false });

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
});
