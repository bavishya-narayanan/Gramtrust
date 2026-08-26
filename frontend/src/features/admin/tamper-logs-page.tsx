import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowPathIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, fetcher } from '@/lib/api-client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { LedgerProject } from '@/types/ledger';

interface TamperLog {
  id: string;
  recordId: string;
  userId: string | null;
  userName: string;
  userRole: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: 'UPDATE' | 'UNAUTHORIZED_UPDATE' | 'DIRECT_DATABASE_CHANGE' | 'BLOCKCHAIN_MISMATCH';
  status: 'AUTHORIZED' | 'BLOCKED' | 'DETECTED';
  timestamp: string;
}

export function TamperLogsPage() {
  const [filterUser, setFilterUser] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  // 1. Fetch Projects to map code -> district
  const { data: projects = [] } = useQuery<LedgerProject[]>({
    queryKey: ['projects'],
    queryFn: () => fetcher<LedgerProject[]>('/projects'),
  });

  // Unique list of districts for the dropdown
  const districts = useMemo(() => {
    const d = new Set<string>();
    projects.forEach((p) => {
      if (p.district) d.add(p.district);
    });
    return Array.from(d).sort();
  }, [projects]);

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, LedgerProject>();
    projects.forEach((p) => {
      map.set(p.code, p);
    });
    return map;
  }, [projects]);

  // 2. Fetch Tamper Logs
  const { data: logs = [], refetch, isFetching } = useQuery<TamperLog[]>({
    queryKey: ['tamper-logs'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: TamperLog[] }>('/tamper-logs');
      return data.data;
    },
  });

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by User Name / ID
      if (filterUser) {
        const query = filterUser.toLowerCase();
        const matchesUser =
          log.userName.toLowerCase().includes(query) ||
          (log.userId && log.userId.toLowerCase().includes(query));
        if (!matchesUser) return false;
      }

      // Filter by Role
      if (filterRole !== 'ALL' && log.userRole !== filterRole) {
        return false;
      }

      // Filter by Change Type
      if (filterType !== 'ALL' && log.changeType !== filterType) {
        return false;
      }

      // Filter by Status
      if (filterStatus !== 'ALL' && log.status !== filterStatus) {
        return false;
      }

      // Filter by Date
      if (filterDate) {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        if (logDate !== filterDate) return false;
      }

      // Filter by District (lookup project using recordId as code)
      if (filterDistrict !== 'ALL') {
        const proj = projectMap.get(log.recordId);
        if (!proj || proj.district !== filterDistrict) return false;
      }

      return true;
    });
  }, [logs, filterUser, filterRole, filterType, filterStatus, filterDate, filterDistrict, projectMap]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          eyebrow="Security & Audit Trail"
          title="Tamper & Change Logs"
          description="Immutable record of all database updates, unauthorized attempts, and integrity violations."
        />
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline" className="flex items-center gap-2">
          <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Logs
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-200 shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Filter Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">User / Email</label>
              <Input
                placeholder="Search user..."
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="OFFICIAL">Official</option>
                <option value="CITIZEN">Citizen</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Change Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="UPDATE">Update</option>
                <option value="UNAUTHORIZED_UPDATE">Unauthorized</option>
                <option value="DIRECT_DATABASE_CHANGE">Direct DB Write</option>
                <option value="BLOCKCHAIN_MISMATCH">BC Mismatch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DETECTED">Detected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">District</label>
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
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

      {/* Logs Table */}
      <Card className="border-slate-200 shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Record (Code)</TableHead>
                <TableHead>User / Identity</TableHead>
                <TableHead className="w-[100px]">Role</TableHead>
                <TableHead className="w-[100px]">Field</TableHead>
                <TableHead className="text-right">Old Value</TableHead>
                <TableHead className="text-right">New Value</TableHead>
                <TableHead>Change Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const proj = projectMap.get(log.recordId);
                  const isAmount = log.fieldName === 'amount';

                  let statusVariant: 'default' | 'secondary' | 'outline' | 'destructive' = 'default';
                  if (log.status === 'AUTHORIZED') statusVariant = 'default'; // blue/green style
                  else if (log.status === 'BLOCKED') statusVariant = 'outline'; // amber border style
                  else statusVariant = 'destructive'; // red style

                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-[11px] text-slate-500">
                        {formatDateTime(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{log.recordId}</div>
                        {proj && <div className="text-[10px] text-slate-500">{proj.name} ({proj.district})</div>}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-950">{log.userName}</div>
                        {log.userId && <div className="text-[10px] text-slate-400 font-mono">ID: {log.userId}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {log.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{log.fieldName}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-600">
                        {isAmount && log.oldValue ? formatCurrency(Number(log.oldValue)) : log.oldValue ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-slate-900">
                        {isAmount && log.newValue ? formatCurrency(Number(log.newValue)) : log.newValue ?? '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium border ${
                          log.changeType === 'UPDATE'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : log.changeType === 'UNAUTHORIZED_UPDATE'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {log.changeType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                          log.status === 'AUTHORIZED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.status === 'BLOCKED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                    <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    No tamper logs found matching current filters.
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
