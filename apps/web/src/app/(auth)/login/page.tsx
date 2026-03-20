'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Wrapped in Suspense because useSearchParams requires it in Next.js 15
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      // Redirect to the originally requested page, or dashboard
      const from = searchParams.get('from');
      router.push(from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      setServerError(
        axiosError?.response?.data?.error ?? axiosError?.response?.data?.message ?? 'Invalid email or password. Please try again.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your admin account</p>
      </div>

      {/* Server error banner */}
      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white/80">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@snaptik.app"
          {...register('email')}
          className={cn(
            'h-10 w-full rounded-lg border bg-black/40 px-3 text-sm text-white placeholder:text-muted',
            'outline-none ring-offset-0 transition-colors',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
            errors.email ? 'border-danger' : 'border-white/10',
          )}
        />
        {errors.email && (
          <p className="text-xs text-danger">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-white/80">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-accent hover:text-accent/80 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            className={cn(
              'h-10 w-full rounded-lg border bg-black/40 px-3 pr-10 text-sm text-white placeholder:text-muted',
              'outline-none transition-colors',
              'focus:border-accent focus:ring-2 focus:ring-accent/20',
              errors.password ? 'border-danger' : 'border-white/10',
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-danger">{errors.password.message}</p>
        )}
      </div>

      {/* Remember me */}
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          {...register('rememberMe')}
          className="h-4 w-4 rounded border-white/20 bg-black/40 accent-accent"
        />
        <span className="text-sm text-white/70">Remember me for 7 days</span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'flex h-10 w-full items-center justify-center gap-2 rounded-lg',
          'bg-accent text-sm font-semibold text-white transition-opacity',
          'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
