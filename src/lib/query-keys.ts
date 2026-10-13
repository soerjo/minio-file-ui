export const queryKeys = {
  home: {
    all: ['home'] as const,
  },
  auth: {
    all: ['auth'] as const,
    verify: ['auth', 'verify'] as const,
    logout: ['auth', 'logout'] as const,
  },
} as const;
