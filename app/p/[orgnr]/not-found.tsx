export default function PublicSiteNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-md space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Demosiden er ikke tilgjengelig
        </h1>
        <p className="text-sm text-slate-600">
          Lenken har enten utløpt, eller demoen er ikke publisert ennå.
        </p>
      </div>
    </div>
  );
}
