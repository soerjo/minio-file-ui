export function AppFooter() {
  return (
    <footer className="flex items-center justify-center px-6 py-4 border-t border-border text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} My App
    </footer>
  );
}
