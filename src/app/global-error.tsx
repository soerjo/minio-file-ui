'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

import './globals.css';

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 py-24 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {error.message || 'A critical error occurred. Please try again.'}
          </p>
          <Button onClick={() => retry()}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
