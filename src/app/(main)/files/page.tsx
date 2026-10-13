'use client';

import { FilesTable, UploadDropzone } from '@/features/files/components';

export default function FilesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload, browse, download, and manage your files.</p>
      </div>
      <div className="space-y-8">
        <UploadDropzone />
        <FilesTable />
      </div>
    </div>
  );
}
