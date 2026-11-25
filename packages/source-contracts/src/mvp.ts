import type { SourceDefinition } from './index';

export const mvpSources: SourceDefinition[] = [
  {
    id: 'govuk',
    authority: 'UK Foreign, Commonwealth & Development Office',
    sourceClass: 'government_advisory',
    jurisdiction: 'destination',
    machineReadable: true,
    refresh: '6h',
    official: true,
    notes: 'Structured foreign-travel-advice. Advisory, not destination primary law.',
  },
  {
    id: 'restcountries',
    authority: 'REST Countries',
    sourceClass: 'reference_data',
    jurisdiction: 'GLOBAL',
    machineReadable: true,
    refresh: 'weekly',
    official: false,
  },
];
