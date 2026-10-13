export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "My App";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const;

export const API_ROUTES = {
  health: "/api/health",
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  refreshToken: "/api/auth/refresh-token",
  verifyToken: "/api/auth/verify-token",
  me: "/api/auth/me",
  forgotPassword: "/api/auth/forgot-password",
  resetPassword: "/api/auth/reset-password",
  register: "/api/auth/register",
} as const;
