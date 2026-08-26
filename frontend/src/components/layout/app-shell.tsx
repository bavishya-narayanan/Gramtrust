import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldCheckIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/features/auth/auth-context';

export interface TamperIncident {
  code: string;
  name: string;
  dbAmount: number;
  blockchainAmount: number;
  timestamp: string;
  status: 'ACTIVE' | 'RESTORED';
}

// Navigation items with role restrictions
const ALL_NAV = [
  { name: 'Dashboard', to: '/', icon: ShieldCheckIcon, end: true, roles: ['CITIZEN', 'OFFICIAL', 'ADMIN'] as UserRole[] },
  { name: 'Projects', to: '/projects', icon: TableCellsIcon, roles: ['CITIZEN', 'OFFICIAL', 'ADMIN'] as UserRole[] },
  { name: 'Blockchain Verification', to: '/verification', icon: CircleStackIcon, roles: ['CITIZEN', 'OFFICIAL', 'ADMIN'] as UserRole[] },
  { name: 'Integrity Report', to: '/integrity-report', icon: DocumentChartBarIcon, roles: ['OFFICIAL', 'ADMIN'] as UserRole[] },
  { name: 'Tamper Logs', to: '/tamper-logs', icon: DocumentTextIcon, roles: ['CITIZEN', 'OFFICIAL', 'ADMIN'] as UserRole[] },
  { name: 'Admin Panel', to: '/admin', icon: Cog6ToothIcon, roles: ['ADMIN'] as UserRole[] },
];

const ROLE_BADGE: Record<UserRole, { label: string; class: string }> = {
  ADMIN: { label: 'Admin', class: 'bg-purple-100 text-purple-700 border-purple-200' },
  OFFICIAL: { label: 'Official', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  CITIZEN: { label: 'Citizen', class: 'bg-green-100 text-green-700 border-green-200' },
};

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tampered, setTampered] = useState<Array<{ code: string; name: string; dbAmount: number; blockchainAmount: number }>>([]);
  const [history, setHistory] = useState<TamperIncident[]>([]);

  const visibleNav = ALL_NAV.filter((item) => !user || item.roles.includes(user.role));
  const badge = user ? ROLE_BADGE[user.role] : null;

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
    const token = localStorage.getItem('gramtrust_token');
    // SSE needs token — use EventSource with URL param for simplicity
    const sseUrl = apiBase.replace(/\/api\/?$/, '') + '/api/integrity-stream';
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
          if (Array.isArray(data.tampered)) setTampered(data.tampered);
          if (Array.isArray(data.history)) setHistory(data.history);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Connection failed:', err);
    };

    return () => eventSource.close();
  }, []);

  const restoredIncidents = history.filter((h) => h.status === 'RESTORED');

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,1))] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-soft">
              <ClipboardDocumentListIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">GramTrust</p>
              <h1 className="text-xl font-semibold text-slate-950">Immutable Fund Ledger</h1>
            </div>
          </div>

          {/* Right: nav + user */}
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap items-center gap-2">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-transparent bg-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* User info + logout */}
            {user && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <UserCircleIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                    {badge && (
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.class}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  title="Logout"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <ArrowRightStartOnRectangleIcon className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Active Violations Banner */}
      {tampered.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-red-800 shadow-sm animate-pulse">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-bold text-lg">!</span>
              <div>
                <p className="font-semibold text-sm">DATABASE INTEGRITY VIOLATION DETECTED (ACTIVE)</p>
                <p className="text-xs text-red-600">
                  The database state for {tampered.length} project(s) does not match the immutable ledger records on the blockchain:{' '}
                  {tampered.map((p) => p.code).join(', ')}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restored Violations Banner */}
      {restoredIncidents.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-800 shadow-sm">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-lg">⚠</span>
              <div>
                <p className="font-semibold text-sm">REVERTED DATABASE TAMPERING LOG</p>
                <p className="text-xs text-amber-600">
                  The following projects were modified directly in the database but have since been restored to match the blockchain records:
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {restoredIncidents.map((incident, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {incident.code} (Restored at {incident.timestamp})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
