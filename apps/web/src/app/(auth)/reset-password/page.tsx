'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/cn';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['bg-danger', 'bg-warning', 'bg-warning', 'bg-success', 'bg-success'];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < score ? colors[score] : 'bg-white/10',
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span
            key={c.label}
            className={cn(
              'text-xs transition-colors',
              c.pass ? 'text-success' : 'text-muted',
            )}
          >
            {c.pass ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');

  // Invalid/missing token state
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
          <ShieldAlert className="h-7 w-7 text-danger" />
        </div>
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Invalid link</h1>
          <p className="mt-2 text-sm text-muted">
            This password reset link is missing or malformed. Please request a new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Request new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Password updated</h1>
          <p className="mt-2 text-sm text-muted">
            Your password has been reset. You can now sign in with your new credentials.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: data.password,
      });
      setDone(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosError?.response?.status === 400) {
        setServerError(
          'This reset link has expired or already been used. Please request a new one.',
        );
      } else {
        setServerError(
          axiosError?.response?.data?.message ?? 'Something went wrong. Please try again.',
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-white">Set new password</h1>
        <p className="mt-1 text-sm text-muted">
          Choose a strong password for your admin account.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* New password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white/80">
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
        <PasswordStrength password={passwordValue} />
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            className={cn(
              'h-10 w-full rounded-lg border bg-black/40 px-3 pr-10 text-sm text-white placeholder:text-muted',
              'outline-none transition-colors',
              'focus:border-accent focus:ring-2 focus:ring-accent/20',
              errors.confirmPassword ? 'border-danger' : 'border-white/10',
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
        )}
      </div>

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
            Updating…
          </>
        ) : (
          'Update password'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
