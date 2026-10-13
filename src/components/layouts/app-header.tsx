'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';
import { useAuth } from '@/features/auth/hooks';
import { useIsMounted } from '@/hooks';
import { cn } from '@/utils';

const NAV_LINKS = [{ href: ROUTES.files, label: 'Files' }] as const;

export function AppHeader() {
  const { logout, isLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const pathname = usePathname() ?? '';

  const isDark = resolvedTheme === 'dark';

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <Link href={ROUTES.files} className="text-lg font-semibold">
        My App
      </Link>
      <nav className="flex items-center gap-4">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'text-sm transition-colors',
                isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          );
        })}
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
