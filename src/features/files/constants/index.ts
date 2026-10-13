import type { FilesSort } from '@/features/files/types';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const PAGE_SIZE = 20;

export const DEFAULT_SORT: FilesSort = 'createdAt:desc';

export const SORT_OPTIONS: ReadonlyArray<{ value: FilesSort; label: string }> = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'originalName:asc', label: 'Name A to Z' },
  { value: 'originalName:desc', label: 'Name Z to A' },
  { value: 'size:desc', label: 'Largest first' },
  { value: 'size:asc', label: 'Smallest first' },
];

export const ALLOWED_MIME_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
];
