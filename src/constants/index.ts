export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'My App';

export const ROUTES = {
  files: '/files',
  login: '/login',
  register: '/register',
} as const;

export const API_ROUTES = {
  health: '/health',
  login: '/auth/login',
  logout: '/auth/logout',
  refreshToken: '/auth/refresh-token',
  verifyToken: '/auth/verify-token',
  me: '/auth/me',
  register: '/auth/register',
  files: {
    upload: '/files/upload',
    list: '/files',
  },
} as const;

export const fileRoutes = {
  detail: (id: string) => `/files/${id}`,
  url: (id: string) => `/files/${id}/url`,
} as const;
