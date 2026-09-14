import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,

} from '@heroicons/react/24/outline';
import { tenderService } from '@/services/tender.service';
import type { Tender, TenderStats } from '@/types/tender';
import { useAuth } from '@/features/auth/auth-context';

export function TendersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState<TenderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');


  const canImport = user?.role === 'OFFICIAL' || user?.role === 'ADMIN';

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [tendersRes, statsRes] = await Promise.all([
        tenderService.getTenders({
          query: searchQuery || undefined,
          department: selectedDepartment || undefined,
          state: selectedState || undefined,
          status: selectedStatus || undefined,
          limit: 50,
        }),
        tenderService.getStats(),
      ]);
      setTenders(tendersRes.items);
      setStats(statsRes);
    } catch (err: any) {
      console.error('Failed to load tenders data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedDepartment, selectedState, selectedStatus]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadData();
  }

  const departments = useMemo(() => {
    const set = new Set<string>();
    tenders.forEach((t) => t.department && set.add(t.department));
    return Array.from(set);
  }, [tenders]);

  const states = useMemo(() => {
    const set = new Set<string>();
    tenders.forEach((t) => t.state && set.add(t.state));
    return Array.from(set);
  }, [tenders]);

  const displayedTenders = tenders;


  function formatCurrency(amount: number) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Government Procurement
            </span>
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
              Git-like Version History
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tender & Procurement Transparency
          </h1>
          <p className="text-sm text-slate-500">
            Real government procurement records from CPPP / eProcure and Data.gov.in with immutable SHA-256 audit chains.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
          {canImport && (
            <Link
              to="/sources"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Import Govt Tender
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Tenders</span>
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{stats?.totalTenders ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">Imported government records</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Tenders</span>
            <ClockIcon className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-600">{stats?.activeTenders ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">In bidding / evaluation</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Awarded</span>
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600">{stats?.awardedTenders ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">Contracts finalized</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Procurement Value</span>
            <BanknotesIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-indigo-600">
            {formatCurrency(stats?.totalProcurementValue ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total estimated value</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vendors</span>
            <BuildingOffice2Icon className="h-5 w-5 text-slate-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{stats?.totalVendors ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">Registered contractors</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Tamper Alerts</span>
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-700">{stats?.tamperAlerts ?? 0}</p>
          <p className="mt-1 text-xs text-rose-600">Integrity violations detected</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Tender ID, Reference Number, Project Title, Department..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d.length > 35 ? d.slice(0, 35) + '...' : d}
                </option>
              ))}
            </select>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Under Evaluation">Under Evaluation</option>
              <option value="Awarded">Awarded</option>
              <option value="In Progress">In Progress</option>
            </select>


            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Filter
            </button>

            {(searchQuery || selectedDepartment || selectedState || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDepartment('');
                  setSelectedState('');
                  setSelectedStatus('');
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tenders List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <div className="border-b border-slate-100 bg-slate-50/75 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Procurement Records ({tenders.length})</h3>
            <span className="text-xs text-slate-500">
              Each modification creates a forward Git-like cryptographic hash chain
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            <p className="mt-3 text-sm text-slate-500">Loading authentic procurement ledger...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-rose-500" />
            <p className="mt-2 text-sm font-semibold text-slate-900">{error}</p>
            <button
              onClick={() => loadData()}
              className="mt-3 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Try Again
            </button>
          </div>
        ) : displayedTenders.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">No procurement records found</h3>
            <p className="mt-1 text-xs text-slate-500">
              No tenders match your search criteria. Import official records from Government Sources.
            </p>
            {canImport && (
              <div className="mt-4">
                <Link
                  to="/sources"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Go to Government Sources
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Tender & Reference</th>
                  <th className="px-6 py-3.5">Department & Location</th>
                  <th className="px-6 py-3.5">Estimated Value</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Integrity Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTenders.map((tender) => {
                  const isTampered = tender.blockchainStatus === 'Tampered';

                  return (
                    <tr
                      key={tender.id}
                      className={
                        isTampered
                          ? 'bg-rose-50/30 hover:bg-rose-50/60 border-l-4 border-l-rose-500 transition-colors cursor-pointer'
                          : 'hover:bg-slate-50/80 transition-colors cursor-pointer'
                      }
                      onClick={() => navigate(`/tenders/${tender.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 hover:text-blue-600">
                            {tender.title}
                          </span>
                          <span className="mt-0.5 font-mono text-xs text-slate-500">
                            Ref: {tender.referenceNumber} | ID: {tender.tenderId}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{tender.department}</span>
                          <span className="text-xs text-slate-500">
                            {tender.district}, {tender.state} {tender.panchayat ? `(GP: ${tender.panchayat})` : ''}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          ₹{Number(tender.estimatedValue).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            tender.status === 'Awarded'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : tender.status === 'Under Evaluation'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {tender.status}
                        </span>
                      </td>


                      <td className="px-6 py-4">
                        {isTampered ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-extrabold text-rose-800 border border-rose-300">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5 text-rose-600" />
                            ⚠ TAMPERED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                            ✓ VERIFIED
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/tenders/${tender.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                        >
                          Details
                          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
