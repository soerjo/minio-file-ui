import { jwtDecode } from "jwt-decode";

export interface TokenPayload {
  exp: number;
  iat: number;
  sub?: string;
  [key: string]: unknown;
}

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = "accessToken";
  private static readonly REFRESH_TOKEN_KEY = "refreshToken";
  private static readonly EXPIRATION_BUFFER = 60 * 1000; // 1 minute buffer

  static getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static removeAccessToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static removeRefreshToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
  }

  static parseToken(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const payload = this.parseToken(token);
    if (!payload) return true;

    const now = Date.now();
    const expirationTime = payload.exp * 1000;
    return expirationTime - now < this.EXPIRATION_BUFFER;
  }

  static isAccessTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  static getTokenExpirationTime(token: string): number | null {
    const payload = this.parseToken(token);
    return payload?.exp ? payload.exp * 1000 : null;
  }

  static getTimeUntilExpiration(token: string): number {
    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) return 0;
    return Math.max(0, expirationTime - Date.now() - this.EXPIRATION_BUFFER);
  }
}
