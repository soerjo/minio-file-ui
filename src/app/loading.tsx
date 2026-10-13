import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background py-24">
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  );
}
