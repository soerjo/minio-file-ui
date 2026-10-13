'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/utils';
import { useFilesList } from '@/features/files/hooks';
import type { FilesSort } from '@/features/files/types';
import { FilesTableRow } from './files-table-row';

const PAGE_SIZE = 20;

const SORT_OPTIONS: ReadonlyArray<{ value: FilesSort; label: string }> = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'originalName:asc', label: 'Name A to Z' },
  { value: 'originalName:desc', label: 'Name Z to A' },
  { value: 'size:desc', label: 'Largest first' },
  { value: 'size:asc', label: 'Smallest first' },
];

export function FilesTable() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<FilesSort>('createdAt:desc');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isPending, isError, error, isPlaceholderData, refetch } = useFilesList({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    sort,
  });

  const response = data?.data;
  const files = response?.items ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4" aria-label="Files">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name"
            aria-label="Search files"
            className="pl-8"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as FilesSort);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40" aria-label="Sort files">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-2" aria-label="Loading files">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error instanceof Error && error.message ? error.message : 'Failed to load files.'}</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm font-medium">{search ? 'No files match your search.' : 'No files yet.'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search ? 'Try a different search term.' : 'Upload your first file using the area above.'}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-lg border border-border transition-opacity',
            isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-2/5 pl-4">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <FilesTableRow key={file.id} file={file} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {isPending ? 'Loading…' : `${total} ${total === 1 ? 'file' : 'files'}`}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending || isPlaceholderData}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending || isPlaceholderData}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
