import type { FilesListParams } from '@/features/files/types';

export const queryKeys = {
  home: {
    all: ['home'] as const,
  },
  auth: {
    all: ['auth'] as const,
    verify: ['auth', 'verify'] as const,
    logout: ['auth', 'logout'] as const,
  },
  files: {
    all: ['files'] as const,
    list: (filters: FilesListParams = {}) => ['files', 'list', filters] as const,
    detail: (id: string) => ['files', 'detail', id] as const,
  },
} as const;
