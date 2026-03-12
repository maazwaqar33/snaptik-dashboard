import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#121212] p-8">
        <h1 className="font-outfit text-2xl font-bold text-white">SnapTik Admin</h1>
        <p className="mt-2 text-[#AAAAAA]">Login page — coming in Task 4</p>
      </div>
    </div>
  );
}
