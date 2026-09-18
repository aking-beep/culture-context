export type RefreshCadence = '15m' | '1h' | '6h' | 'daily' | 'weekly' | 'manual';

export interface SourceDefinition {
  id: string;
  authority: string;
  sourceClass:
    | 'primary_law'
    | 'regulator_guidance'
    | 'government_advisory'
    | 'intergovernmental_alert'
    | 'reference_data'
    | 'community_context';
  jurisdiction: string;
  machineReadable: boolean | 'partial';
  refresh: RefreshCadence;
  official: boolean;
  notes?: string;
}

export interface SourceSnapshot {
  sourceId: string;
  url: string;
  retrievedAt: string;
  contentHash: string;
  normalizedText: string;
  status: 'ok' | 'unavailable';
}
