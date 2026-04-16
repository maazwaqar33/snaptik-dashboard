import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { ErrorBoundary } from '@/components/error-boundary';

// ─── Page spinner ──────────────────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
    </div>
  );
}

// ─── Lazy page imports ─────────────────────────────────────────────────────────
const LoginPage          = lazy(() => import('@/app/(auth)/login/page'));
const ForgotPasswordPage = lazy(() => import('@/app/(auth)/forgot-password/page'));
const ResetPasswordPage  = lazy(() => import('@/app/(auth)/reset-password/page'));
const DashboardPage      = lazy(() => import('@/app/(dashboard)/dashboard/page'));
const UsersPage          = lazy(() => import('@/app/(dashboard)/dashboard/users/page'));
const ContentPage        = lazy(() => import('@/app/(dashboard)/dashboard/content/page'));
const AnalyticsPage      = lazy(() => import('@/app/(dashboard)/dashboard/analytics/page'));
const ReportsPage        = lazy(() => import('@/app/(dashboard)/dashboard/reports/page'));
const TicketsPage        = lazy(() => import('@/app/(dashboard)/dashboard/tickets/page'));
const AuditPage          = lazy(() => import('@/app/(dashboard)/dashboard/audit/page'));
const SettingsPage       = lazy(() => import('@/app/(dashboard)/dashboard/settings/page'));
const AdminsPage         = lazy(() => import('@/app/(dashboard)/dashboard/admins/page'));
const LivePage           = lazy(() => import('@/app/(dashboard)/dashboard/live/page'));

// ─── Auth layout ───────────────────────────────────────────────────────────────
function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="font-outfit text-xl font-bold tracking-tight text-white">
            SnapTik <span className="text-accent">Admin</span>
          </span>
        </div>
        <ErrorBoundary>
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

// ─── Dashboard layout ──────────────────────────────────────────────────────────
function DashboardLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    const from = location.pathname !== '/' ? `?from=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${from}`} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Suspense fallback={<PageSpinner />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// ─── Router ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public auth pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
        <Route path="/reset-password"   element={<ResetPasswordPage />} />
      </Route>

      {/* Protected dashboard pages */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard"            element={<DashboardPage />} />
        <Route path="/dashboard/users"      element={<UsersPage />} />
        <Route path="/dashboard/content"    element={<ContentPage />} />
        <Route path="/dashboard/analytics"  element={<AnalyticsPage />} />
        <Route path="/dashboard/reports"    element={<ReportsPage />} />
        <Route path="/dashboard/tickets"    element={<TicketsPage />} />
        <Route path="/dashboard/audit"      element={<AuditPage />} />
        <Route path="/dashboard/settings"   element={<SettingsPage />} />
        <Route path="/dashboard/admins"     element={<AdminsPage />} />
        <Route path="/dashboard/live"       element={<LivePage />} />
      </Route>

      {/* Catch-all */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
