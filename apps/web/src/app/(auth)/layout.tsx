import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { template: '%s | SnapTik Admin', default: 'SnapTik Admin' },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-4">
      {/* Subtle radial glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl"
      />
      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="SnapTik logo"
            >
              <path
                d="M20 6H12C9.79 6 8 7.79 8 10v8c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-8c0-2.21-1.79-4-4-4z"
                fill="white"
                opacity="0.9"
              />
              <path d="M11 14l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-outfit text-lg font-semibold tracking-wide text-white">
            SnapTik Admin
          </span>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} SnapTik. Internal use only.
        </p>
      </div>
    </div>
  );
}
