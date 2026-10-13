'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCountdown } from '@/hooks';
import { formatDuration } from '@/features/files/utils';

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  if (typeof document === 'undefined') return false;

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

export interface CopyLinkButtonProps {
  url: string;
  expiresAt?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  disabled?: boolean;
}

export function CopyLinkButton({
  url,
  expiresAt,
  onRefresh,
  isRefreshing = false,
  disabled = false,
}: CopyLinkButtonProps) {
  const { remainingMs, isExpired } = useCountdown(expiresAt ?? null);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    const didCopy = await copyText(url);
    if (!didCopy) return;

    setCopied(true);
    if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const hasExpiry = Boolean(expiresAt && Number.isFinite(new Date(expiresAt).getTime()));

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={isExpired ? 'Copy link (expired)' : 'Copy link'}
        title={isExpired ? 'Link expired' : 'Copy link'}
        onClick={handleCopy}
        disabled={disabled || isExpired}
      >
        {copied ? <Check className="text-primary" /> : <Copy />}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
      {hasExpiry && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {isExpired ? 'Link expired' : `expires in ${formatDuration(remainingMs)}`}
        </span>
      )}
      {isExpired && onRefresh && (
        <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="animate-spin" /> : <RotateCw />}
          Get a new link
        </Button>
      )}
    </div>
  );
}
