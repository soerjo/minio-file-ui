import type { FileUpload } from '@/features/files/types';

export interface StatusBadge {
  label: string;
  className: string;
}

export function getStatusBadge(file: Pick<FileUpload, 'status' | 'isDeleted'>): StatusBadge {
  if (file.isDeleted) {
    return { label: 'Deleted', className: 'bg-destructive/10 text-destructive' };
  }
  if (file.status === 'ORPHAN') {
    return { label: 'Orphan', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
  }
  return { label: 'Active', className: 'bg-primary/10 text-primary' };
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${units[exponent]}`;
}

export function openInNewTab(url: string): void {
  if (typeof document === 'undefined') return;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatRemaining(expiresAt: string, now: number = Date.now()): string {
  const expiresAtMs = new Date(expiresAt).getTime();

  if (Number.isNaN(expiresAtMs)) return '0:00';

  return formatDuration(expiresAtMs - now);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export { makeId } from './uuid';
