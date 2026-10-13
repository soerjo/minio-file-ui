import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatBytes, formatDate, formatDuration, formatRemaining, makeId } from '@/features/files/utils';

describe('formatBytes', () => {
  it('formats zero as 0 B', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('returns an em dash for negative and non-finite values', () => {
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(Number.NaN)).toBe('—');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('keeps bytes below 1024 as whole bytes', () => {
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('converts at unit boundaries with one decimal place', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 ** 2)).toBe('1.0 MB');
    expect(formatBytes(1024 ** 3)).toBe('1.0 GB');
    expect(formatBytes(1024 ** 4)).toBe('1.0 TB');
  });

  it('caps the unit scaling at TB', () => {
    expect(formatBytes(1024 ** 5)).toBe('1024.0 TB');
  });
});

describe('formatDuration', () => {
  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('clamps negative and non-finite values to 0:00', () => {
    expect(formatDuration(-1000)).toBe('0:00');
    expect(formatDuration(Number.NaN)).toBe('0:00');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0:00');
  });

  it('keeps sub-minute durations zero-padded', () => {
    expect(formatDuration(500)).toBe('0:00');
    expect(formatDuration(45_000)).toBe('0:45');
    expect(formatDuration(59_999)).toBe('0:59');
  });

  it('formats whole minutes and mixed durations', () => {
    expect(formatDuration(60_000)).toBe('1:00');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(600_000)).toBe('10:00');
  });
});

describe('formatRemaining', () => {
  it('subtracts the current time from the expiry', () => {
    const now = Date.parse('2026-01-15T12:00:00.000Z');

    expect(formatRemaining('2026-01-15T12:01:00.000Z', now)).toBe('1:00');
    expect(formatRemaining('2026-01-15T12:00:45.000Z', now)).toBe('0:45');
  });

  it('returns 0:00 once expired', () => {
    const now = Date.parse('2026-01-15T12:00:00.000Z');

    expect(formatRemaining('2026-01-15T11:59:00.000Z', now)).toBe('0:00');
    expect(formatRemaining('2026-01-15T12:00:00.000Z', now)).toBe('0:00');
  });

  it('returns 0:00 for an unparseable expiry', () => {
    expect(formatRemaining('not-a-date', Date.parse('2026-01-15T12:00:00.000Z'))).toBe('0:00');
  });
});

describe('formatDate', () => {
  it('returns an em dash for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('formats a valid ISO date including the year', () => {
    const formatted = formatDate('2026-01-15T12:00:00.000Z');

    expect(formatted).not.toBe('—');
    expect(formatted).toMatch(/2026/);
  });
});

describe('makeId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an RFC 4122 v4 shaped id', () => {
    expect(makeId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('produces unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => makeId()));

    expect(ids.size).toBe(200);
  });

  it('falls back to a random id shape when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {});

    expect(makeId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
