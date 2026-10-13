'use client';

import { useCallback, useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils';
import { useUploadFile } from '@/features/files/hooks';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/features/files/constants';
import { formatBytes, makeId } from '@/features/files/utils';

const ACCEPT_ATTR = ALLOWED_MIME_TYPES.join(',');

type UploadQueueItem = {
  id: string;
  file: File;
};

function UploadQueueRow({ item, onRemove }: { item: UploadQueueItem; onRemove: (id: string) => void }) {
  const { mutate, isPending, progress, error, cancel } = useUploadFile();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    mutate(item.file, { onSuccess: () => onRemove(item.id) });
  }, [item.file, item.id, mutate, onRemove]);

  const handleCancel = () => {
    cancel();
    onRemove(item.id);
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium" title={item.file.name}>
            {item.file.name}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(item.file.size)}</span>
        </div>
        {isPending ? (
          <div className="mt-2 flex items-center gap-2">
            <Progress value={progress} className="h-1.5 flex-1" aria-label={`Upload progress for ${item.file.name}`} />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{progress}%</span>
          </div>
        ) : error ? (
          <p className="mt-1 text-xs text-destructive" title={error.message}>
            {error.message}
          </p>
        ) : null}
      </div>
      {isPending ? (
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Dismiss ${item.file.name}`}
          onClick={() => onRemove(item.id)}
        >
          <X />
        </Button>
      )}
    </li>
  );
}

export function UploadDropzone() {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const addFiles = useCallback((files: FileList | File[]) => {
    const items = Array.from(files, (file) => ({ id: makeId(), file }));
    if (items.length > 0) {
      setQueue((previous) => [...previous, ...items]);
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setQueue((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (event.dataTransfer?.files?.length) {
      addFiles(event.dataTransfer.files);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <section className="space-y-3" aria-label="Upload files">
      <div
        role="button"
        tabIndex={0}
        aria-label="Add files to upload"
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background hover:border-foreground/30 hover:bg-muted/50',
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Drag & drop files here, or click to browse</p>
        <p className="text-xs text-muted-foreground">
          Images, PDF, Office documents, or text files — up to {formatBytes(MAX_FILE_SIZE_BYTES, 0)} each
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            addFiles(event.target.files);
          }
          event.target.value = '';
        }}
      />
      {queue.length > 0 && (
        <ul className="space-y-2">
          {queue.map((item) => (
            <UploadQueueRow key={item.id} item={item} onRemove={removeItem} />
          ))}
        </ul>
      )}
    </section>
  );
}
