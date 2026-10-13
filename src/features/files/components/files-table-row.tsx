'use client';

import { useState, type MouseEvent } from 'react';
import { Download, File, FileImage, FileSpreadsheet, FileText, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { useDeleteFile, useGetPresignedUrl } from '@/features/files/hooks';
import type { FileUpload } from '@/features/files/types';
import { formatBytes, formatDate } from '@/features/files/utils';

function openInNewTab(url: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

const FILE_ICON_CLASS_NAME = 'size-4 shrink-0 text-muted-foreground';

function renderFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <FileImage className={FILE_ICON_CLASS_NAME} aria-hidden="true" />;
  }
  if (mimeType === 'text/csv' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet className={FILE_ICON_CLASS_NAME} aria-hidden="true" />;
  }
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
    return <FileText className={FILE_ICON_CLASS_NAME} aria-hidden="true" />;
  }
  return <File className={FILE_ICON_CLASS_NAME} aria-hidden="true" />;
}

export function FilesTableRow({ file }: { file: FileUpload }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const presign = useGetPresignedUrl();
  const deleteFile = useDeleteFile();

  const handleDownload = async () => {
    presign.reset();
    const response = await presign.mutateAsync(file.id).catch(() => null);
    const url = response?.data?.url;

    if (url) {
      openInNewTab(url);
    }
  };

  const handleConfirmDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (deleteFile.isPending) return;
    deleteFile
      .mutateAsync(file.id)
      .then(() => setIsConfirmOpen(false))
      .catch(() => null);
  };

  const handleDialogChange = (open: boolean) => {
    setIsConfirmOpen(open);
    if (open) {
      deleteFile.reset();
    }
  };

  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="flex items-center gap-2">
          {renderFileIcon(file.mimeType)}
          <span className="truncate font-medium" title={file.originalName}>
            {file.originalName}
          </span>
        </div>
        {presign.error && (
          <p className="mt-1 truncate text-xs text-destructive" title={presign.error.message}>
            {presign.error.message}
          </p>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        <span className="block max-w-40 truncate" title={file.mimeType}>
          {file.mimeType}
        </span>
      </TableCell>
      <TableCell className="tabular-nums">{formatBytes(file.size)}</TableCell>
      <TableCell>
        <span
          className={
            file.status === 'ACTIVE'
              ? 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
              : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
          }
        >
          {file.status === 'ACTIVE' ? 'Active' : 'Deleted'}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(file.createdAt)}</TableCell>
      <TableCell className="pr-4">
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Download ${file.originalName}`}
            onClick={handleDownload}
            disabled={presign.isPending}
          >
            {presign.isPending ? <Loader2 className="animate-spin" /> : <Download />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${file.originalName}`}
            onClick={() => setIsConfirmOpen(true)}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </div>
        <AlertDialog open={isConfirmOpen} onOpenChange={handleDialogChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete file</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete “{file.originalName}”? The file will be removed from your list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteFile.error && <p className="text-sm text-destructive">{deleteFile.error.message}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteFile.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleConfirmDelete} disabled={deleteFile.isPending}>
                {deleteFile.isPending ? <Loader2 className="animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
