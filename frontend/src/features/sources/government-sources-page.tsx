import React, { useEffect, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CloudArrowDownIcon,
  BuildingLibraryIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { tenderService } from '@/services/tender.service';
import type { GovernmentSourceInfo, CatalogTenderItem } from '@/types/tender';

export function GovernmentSourcesPage() {
  const [adapters, setAdapters] = useState<GovernmentSourceInfo[]>([]);
  const [selectedSource, setSelectedSource] = useState('CPPP_EPROCURE');
  const [catalogItems, setCatalogItems] = useState<CatalogTenderItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogSource, setCatalogSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [importError, setImportError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // File upload
  const [uploadContent, setUploadContent] = useState('');
  const [uploadFormat, setUploadFormat] = useState<'json' | 'csv'>('json');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ count: number } | null>(null);

  async function loadAdapters() {
    try {
      const data = await tenderService.getGovAdapters();
      setAdapters(data);
    } catch (err) {
      console.error('Failed to load adapters:', err);
    }
  }

  async function loadCatalog() {
    setLoading(true);
    setImportError(null);
    try {
      const data = await tenderService.searchGovCatalog({
        sourceId: selectedSource,
        query: searchQuery || undefined,
        limit: 50,
      });
      setCatalogItems(data.items);
      setCatalogTotal(data.total);
      setCatalogSource(data.sourceName);
    } catch (err: any) {
      setImportError(err.response?.data?.message || err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAdapters(); }, []);
  useEffect(() => { loadCatalog(); }, [selectedSource]);

  async function handleImportTender(tenderId: string) {
    setImportingId(tenderId);
    setImportError(null);
    try {
      await tenderService.importGovTender({ sourceId: selectedSource, tenderId });
      setImportedIds((prev) => new Set([...prev, tenderId]));
    } catch (err: any) {
      setImportError(`Import failed for ${tenderId}: ` + (err.response?.data?.message || err.message));
    } finally {
      setImportingId(null);
    }
  }

  async function handleUploadDataset(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadContent.trim()) return;
    setUploadLoading(true);
    setUploadResult(null);
    try {
      const result = await tenderService.uploadGovDataset({ rawContent: uploadContent, format: uploadFormat });
      setUploadResult({ count: result.data.count });
      setUploadContent('');
    } catch (err: any) {
      setImportError('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">Government Data Sources</span>
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-700/10">Real Official Datasets</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Government Procurement Sources</h1>
        <p className="text-sm text-slate-500 mt-1">Browse authentic procurement datasets from CPPP/eProcure and Data.gov.in. Import official records into GramTrust's immutable ledger.</p>
      </div>

      {/* Source Adapters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adapters.map((adapter) => (
          <button
            key={adapter.sourceId}
            onClick={() => setSelectedSource(adapter.sourceId)}
            className={`rounded-2xl border p-4 text-left transition-all ${selectedSource === adapter.sourceId ? 'border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}`}
          >
            <div className="flex items-center justify-between">
              <BuildingLibraryIcon className={`h-6 w-6 ${selectedSource === adapter.sourceId ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${adapter.isLiveApiAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {adapter.isLiveApiAvailable ? 'Live API' : 'File-based'}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">{adapter.sourceName}</h3>
            <a href={adapter.baseUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
              {adapter.baseUrl} <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </a>
            {!adapter.isLiveApiAvailable && (
              <p className="mt-2 text-[10px] text-slate-500">Note: Direct developer API not available without CAPTCHA. Uses verified official datasets.</p>
            )}
          </button>
        ))}
      </div>

      {/* Catalog Browser */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <div className="border-b border-slate-100 bg-slate-50/75 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{catalogSource || 'Government Tender Catalog'}</h3>
              <p className="text-xs text-slate-500">{catalogTotal} authentic procurement records — click Import to add to GramTrust immutable ledger</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadCatalog()}
                placeholder="Search tenders..."
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none w-48"
              />
              <button onClick={() => loadCatalog()} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                <ArrowPathIcon className="h-3.5 w-3.5" /> Search
              </button>
            </div>
          </div>
        </div>

        {importError && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" /> {importError}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
            <p className="mt-3 text-sm text-slate-500">Fetching government procurement catalog...</p>
          </div>
        ) : catalogItems.length === 0 ? (
          <div className="p-12 text-center">
            <InformationCircleIcon className="mx-auto h-10 w-10 text-slate-300" />
            <h4 className="mt-2 text-sm font-semibold text-slate-900">No catalog records found</h4>
            <p className="mt-1 text-xs text-slate-500">Select a source above or adjust your search.</p>
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
                  <th className="px-6 py-3.5">Bids / Award</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogItems.map((item) => {
                  const isImporting = importingId === item.tenderId;
                  const isImported = importedIds.has(item.tenderId);
                  return (
                    <tr key={item.tenderId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{item.tenderTitle}</span>
                          <span className="font-mono text-xs text-slate-500">Ref: {item.tenderReferenceNumber} | ID: {item.tenderId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{item.department}</span>
                          <span className="text-xs text-slate-500">{item.district}, {item.state}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">&#8377;{Number(item.estimatedValue).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.status === 'Awarded' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{item.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-600">{item.bidsCount} bid(s)</span>
                          {item.hasAwardData ? <span className="text-[10px] font-semibold text-emerald-700">Award Data Available</span> : <span className="text-[10px] text-slate-400">No award data</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isImported ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircleIcon className="h-3.5 w-3.5" /> Imported
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImportTender(item.tenderId)}
                            disabled={isImporting}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                          >
                            <CloudArrowDownIcon className="h-3.5 w-3.5" />
                            {isImporting ? 'Importing...' : 'Import'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Dataset Upload */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <DocumentArrowUpIcon className="h-6 w-6 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-slate-900">Upload Official Government Dataset</h3>
            <p className="text-xs text-slate-500">Upload officially downloaded CSV or JSON procurement datasets from CPPP, GeM, or state portals.</p>
          </div>
        </div>

        {uploadResult && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs font-semibold text-emerald-800">
            <CheckCircleIcon className="inline h-4 w-4 mr-1" />
            Successfully parsed {uploadResult.count} procurement record(s) from uploaded dataset. Records are ready for import.
          </div>
        )}

        <form onSubmit={handleUploadDataset} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700">File Format</label>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="format" value="json" checked={uploadFormat === 'json'} onChange={() => setUploadFormat('json')} className="text-blue-600" />
                <span className="text-sm font-medium text-slate-700">JSON (Array of records)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="format" value="csv" checked={uploadFormat === 'csv'} onChange={() => setUploadFormat('csv')} className="text-blue-600" />
                <span className="text-sm font-medium text-slate-700">CSV (with standard headers)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Paste Dataset Content</label>
            <textarea
              rows={8}
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              placeholder={uploadFormat === 'json' ? '[{\n  "tenderId": "...",\n  "tenderTitle": "...",\n  ...\n}]' : 'tenderId,tenderTitle,department,state,district,estimatedValue,...'}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => { setUploadContent(''); setUploadResult(null); }} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Clear</button>
            <button type="submit" disabled={uploadLoading || !uploadContent.trim()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              <DocumentArrowUpIcon className="h-4 w-4" />
              {uploadLoading ? 'Parsing...' : 'Parse & Validate Dataset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
