import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('My App'),
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  API_PROXY_TARGET: z.url().optional(),
});

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_PROXY_TARGET: process.env.API_PROXY_TARGET,
});

if (!parsedEnv.success && typeof window === 'undefined') {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsedEnv.error)}`);
}

const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});

export const appConfig = {
  appName: env.NEXT_PUBLIC_APP_NAME,
  appUrl: env.NEXT_PUBLIC_APP_URL,
  apiUrl: env.NEXT_PUBLIC_API_URL ?? '',
  apiProxyTarget: env.API_PROXY_TARGET,
  isDev: process.env.NODE_ENV === 'development',
} as const;

export type AppConfig = typeof appConfig;
