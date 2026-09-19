export const cultureTokens = {
  ink: '#171713',
  muted: '#68685f',
  paper: '#F6F3EA',
  panel: '#FFFDF7',
  line: '#D9D3C4',
  accent: '#D94C2B',
  safe: '#1F6F50',
  warn: '#A36519',
} as const;

export const ruleLabels = {
  law: 'LAW',
  restriction: 'RESTRICTION',
  advisory: 'ADVISORY',
  cultural_norm: 'CULTURAL NORM',
  local_impact: 'LOCAL IMPACT',
  context: 'CONTEXT',
} as const;

export const sourceClassLabels = {
  primary_law: 'Primary law',
  regulator_guidance: 'Regulator guidance',
  government_advisory: 'Government advisory',
  intergovernmental_alert: 'Intergovernmental alert',
  reference_data: 'Reference data',
  community_context: 'Community context',
} as const;

export const categoryLabels: Record<string, string> = {
  entry: 'Getting in',
  'laws-customs': 'Rules to know',
  safety: 'Staying safe',
  culture: 'Local customs',
  disruption: 'Right now',
  context: 'Helpful extras',
};

export const sourceClassPlain = {
  primary_law: 'Official law',
  regulator_guidance: 'Official guidance',
  government_advisory: 'Official travel advice',
  intergovernmental_alert: 'International alert',
  reference_data: 'Background facts',
  community_context: 'Local context',
} as const;
