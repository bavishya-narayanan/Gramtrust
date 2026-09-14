import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  TrophyIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { tenderService } from '@/services/tender.service';
import type { Vendor } from '@/types/tender';

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadVendors() {
    setLoading(true);
    setError(null);
    try {
      const data = await tenderService.getVendors();
      setVendors(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadVendors(); }, []);

  const filtered = vendors.filter((v) =>
    !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) || v.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Vendor Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contractor & Vendor Registry</h1>
          <p className="text-sm text-slate-500 mt-1">All vendors participating in government procurement tenders with performance metrics and bid history.</p>
        </div>
        <button onClick={loadVendors} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          <ArrowPathIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Vendors</span><BuildingOffice2Icon className="h-5 w-5 text-blue-600" /></div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{vendors.length}</p>
          <p className="mt-1 text-xs text-slate-500">Registered contractors</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">With GSTIN</span><DocumentTextIcon className="h-5 w-5 text-emerald-600" /></div>
          <p className="mt-3 text-2xl font-bold text-emerald-600">{vendors.filter((v) => v.gstin).length}</p>
          <p className="mt-1 text-xs text-slate-500">GST-registered entities</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-rose-50/50 p-5 shadow-soft border-rose-200">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Blacklisted</span><ShieldExclamationIcon className="h-5 w-5 text-rose-600" /></div>
          <p className="mt-3 text-2xl font-bold text-rose-700">{vendors.filter((v) => v.isBlacklisted).length}</p>
          <p className="mt-1 text-xs text-rose-600">Debarred/flagged entities</p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by vendor name, GSTIN, or state..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <div className="border-b border-slate-100 bg-slate-50/75 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Vendor Registry ({filtered.length})</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" /><p className="mt-3 text-sm text-slate-500">Loading vendor registry...</p></div>
        ) : error ? (
          <div className="p-8 text-center"><ExclamationTriangleIcon className="mx-auto h-8 w-8 text-rose-500" /><p className="mt-2 text-sm font-semibold text-slate-900">{error}</p></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center"><BuildingOffice2Icon className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-2 text-sm text-slate-500">No vendors found. Import government tenders to populate vendor registry.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Vendor Name</th>
                  <th className="px-6 py-3.5">GSTIN / State</th>
                  <th className="px-6 py-3.5">Participated</th>
                  <th className="px-6 py-3.5">Won</th>
                  <th className="px-6 py-3.5">Win Rate</th>
                  <th className="px-6 py-3.5">Awarded Value</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((vendor) => (
                  <tr key={vendor.id} className={`hover:bg-slate-50/80 transition-colors ${vendor.isBlacklisted ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BuildingOffice2Icon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900">{vendor.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-slate-700">{vendor.gstin || 'Not Registered'}</span>
                        <span className="text-xs text-slate-500">{vendor.state || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{vendor.totalParticipated ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <TrophyIcon className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold text-amber-700">{vendor.totalWon ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vendor.winPercentage !== null && vendor.winPercentage !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, vendor.winPercentage)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{vendor.winPercentage}%</span>
                        </div>
                      ) : <span className="text-xs text-slate-400">Insufficient data</span>}
                    </td>
                    <td className="px-6 py-4">
                      {vendor.totalAwardedValue ? (
                        <span className="font-semibold text-emerald-700">&#8377;{Number(vendor.totalAwardedValue).toLocaleString('en-IN')}</span>
                      ) : <span className="text-xs text-slate-400">No contracts awarded</span>}
                    </td>
                    <td className="px-6 py-4">
                      {vendor.isBlacklisted ? (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 border border-rose-200">BLACKLISTED</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/vendors/${vendor.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
                        <ChartBarIcon className="h-3.5 w-3.5" /> Analytics
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
