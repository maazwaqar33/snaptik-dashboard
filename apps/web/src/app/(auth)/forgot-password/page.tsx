'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/cn';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
      // Intentionally vague — don't leak whether an email exists in the system
      setServerError(
        axiosError?.response?.status !== 429
          ? "If that email is registered, you'll receive a reset link shortly."
          : 'Too many requests. Please wait a few minutes before trying again.',
      );
      // Still show success UI to avoid account enumeration
      setSubmittedEmail(data.email);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted">
            If <span className="font-medium text-white/80">{submittedEmail}</span> is linked to an
            admin account, you&apos;ll receive a password reset link within a few minutes.
          </p>
        </div>
        {serverError && (
          <p className="text-xs text-muted">{serverError}</p>
        )}
        <p className="text-xs text-muted">
          Didn&apos;t receive it? Check your spam folder, or{' '}
          <button
            type="button"
            onClick={() => { setSubmitted(false); setServerError(null); }}
            className="text-accent hover:underline"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-white">Forgot password?</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your admin email and we&apos;ll send a reset link.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white/80">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@snaptik.app"
            {...register('email')}
            className={cn(
              'h-10 w-full rounded-lg border bg-black/40 pl-9 pr-3 text-sm text-white placeholder:text-muted',
              'outline-none transition-colors',
              'focus:border-accent focus:ring-2 focus:ring-accent/20',
              errors.email ? 'border-danger' : 'border-white/10',
            )}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-danger">{errors.email.message}</p>
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
            Sending…
          </>
        ) : (
          'Send reset link'
        )}
      </button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </form>
  );
}
