import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowPathIcon, CloudArrowUpIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, fetcher } from '@/lib/api-client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { getIntegrityBadgeVariant, getTransactionBadgeVariant } from '@/lib/status';
import type { DashboardSummary, LedgerProject, LedgerState, LedgerTransaction } from '@/types/ledger';

export function AdminPanelPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('Use these controls to manage the local ledger simulation.');

  const { data: projects = [] } = useQuery<LedgerProject[]>({
    queryKey: ['projects'],
    queryFn: () => fetcher<LedgerProject[]>('/projects'),
  });
  const { data: dashboard } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: () => fetcher<DashboardSummary>('/dashboard'),
  });
  const firstProjectId = useMemo(() => projects[0]?.id, [projects]);
  const { data: transactions = [] } = useQuery<LedgerTransaction[]>({
    queryKey: ['transactions', firstProjectId],
    queryFn: () => fetcher<LedgerTransaction[]>(`/projects/${firstProjectId}/transactions`),
    enabled: Boolean(firstProjectId),
  });

  const handleSuccess = async (feedback: string) => {
    setMessage(feedback);
    await queryClient.invalidateQueries();
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string; count: number }>('/actions/import-dataset');
      return data;
    },
    onSuccess: (res) => handleSuccess(`✅ Dataset imported! ${res.count ?? ''} records loaded into PostgreSQL and blockchain records created.`),
    onError: (err: unknown) => setMessage(`❌ Import failed: ${(err as Error)?.message ?? 'Unknown error'}`),
  });

  const storeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string; count: number }>('/actions/store-records');
      return data;
    },
    onSuccess: (res) => handleSuccess(`✅ Blockchain stored! ${res.count ?? ''} records committed to the immutable ledger.`),
    onError: (err: unknown) => setMessage(`❌ Store failed: ${(err as Error)?.message ?? 'Unknown error'}`),
  });

  const tamperMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string; data: LedgerProject }>('/actions/simulate-tampering');
      return data;
    },
    onSuccess: () => handleSuccess('⚠️ Tampering simulated! A PostgreSQL record was altered. Blockchain is unchanged. Click Verify to detect the mismatch.'),
    onError: (err: unknown) => setMessage(`❌ Tamper failed: ${(err as Error)?.message ?? 'Unknown error'}`),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string; count: number }>('/actions/verify-blockchain');
      return data;
    },
    onSuccess: (res) => {
      const count = res.count ?? 0;
      handleSuccess(count === 0
        ? '✅ All records verified! Database and Blockchain match perfectly.'
        : `❌ Integrity Failed! ${count} mismatches detected between PostgreSQL and Blockchain.`
      );
    },
    onError: (err: unknown) => setMessage(`❌ Verify failed: ${(err as Error)?.message ?? 'Unknown error'}`),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations center"
        title="Admin panel"
        description="Run controlled ledger operations for import, blockchain storage, tamper simulation, and verification."
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ledger controls</CardTitle>
            <CardDescription>Step-by-step demo flow for the GramTrust prototype.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ActionCard
              step="Step 1"
              title="Import Dataset"
              description="Load the real NREGA CSV into PostgreSQL and create blockchain records."
              icon={<CloudArrowUpIcon className="h-5 w-5" />}
              pending={importMutation.isPending}
              onClick={() => importMutation.mutate()}
            />
            <ActionCard
              step="Step 2"
              title="Store Records on Blockchain"
              description="Commit all current project amounts to the immutable ledger."
              icon={<ShieldCheckIcon className="h-5 w-5" />}
              pending={storeMutation.isPending}
              onClick={() => storeMutation.mutate()}
            />
            <ActionCard
              step="Step 3"
              title="Simulate Tampering"
              description="Alter a PostgreSQL record to simulate fraud. Blockchain stays unchanged."
              icon={<ExclamationTriangleIcon className="h-5 w-5" />}
              pending={tamperMutation.isPending}
              onClick={() => tamperMutation.mutate()}
            />
            <ActionCard
              step="Step 4"
              title="Verify Blockchain"
              description="Compare PostgreSQL vs Blockchain to detect mismatches."
              icon={<ArrowPathIcon className="h-5 w-5" />}
              pending={verifyMutation.isPending}
              onClick={() => verifyMutation.mutate()}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current ledger status</CardTitle>
              <CardDescription>Live snapshot from the database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-600">Integrity status</span>
                <Badge variant={getIntegrityBadgeVariant(dashboard?.integrityStatus ?? 'Review Required')}>
                  {dashboard?.integrityStatus ?? 'Review Required'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-600">Total projects</span>
                <span className="font-semibold text-slate-900">{dashboard?.totalProjects ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-600">Verified projects</span>
                <span className="font-semibold text-slate-900">{dashboard?.verifiedProjects ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-600">Total expenditure</span>
                <span className="font-semibold text-slate-900">{formatCurrency(dashboard?.totalExpenditure ?? 0)}</span>
              </div>
              <div className={`rounded-2xl p-4 text-sm leading-6 ${message.startsWith('❌') ? 'bg-red-50 text-red-800 border border-red-200' : message.startsWith('⚠️') ? 'bg-amber-50 text-amber-800 border border-amber-200' : message.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-slate-700'}`}>
                {message}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent blockchain audit trail</CardTitle>
              <CardDescription>Latest transactions from the ledger.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(dashboard?.recentTransactions ?? []).slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-950">{transaction.projectName}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{transaction.description}</p>
                    </div>
                    <Badge variant={getTransactionBadgeVariant(transaction.type)}>{transaction.type}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDateTime(transaction.timestamp)}</span>
                    <span>{formatCurrency(transaction.amount)}</span>
                  </div>
                </div>
              ))}
              {!(dashboard?.recentTransactions ?? []).length && (
                <p className="text-sm text-slate-500 text-center py-4">No blockchain transactions yet. Run Step 1 first.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  step,
  title,
  description,
  icon,
  pending,
  onClick,
}: {
  step: string;
  title: string;
  description: string;
  icon: ReactNode;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">{step}</p>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 text-blue-700">{icon}</div>
      </div>
      <Button className="mt-4 w-full" onClick={onClick} disabled={pending}>
        {pending ? 'Processing...' : title}
      </Button>
    </div>
  );
}
