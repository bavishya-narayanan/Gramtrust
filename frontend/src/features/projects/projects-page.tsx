import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetcher } from '@/lib/api-client';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { getBlockchainBadgeVariant, getProjectBadgeVariant } from '@/lib/status';
import type { BlockchainStatus, LedgerProject } from '@/types/ledger';

const blockchainFilters: Array<'All' | BlockchainStatus> = ['All', 'Verified', 'Recorded', 'Pending', 'Tampered'];

export function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [blockchainFilter, setBlockchainFilter] = useState<'All' | BlockchainStatus>('All');

  const { data: projects = [] } = useQuery<LedgerProject[]>({
    queryKey: ['projects'],
    queryFn: () => fetcher<LedgerProject[]>('/projects'),
  });

  const filteredProjects = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !searchTerm ||
        [project.id, project.name, project.district, project.state, project.financialYear]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm);

      const matchesBlockchain = blockchainFilter === 'All' || project.blockchainStatus === blockchainFilter;
      return matchesSearch && matchesBlockchain;
    });
  }, [blockchainFilter, projects, search]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project registry"
        title="Panchayat projects and ledger status"
        description="Review each project, the recorded amount, and whether the blockchain record remains intact."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="metric-label">Total Projects</CardDescription>
            <CardTitle className="metric-value mt-2">{projects.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="metric-label">Verified on Chain</CardDescription>
            <CardTitle className="metric-value mt-2">{projects.filter((project) => project.blockchainStatus === 'Verified').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="metric-label">Review Required</CardDescription>
            <CardTitle className="metric-value mt-2">{projects.filter((project) => project.integrityStatus !== 'Verified').length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Project table</CardTitle>
              <CardDescription>Click any row to open the full project ledger.</CardDescription>
            </div>
            <div className="relative w-full max-w-md">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by project, district, state, or year"
                className="pl-11"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-slate-500" />
            {blockchainFilters.map((status) => (
              <Button
                key={status}
                variant={blockchainFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBlockchainFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project ID</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>District</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Financial Year</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blockchain Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className="cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                  <TableCell className="font-medium text-slate-950">{project.id}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-950">{project.name}</p>
                      <p className="text-xs text-slate-500">Updated {formatShortDate(project.lastUpdatedAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{project.district}</TableCell>
                  <TableCell>{project.state}</TableCell>
                  <TableCell>{project.financialYear}</TableCell>
                  <TableCell>{formatCurrency(project.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={getProjectBadgeVariant(project.status)}>{project.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBlockchainBadgeVariant(project.blockchainStatus)}>{project.blockchainStatus}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!filteredProjects.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
              No projects match the current search or blockchain filter.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
