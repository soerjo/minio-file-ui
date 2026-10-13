'use client';

import Link from 'next/link';
import { Loader2, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { useIsMounted } from '@/hooks';

export function AppHeader() {
  const { logout, isLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();

  const isDark = resolvedTheme === 'dark';

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <Link href="/" className="text-lg font-semibold">
        My App
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          disabled={!mounted}
          aria-label="Toggle theme"
        >
          {mounted && isDark ? <Moon /> : <Sun />}
        </Button>
        <Button size="sm" variant="ghost" onClick={logout} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : 'Logout'}
        </Button>
      </nav>
    </header>
  );
}
