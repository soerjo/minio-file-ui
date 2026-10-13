export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'My App';

export const ROUTES = {
  home: '/',
  files: '/files',
  login: '/login',
  register: '/register',
} as const;

export const API_ROUTES = {
  health: '/api/health',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  refreshToken: '/api/auth/refresh-token',
  verifyToken: '/api/auth/verify-token',
  me: '/api/auth/me',
  register: '/api/auth/register',
  files: {
    upload: '/api/files/upload',
    list: '/api/files',
  },
} as const;

export const fileRoutes = {
  detail: (id: string) => `/api/files/${id}`,
  url: (id: string) => `/api/files/${id}/url`,
} as const;
