export function Loader({ label = 'Generating your magazine...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-300 border-t-transparent" />
      <p className="text-sm text-white/80">{label}</p>
    </div>
  );
}

