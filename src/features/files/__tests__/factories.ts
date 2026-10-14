import type { FileUpload, FilesListResponse } from '@/features/files/types';

export function makeFileUpload(overrides: Partial<FileUpload> = {}): FileUpload {
  return {
    id: 'file-1',
    bucket: 'uploads',
    objectKey: 'uploads/file-1.png',
    originalName: 'photo.png',
    mimeType: 'image/png',
    size: 1024,
    checksum: 'checksum-file-1',
    status: 'ACTIVE',
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    uploadedBy: 'user-1',
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
    ...overrides,
  };
}

export function makeFilesListResponse(overrides: Partial<FilesListResponse> = {}): FilesListResponse {
  return {
    items: [makeFileUpload()],
    total: 1,
    page: 1,
    limit: 20,
    ...overrides,
  };
}
