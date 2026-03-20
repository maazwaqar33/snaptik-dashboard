interface LoadingSpinnerProps {
  size?:  'sm' | 'md' | 'lg';
  label?: string;
}

const SIZE = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' } as const;

export function LoadingSpinner({ size = 'md', label = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <div className={`${SIZE[size]} animate-spin rounded-full border-2 border-white/10 border-t-coral`} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
