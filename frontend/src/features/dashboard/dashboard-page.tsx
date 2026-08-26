import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, BanknotesIcon, ShieldCheckIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetcher } from '@/lib/api-client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { getIntegrityBadgeVariant, getTransactionBadgeVariant } from '@/lib/status';
import type { DashboardSummary, LedgerProject } from '@/types/ledger';

const integrityColors = ['#2563eb', '#93c5fd'];

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: () => fetcher<DashboardSummary>('/dashboard'),
  });
  const { data: projects = [] } = useQuery<LedgerProject[]>({
    queryKey: ['projects'],
    queryFn: () => fetcher<LedgerProject[]>('/projects'),
  });

  const expenditureChart = useMemo(
    () =>
      projects.slice(0, 5).map((project) => ({
        name: project.name.split(' ').slice(0, 2).join(' '),
        amount: project.amount,
      })),
    [projects],
  );

  const integrityChart = useMemo(
    () => [
      { name: 'Verified', value: summary?.verifiedProjects ?? 0 },
      {
        name: 'Review Required',
        value: Math.max((summary?.totalProjects ?? 0) - (summary?.verifiedProjects ?? 0), 0),
      },
    ],
    [summary],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operational overview"
        title="Blockchain transparency for every fund transfer"
        description="GramTrust keeps the immutable fund ledger visible, auditable, and ready for public oversight."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              Explore projects
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/admin')}>
              Admin controls
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Projects"
          value={summary?.totalProjects ?? 0}
          icon={<CircleStackIcon className="h-5 w-5" />}
          note="Projects imported into the immutable ledger"
        />
        <MetricCard
          label="Total Expenditure"
          value={formatCurrency(summary?.totalExpenditure ?? 0)}
          icon={<BanknotesIcon className="h-5 w-5" />}
          note="Cumulative outlay captured from the latest dataset"
        />
        <MetricCard
          label="Verified Projects"
          value={summary?.verifiedProjects ?? 0}
          icon={<ShieldCheckIcon className="h-5 w-5" />}
          note="Projects aligned between database and blockchain"
        />
        <Card>
          <CardHeader>
            <CardDescription className="metric-label">Integrity Status</CardDescription>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-2xl font-semibold text-slate-950">
                {summary ? (
                  <Badge variant={getIntegrityBadgeVariant(summary.integrityStatus)} className="text-sm">
                    {summary.integrityStatus}
                  </Badge>
                ) : (
                  'Loading...'
                )}
              </CardTitle>
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-600">
              Current ledger consistency across database and blockchain records.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Blockchain Transactions</CardTitle>
            <CardDescription>Latest ledger operations from the transparent fund trail.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary?.recentTransactions ?? []).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium text-slate-900">{transaction.projectName}</TableCell>
                    <TableCell>
                      <Badge variant={getTransactionBadgeVariant(transaction.type)}>{transaction.type}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{formatDateTime(transaction.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ledger Integrity Mix</CardTitle>
            <CardDescription>Verified versus review-required projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={integrityChart} dataKey="value" nameKey="name" innerRadius={68} outerRadius={98} paddingAngle={2}>
                    {integrityChart.map((entry, index) => (
                      <Cell key={entry.name} fill={integrityColors[index % integrityColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Projects']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-slate-700">
              This view helps auditors spot projects that still need reconciliation before public release.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Expenditure by Project</CardTitle>
            <CardDescription>Top projects by recorded fund allocation.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenditureChart} margin={{ left: 0, right: 0, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000000}L`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" radius={[12, 12, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrity Actions</CardTitle>
            <CardDescription>Quick access to the most common oversight workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionLink title="Inspect project records" description="Review every panchayat project and its chain status." onClick={() => navigate('/projects')} />
            <ActionLink title="Run blockchain verification" description="Validate the current dataset against the immutable ledger." onClick={() => navigate('/verification')} />
            <ActionLink title="Open the integrity report" description="Compare database and blockchain balances at a glance." onClick={() => navigate('/integrity-report')} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  note: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="metric-label">{label}</CardDescription>
            <CardTitle className="metric-value mt-2">{value}</CardTitle>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{note}</p>
      </CardContent>
    </Card>
  );
}

function ActionLink({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <ArrowRightIcon className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
      </div>
    </button>
  );
}
