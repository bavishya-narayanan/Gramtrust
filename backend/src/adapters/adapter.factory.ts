import { GovernmentSourceAdapter } from './government-source.adapter.js';
import { KaggleProcurementAdapter } from './kaggle-procurement.adapter.js';
import { DataGovAdapter } from './data-gov.adapter.js';
import { StateTenderAdapter } from './state-tender.adapter.js';
import { OfficialDatasetAdapter } from './official-dataset.adapter.js';

export class GovernmentAdapterFactory {
  private static adapters: Map<string, GovernmentSourceAdapter> = new Map<string, GovernmentSourceAdapter>([
    ['KAGGLE_PROCUREMENT_CSV', new KaggleProcurementAdapter()],
    // Legacy CPPP_EPROCURE alias points to Kaggle adapter (old CPPP JSON files removed)
    ['CPPP_EPROCURE', new KaggleProcurementAdapter()],
    ['DATA_GOV_IN', new DataGovAdapter()],
    ['STATE_EPROC', new StateTenderAdapter()],
    ['OFFICIAL_FILE_UPLOAD', new OfficialDatasetAdapter()],
  ]);

  static getAdapter(sourceId: string): GovernmentSourceAdapter {
    const adapter = this.adapters.get(sourceId.toUpperCase()) || this.adapters.get(sourceId);
    if (!adapter) {
      // Default to Kaggle procurement CSV adapter
      return this.adapters.get('KAGGLE_PROCUREMENT_CSV')!;
    }
    return adapter;
  }

  static getAllAdapters(): Array<{
    sourceId: string;
    sourceName: string;
    baseUrl: string;
    isLiveApiAvailable: boolean;
  }> {
    return Array.from(this.adapters.values())
      .filter((a, idx, arr) => arr.findIndex((b) => b.sourceId === a.sourceId) === idx) // deduplicate
      .map((a) => ({
        sourceId: a.sourceId,
        sourceName: a.sourceName,
        baseUrl: a.baseUrl,
        isLiveApiAvailable: a.isLiveApiAvailable,
      }));
  }

  static registerAdapter(sourceId: string, adapter: GovernmentSourceAdapter) {
    this.adapters.set(sourceId, adapter);
  }
}
