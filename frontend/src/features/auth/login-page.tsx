import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardDocumentListIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from './auth-context';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect
  if (user) {
    const dest = user.role === 'ADMIN' ? '/admin' : user.role === 'OFFICIAL' ? '/official' : '/citizen';
    navigate(dest, { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email.trim(), password);
      // post-login redirect happens in routes.tsx via RoleRedirect
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Login failed. Please try again.';
      setError(msg);
    }
  }

  const demoAccounts = [
    { label: 'Admin', email: 'admin@gramtrust.gov', password: 'Admin@123', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'Official', email: 'official@gramtrust.gov', password: 'Official@123', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Citizen', email: 'citizen@gramtrust.gov', password: 'Citizen@123', color: 'bg-green-100 text-green-700 border-green-200' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-4">
      {/* Header Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <ClipboardDocumentListIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Government of India</p>
            <h1 className="text-xl font-bold text-slate-900">GramTrust</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Immutable Fund Ledger — Blockchain-secured NREGA financial records
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Secure Sign In</h2>
          </div>
          <p className="text-sm text-slate-500">Enter your official credentials to access the portal</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email / Username
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="official@gramtrust.gov"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Demo Accounts</p>
          <div className="flex flex-col gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.password); setError(null); }}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80 ${acc.color}`}
              >
                <span>{acc.label}</span>
                <span className="opacity-70 font-mono">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        GramTrust · Secure Government Portal · All access is logged
      </p>
    </div>
  );
}
