import { TokenManager } from '@/features/auth/services/token-manager';
import type { LoginResponse } from '@/features/auth/types';
import type { ApiResponse } from '@/types';
import { API_ROUTES } from '@/constants';

type RequestOptions = {
  body?: string | FormData;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

type ParsedErrorBody = {
  message: string;
  code?: string;
  details?: string[];
};

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api') {
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private getAuthHeaders(skipAuth: boolean = false): Record<string, string> {
    if (skipAuth) return {};

    const token = TokenManager.getAccessToken();
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  private async parseResponse<T>(response: Response): Promise<T | undefined> {
    if (response.status === 204) {
      return undefined;
    }

    if (response.headers.get('content-length') === '0') {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      await response.text().catch(() => '');
      return undefined;
    }

    const text = await response.text().catch(() => '');
    if (!text) {
      return undefined;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return undefined;
    }
  }

  private async parseErrorBody(response: Response): Promise<ParsedErrorBody> {
    const text = await response.text().catch(() => '');

    if (!text) {
      return { message: response.statusText || `Request failed with status ${response.status}` };
    }

    try {
      const body = JSON.parse(text) as { message?: unknown; error?: unknown };

      if (typeof body.error === 'object' && body.error !== null) {
        const error = body.error as { code?: unknown; message?: unknown; details?: unknown };
        const code = typeof error.code === 'string' && error.code ? error.code : undefined;
        const details = Array.isArray(error.details)
          ? error.details.filter((detail): detail is string => typeof detail === 'string')
          : undefined;

        return {
          message: typeof error.message === 'string' && error.message ? error.message : (code ?? text),
          code,
          details,
        };
      }

      const message = body.message ?? body.error;
      if (typeof message === 'string' && message) {
        return { message };
      }
    } catch {
      return { message: text };
    }

    return { message: text };
  }

  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      TokenManager.clearTokens();
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${API_ROUTES.refreshToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        TokenManager.clearTokens();
        return null;
      }

      const data = await this.parseResponse<ApiResponse<LoginResponse>>(response);
      if (data?.data?.accessToken) {
        TokenManager.setAccessToken(data.data.accessToken);
        if (data.data.refreshToken) {
          TokenManager.setRefreshToken(data.data.refreshToken);
        }
        return data.data.accessToken;
      }

      return null;
    } catch {
      TokenManager.clearTokens();
      return null;
    }
  }

  async request<T>(endpoint: string, options: RequestInit & RequestOptions = {}): Promise<T> {
    const { body, headers: customHeaders, skipAuth = false, ...rest } = options;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...rest,
      headers: {
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...this.getAuthHeaders(skipAuth),
        ...customHeaders,
      },
      body,
    });

    if (response.ok) {
      const data = await this.parseResponse<T>(response);
      return data as T;
    }

    if (response.status === 401 && !skipAuth) {
      const refreshToken = TokenManager.getRefreshToken();

      if (!refreshToken) {
        TokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        const errorBody = await this.parseErrorBody(response);
        throw new ApiError(response.status, errorBody.message, errorBody.code, errorBody.details);
      }

      if (this.isRefreshing) {
        return new Promise((resolve, reject) => {
          this.subscribeTokenRefresh(() => {
            this.request<T>(endpoint, options).then(resolve).catch(reject);
          });
        });
      }

      this.isRefreshing = true;

      try {
        const newToken = await this.refreshAccessToken();

        if (newToken) {
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);
          return this.request<T>(endpoint, options);
        } else {
          this.isRefreshing = false;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
          throw new ApiError(response.status, 'Failed to refresh token');
        }
      } catch (error) {
        this.isRefreshing = false;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        throw error;
      }
    }

    const errorBody = await this.parseErrorBody(response);
    throw new ApiError(response.status, errorBody.message, errorBody.code, errorBody.details);
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    const body = data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export class ApiError extends Error {
  code?: string;
  details?: string[];

  constructor(
    public status: number,
    message: string,
    code?: string,
    details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export const apiClient = new ApiClient();
