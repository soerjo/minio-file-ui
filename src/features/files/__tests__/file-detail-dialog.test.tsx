import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FileDetailDialog } from '@/features/files/components/file-detail-dialog';
import { makeFileUpload } from './factories';

const { mockUseGetFile, mockUseGetPresignedUrl } = vi.hoisted(() => ({
  mockUseGetFile: vi.fn(),
  mockUseGetPresignedUrl: vi.fn(),
}));

vi.mock('@/features/files/hooks', () => ({
  useGetFile: (id: string | undefined) => mockUseGetFile(id),
  useGetPresignedUrl: () => mockUseGetPresignedUrl(),
}));

function fileResult(overrides: Record<string, unknown> = {}) {
  return {
    data: { success: true, data: makeFileUpload() },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

function presignResult(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    data: { data: { url: 'https://minio.test/preview' } },
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

function renderDialog(file = makeFileUpload()) {
  const onOpenChange = vi.fn();
  const result = render(<FileDetailDialog file={file} open onOpenChange={onOpenChange} />);
  return { ...result, onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseGetFile.mockReturnValue(fileResult());
  mockUseGetPresignedUrl.mockReturnValue(presignResult());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FileDetailDialog', () => {
  it('renders the metadata of the fetched file', () => {
    const file = makeFileUpload({
      id: 'file-42',
      originalName: 'notes.txt',
      mimeType: 'text/plain',
      size: 2048,
      checksum: 'checksum-42',
      uploadedBy: 'user-7',
      bucket: 'my-bucket',
      objectKey: 'objects/notes.txt',
    });
    mockUseGetFile.mockReturnValue({ ...fileResult(), data: { success: true, data: file } });

    renderDialog(file);

    expect(mockUseGetFile).toHaveBeenCalledWith('file-42');
    expect(screen.getByText('checksum-42')).toBeInTheDocument();
    expect(screen.getByText('user-7')).toBeInTheDocument();
    expect(screen.getByText('my-bucket')).toBeInTheDocument();
    expect(screen.getByText('objects/notes.txt')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('shows a loading state while the details are pending', () => {
    mockUseGetFile.mockReturnValue(fileResult({ isPending: true, data: undefined }));

    renderDialog();

    expect(screen.getByText('Loading file details')).toBeInTheDocument();
  });

  it('shows the error message and retries via refetch', async () => {
    const refetch = vi.fn();
    mockUseGetFile.mockReturnValue(fileResult({ isError: true, error: new Error('Boom'), refetch }));

    renderDialog();

    expect(screen.getByText('Boom')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to a download action for unsupported file types', () => {
    mockUseGetFile.mockReturnValue({
      ...fileResult(),
      data: { success: true, data: makeFileUpload({ mimeType: 'application/zip' }) },
    });

    renderDialog(makeFileUpload({ mimeType: 'application/zip' }));

    expect(screen.getByText('Preview not available')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('renders an inline image preview for images', () => {
    mockUseGetFile.mockReturnValue({
      ...fileResult(),
      data: { success: true, data: makeFileUpload({ originalName: 'photo.png', mimeType: 'image/png' }) },
    });

    renderDialog(makeFileUpload({ originalName: 'photo.png', mimeType: 'image/png' }));

    expect(screen.getByRole('img', { name: 'photo.png' })).toBeInTheDocument();
  });

  it('renders a text preview for text files', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('hello world') }));
    mockUseGetFile.mockReturnValue({
      ...fileResult(),
      data: { success: true, data: makeFileUpload({ originalName: 'notes.txt', mimeType: 'text/plain' }) },
    });

    renderDialog(makeFileUpload({ originalName: 'notes.txt', mimeType: 'text/plain' }));

    expect(await screen.findByText('hello world')).toBeInTheDocument();
  });
});
