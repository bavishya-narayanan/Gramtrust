import { Link } from 'react-router-dom';
import { ShieldCheckIcon, CircleStackIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth/auth-context';

export function CitizenDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
            <EyeIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-green-900">Welcome, {user?.name}</h2>
            <p className="text-sm text-green-700">Citizen Portal — Read-only access to public financial records</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <p className="text-sm text-slate-500">View NREGA project financial records and expenditure data</p>
        </Link>

        <Link
          to="/verification"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CircleStackIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Blockchain Verification</h3>
          </div>
          <p className="text-sm text-slate-500">Verify the authenticity of financial records on the blockchain</p>
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
          <p className="text-sm text-slate-500">Check the append-only change logs and security alerts</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <div className="flex items-start gap-2">
          <ShieldCheckIcon className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
          <p>
            <strong>Citizen Access:</strong> You can view financial records and blockchain verification.
            To report an issue or request elevated access, contact your district Panchayat office.
          </p>
        </div>
      </div>
    </div>
  );
}
