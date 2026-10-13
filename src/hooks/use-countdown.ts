'use client';

import { useSyncExternalStore } from 'react';

const TICK_MS = 1000;

let now = Date.now();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (intervalId === undefined) {
    now = Date.now();
    intervalId = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };
}

function getSnapshot(): number {
  return now;
}

function getServerSnapshot(): number {
  return 0;
}

export interface Countdown {
  remainingMs: number;
  isExpired: boolean;
}

/**
 * Ticks once per second while mounted and reports how long is left until
 * `expiresAt`. A missing or unparseable date is treated as "no expiry"
 * (never expired). SSR-safe via a constant server snapshot.
 */
export function useCountdown(expiresAt?: string | null): Countdown {
  const currentTime = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const expiresAtMs = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  const hasExpiry = Number.isFinite(expiresAtMs);

  if (!hasExpiry) {
    return { remainingMs: 0, isExpired: false };
  }

  const remainingMs = Math.max(0, expiresAtMs - currentTime);

  return { remainingMs, isExpired: remainingMs === 0 };
}
