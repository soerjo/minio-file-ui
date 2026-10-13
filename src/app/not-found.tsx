import { AppLink } from '@/components/ui';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/utils';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <AppLink href="/" className={cn(buttonVariants())}>
        Back to home
      </AppLink>
    </div>
  );
}
