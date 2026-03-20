'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/cn';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { AdminUser } from '@snaptik/types';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(64, 'Name is too long'),
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

function RegisterInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setAdmin } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Missing or malformed invite token
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
          <ShieldAlert className="h-7 w-7 text-danger" />
        </div>
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Invite link invalid</h1>
          <p className="mt-2 text-sm text-muted">
            This invite link is missing or malformed. Contact your super admin for a new invite.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const { data: res } = await apiClient.post<{ accessToken: string; admin: AdminUser }>(
        '/auth/register-invite',
        { token, name: data.name, password: data.password },
      );
      // Immediately authenticate — the admin is live
      setAdmin(res.admin, res.accessToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosError?.response?.status === 400 || axiosError?.response?.status === 404) {
        setServerError('This invite link has expired or has already been used.');
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
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          You&apos;ve been invited
        </div>
        <h1 className="font-outfit text-2xl font-bold text-white">Set up your account</h1>
        <p className="mt-1 text-sm text-muted">
          Choose a display name and password to activate your admin access.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-white/80">
          Display name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Alex Chen"
          {...register('name')}
          className={cn(
            'h-10 w-full rounded-lg border bg-black/40 px-3 text-sm text-white placeholder:text-muted',
            'outline-none transition-colors',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
            errors.name ? 'border-danger' : 'border-white/10',
          )}
        />
        {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white/80">
          Password
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
        {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
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
            Activating…
          </>
        ) : (
          'Activate account'
        )}
      </button>
    </form>
  );
}

export default function RegisterInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      }
    >
      <RegisterInviteForm />
    </Suspense>
  );
}
