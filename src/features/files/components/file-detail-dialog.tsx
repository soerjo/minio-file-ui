'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCountdown } from '@/hooks';
import { useGetFile, useGetPresignedUrl } from '@/features/files/hooks';
import type { FileUpload } from '@/features/files/types';
import { formatBytes, formatDate, openInNewTab } from '@/features/files/utils';
import { CopyLinkButton } from './copy-link-button';

type PreviewKind = 'image' | 'pdf' | 'text' | 'none';

function getPreviewKind(mimeType: string): PreviewKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/')) return 'text';
  return 'none';
}

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load preview (${response.status}).`);
        return response.text();
      })
      .then((value) => setText(value))
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : 'Failed to load preview.');
      });

    return () => controller.abort();
  }, [url]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (text === null) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-muted/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading preview</span>
      </div>
    );
  }

  return (
    <pre className="max-h-[50vh] overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-xs whitespace-pre-wrap">
      {text}
    </pre>
  );
}

type PreviewStatus = 'loading' | 'loaded' | 'error';

function ImagePreview({ url, alt }: { url: string; alt: string }) {
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <p>Failed to load image preview.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setStatus('loading');
            setAttempt((value) => value + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-[50vh] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={attempt}
        src={url}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className="max-h-full w-auto object-contain"
      />
      {status === 'loading' && (
        <div
          data-testid="image-preview-skeleton"
          aria-hidden="true"
          className="absolute inset-0 animate-pulse rounded-lg bg-muted"
        />
      )}
    </div>
  );
}

function PdfPreview({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-[50vh] w-full overflow-hidden rounded-lg border border-border bg-muted/30">
      <iframe src={url} title={title} onLoad={() => setLoaded(true)} className="h-full w-full" />
      {!loaded && (
        <div
          data-testid="pdf-preview-skeleton"
          aria-hidden="true"
          className="absolute inset-0 animate-pulse rounded-lg bg-muted"
        />
      )}
    </div>
  );
}

function FilePreview({ file }: { file: FileUpload }) {
  const { mutate: fetchUrl, data, isPending, isError, error } = useGetPresignedUrl();
  const { isExpired } = useCountdown(data?.data?.expiresAt ?? null);

  useEffect(() => {
    fetchUrl(file.id);
  }, [fetchUrl, file.id]);

  const url = data?.data?.url;
  const kind = getPreviewKind(file.mimeType);

  if (isPending || (!url && !isError)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-muted/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading preview</span>
      </div>
    );
  }

  if (isError || !url) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <p>{error instanceof Error && error.message ? error.message : 'Failed to load preview.'}</p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => fetchUrl(file.id)}>
          Try again
        </Button>
      </div>
    );
  }

  let preview: ReactNode;

  if (kind === 'image') {
    preview = <ImagePreview url={url} alt={file.originalName} />;
  } else if (kind === 'pdf') {
    preview = <PdfPreview url={url} title={`Preview of ${file.originalName}`} />;
  } else if (kind === 'text') {
    preview = <TextPreview key={url} url={url} />;
  } else {
    preview = (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <div>
          <p className="text-sm font-medium">Preview not available</p>
          <p className="mt-1 text-xs text-muted-foreground">This file type can&apos;t be previewed.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => openInNewTab(url)} disabled={isExpired}>
          <Download />
          Download
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {preview}
      <div className="flex justify-end">
        <CopyLinkButton
          url={url}
          expiresAt={data?.data?.expiresAt}
          onRefresh={() => fetchUrl(file.id)}
          isRefreshing={isPending}
        />
      </div>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm" title={value}>
        {value}
      </dd>
    </div>
  );
}

function MetadataList({ file }: { file: FileUpload }) {
  const items = [
    { label: 'Name', value: file.originalName },
    { label: 'Type', value: file.mimeType },
    { label: 'Size', value: formatBytes(file.size) },
    { label: 'Status', value: file.status === 'ACTIVE' ? 'Active' : 'Deleted' },
    { label: 'Uploaded by', value: file.uploadedBy },
    { label: 'Created', value: formatDate(file.createdAt) },
    { label: 'Updated', value: formatDate(file.updatedAt) },
    { label: 'Checksum', value: file.checksum },
    { label: 'Bucket', value: file.bucket },
    { label: 'Object key', value: file.objectKey },
  ];

  return (
    <dl className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
      {items.map((item) => (
        <MetadataItem key={item.label} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}

export interface FileDetailDialogProps {
  file: FileUpload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileDetailDialog({ file, open, onOpenChange }: FileDetailDialogProps) {
  const { data, isPending, isError, error, refetch } = useGetFile(open ? file?.id : undefined);
  const detail = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{file?.originalName ?? 'File details'}</DialogTitle>
          <DialogDescription>File details and preview.</DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Loading file details</span>
          </div>
        ) : isError || !detail ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{error instanceof Error && error.message ? error.message : 'Failed to load file details.'}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <FilePreview file={detail} />
            <MetadataList file={detail} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
