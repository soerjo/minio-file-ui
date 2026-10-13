export function HomeHero() {
  return (
    <section className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-background sm:items-start">
      <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-foreground">Welcome to My App</h1>
      <p className="max-w-md text-lg leading-8 text-muted-foreground">
        Built with Next.js 16, React 19, shadcn/ui, and TanStack Query.
      </p>
    </section>
  );
}
