import { Link } from 'react-router-dom';
import {
  TableCellsIcon,
  CircleStackIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth/auth-context';

const adminCards = [
  { label: 'Projects', desc: 'View all NREGA project records', to: '/projects', icon: TableCellsIcon, color: 'bg-blue-100 text-blue-600' },
  { label: 'Blockchain Verification', desc: 'Verify and audit blockchain records', to: '/verification', icon: CircleStackIcon, color: 'bg-indigo-100 text-indigo-600' },
  { label: 'Integrity Reports', desc: 'Full integrity audit and tamper logs', to: '/integrity-report', icon: DocumentChartBarIcon, color: 'bg-amber-100 text-amber-600' },
  { label: 'Tamper Logs', desc: 'View append-only audit trail of modifications', to: '/tamper-logs', icon: DocumentTextIcon, color: 'bg-red-100 text-red-600' },
  { label: 'Admin Panel', desc: 'Manage users and system settings', to: '/admin', icon: Cog6ToothIcon, color: 'bg-purple-100 text-purple-600' },
  { label: 'Import Data', desc: 'Import NREGA datasets from CSV', to: '/import', icon: ArrowUpTrayIcon, color: 'bg-green-100 text-green-600' },
];

export function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-purple-200 bg-purple-50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-purple-900">Welcome, {user?.name}</h2>
            <p className="text-sm text-purple-700">Administrator — Full system access</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{card.label}</h3>
              </div>
              <p className="text-sm text-slate-500">{card.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <strong className="text-slate-800">Admin Account: </strong>
        {user?.email} — All actions are fully logged and auditable.
      </div>
    </div>
  );
}
