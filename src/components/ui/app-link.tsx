"use client";

import Link from "next/link";
import { cn } from "@/utils";
import type { ReactNode } from "react";

type AppLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  isExternal?: boolean;
};

export function AppLink({
  href,
  children,
  className,
  isExternal = false,
}: AppLinkProps) {
  if (isExternal) {
    return (
      <a
        href={href}
        className={cn("transition-colors", className)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cn("transition-colors", className)}>
      {children}
    </Link>
  );
}
