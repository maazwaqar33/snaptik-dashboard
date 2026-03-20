'use client';

import { ErrorBanner } from '@/components/ui/error-banner';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <ErrorBanner message={error.message || 'Something went wrong'} onRetry={reset} />
    </div>
  );
}
