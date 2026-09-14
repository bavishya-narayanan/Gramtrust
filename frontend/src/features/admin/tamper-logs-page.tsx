import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { TamperLog } from '@/types/tender';

export function TamperLogsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);

  // 1. Fetch Tamper Logs
  const { data: logs = [], refetch, isFetching } = useQuery<TamperLog[]>({
    queryKey: ['tamper-logs'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: TamperLog[] }>('/tamper-logs');
      return data.data;
    },
  });

  // 2. Simulate Tampering Mutation (e.g., on Tender T705)
  const simulateMutation = useMutation({
    mutationFn: async (tenderId?: string) => {
      const { data } = await apiClient.post<{ message: string; data: any }>(
        '/actions/simulate-tender-tampering',
        { tenderId }
      );
      return data;
    },
    onSuccess: (data) => {
      setSimulationMessage(data.message || 'Tampering simulated successfully.');
      queryClient.invalidateQueries({ queryKey: ['tamper-logs'] });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      refetch();
    },
    onError: (err: any) => {
      setSimulationMessage(`Simulation failed: ${err?.response?.data?.message || err.message}`);
    },
  });

  // Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search by Tender ID, Vendor, or Record ID
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTender = log.tenderId?.toLowerCase().includes(q);
        const matchVendor = log.vendorName?.toLowerCase().includes(q);
        const matchRecord = log.recordId?.toLowerCase().includes(q);
        const matchUser = log.userName?.toLowerCase().includes(q);
        if (!matchTender && !matchVendor && !matchRecord && !matchUser) return false;
      }

      // Filter by Status
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'TAMPERED') {
          if (log.status !== 'TAMPERED' && log.status !== 'DETECTED') return false;
        } else if (log.status !== filterStatus) {
          return false;
        }
      }

      // Filter by Date
      if (filterDate) {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        if (logDate !== filterDate) return false;
      }

      return true;
    });
  }, [logs, searchQuery, filterStatus, filterDate]);

  const tamperedCount = logs.filter(
    (l) => l.status === 'TAMPERED' || l.status === 'DETECTED'
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Security & Audit Trail"
          title="Tamper Logs"
          description="Immutable record of detected database alterations and vendor integrity violations."
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => simulateMutation.mutate('T705')}
            disabled={simulateMutation.isPending}
            variant="outline"
            className="flex items-center gap-1.5 border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
          >
            <BeakerIcon className="h-4 w-4" />
            {simulateMutation.isPending ? 'Simulating...' : 'Simulate Tender Tampering (T705)'}
          </Button>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            variant="outline"
            className="flex items-center gap-1.5"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Simulation Banner */}
      {simulationMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{simulationMessage}</span>
          </div>
          <button
            onClick={() => setSimulationMessage(null)}
            className="text-rose-600 hover:text-rose-900 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Logs
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <ShieldCheckIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{logs.length}</div>
            <p className="mt-1 text-xs text-slate-500">All registered change events</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/30 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                Tampered Incidents
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <ExclamationTriangleIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-rose-700">{tamperedCount}</div>
            <p className="mt-1 text-xs text-rose-600 font-medium">
              Database alterations detected
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30 shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Authorized Changes
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <CheckBadgeIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-700">
              {logs.filter((l) => l.status === 'AUTHORIZED').length}
            </div>
            <p className="mt-1 text-xs text-emerald-600">Legitimate version modifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-200 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Filter Tamper Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tender ID / Vendor
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="e.g. T705 or Karnataka Builders"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="TAMPERED">⚠ Tampered / Detected</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Detection Date</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tamper Logs Table */}
      <Card className="border-slate-200 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[140px]">Tender ID</TableHead>
                <TableHead className="min-w-[200px]">Vendor</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[180px]">Detected At</TableHead>
                <TableHead>Incident Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isTampered =
                    log.status === 'TAMPERED' || log.status === 'DETECTED';
                  const tenderId = log.tenderId || (log.recordId.startsWith('T') ? log.recordId : null);
                  const vendorName = log.vendorName || 'Not specified';

                  return (
                    <TableRow
                      key={log.id}
                      className={
                        isTampered
                          ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500 transition-colors'
                          : 'hover:bg-slate-50/50 transition-colors'
                      }
                    >
                      {/* Tender ID */}
                      <TableCell>
                        {tenderId ? (
                          <Link
                            to={`/tenders/${tenderId}`}
                            className="inline-flex items-center gap-1 font-mono font-bold text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {tenderId}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {log.recordId}
                          </span>
                        )}
                      </TableCell>

                      {/* Vendor */}
                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          {vendorName}
                        </div>
                        {isTampered && (
                          <p className="text-[11px] text-rose-600 mt-0.5">
                            Bid associated with this vendor altered
                          </p>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isTampered ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1 text-xs font-extrabold text-rose-800 border border-rose-300">
                            <ExclamationTriangleIcon className="h-4 w-4 text-rose-600" />
                            ⚠ TAMPERED
                          </span>
                        ) : log.status === 'AUTHORIZED' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            ✓ Authorized
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {log.status}
                          </span>
                        )}
                      </TableCell>

                      {/* Detected At */}
                      <TableCell className="font-mono text-xs text-slate-600">
                        {formatDateTime(log.timestamp)}
                      </TableCell>

                      {/* Incident Details */}
                      <TableCell>
                        {isTampered ? (
                          <div className="text-xs text-slate-800">
                            <span className="font-semibold text-rose-700">Database Tampering: </span>
                            {log.oldValue && log.newValue ? (
                              <span>
                                Bid amount modified in DB from{' '}
                                <span className="font-bold text-slate-900">
                                  ₹{Number(log.oldValue).toLocaleString('en-IN')}
                                </span>{' '}
                                to{' '}
                                <span className="font-bold text-rose-700">
                                  ₹{Number(log.newValue).toLocaleString('en-IN')}
                                </span>
                              </span>
                            ) : (
                              <span>Direct unauthorized database modification detected</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{log.fieldName}: </span>
                            {log.oldValue || '—'} → {log.newValue || '—'}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldCheckIcon className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No tamper logs found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try clearing filters or click &ldquo;Simulate Tender Tampering&rdquo; to test detection.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default TamperLogsPage;
