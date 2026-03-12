'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <h1 className="font-outfit text-2xl font-bold">Something went wrong</h1>
      <p className="text-[#AAAAAA]">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-[#007AFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#007AFF]/90"
      >
        Try again
      </button>
    </div>
  );
}
