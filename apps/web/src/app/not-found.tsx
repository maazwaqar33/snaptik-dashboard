import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <h1 className="font-outfit text-6xl font-bold text-white/20">404</h1>
      <p className="text-[#AAAAAA]">Page not found</p>
      <Link href="/dashboard" className="text-[#007AFF] hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
