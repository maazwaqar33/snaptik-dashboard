import { AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
  message:  string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-danger">
      <AlertTriangle className="h-8 w-8" />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-lg border border-danger/30 px-4 py-1.5 text-xs hover:bg-danger/10 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
