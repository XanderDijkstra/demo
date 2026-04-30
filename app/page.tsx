import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
          V
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Vekst-Systemet</h1>
          <p className="text-muted-foreground">
            Internt verktøy for FX Media — automatisert salgsprospektering mot norske selskaper.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Logg inn
        </Link>
      </div>
    </main>
  );
}
