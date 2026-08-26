import { Link } from 'react-router-dom';
import { CircleStackIcon, DocumentChartBarIcon, BriefcaseIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth/auth-context';

export function OfficialDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <BriefcaseIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-blue-900">Welcome, {user?.name}</h2>
            <p className="text-sm text-blue-700">Official Portal — Authorized operations and record management</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/projects"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900">Financial Records</h3>
          </div>
          <p className="text-sm text-slate-500">View NREGA project financial records</p>
        </Link>

        <Link
          to="/verification"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CircleStackIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Blockchain Verify</h3>
          </div>
          <p className="text-sm text-slate-500">Verify blockchain integrity of financial data</p>
        </Link>

        <Link
          to="/integrity-report"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <DocumentChartBarIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Integrity Reports</h3>
          </div>
          <p className="text-sm text-slate-500">View integrity audit reports and status</p>
        </Link>

        <Link
          to="/tamper-logs"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Tamper & Audit Logs</h3>
          </div>
          <p className="text-sm text-slate-500">View append-only audit trail of modifications</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Official Access Note</h3>
        <p className="text-sm text-slate-500">
          All actions performed under your account are attributable to <strong>{user?.email}</strong>.
          Unauthorized modification of records is a criminal offence under the IT Act 2000.
        </p>
      </div>
    </div>
  );
}
