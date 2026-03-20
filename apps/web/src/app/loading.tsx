import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <LoadingSpinner size="md" />
    </div>
  );
}
