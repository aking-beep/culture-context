import { z } from 'zod';

export const SourceClass = z.enum([
  'primary_law',
  'regulator_guidance',
  'government_advisory',
  'intergovernmental_alert',
  'reference_data',
  'community_context',
]);
export type SourceClass = z.infer<typeof SourceClass>;

export const RuleKind = z.enum([
  'law',
  'restriction',
  'advisory',
  'cultural_norm',
  'local_impact',
  'context',
]);
export type RuleKind = z.infer<typeof RuleKind>;

export const TravelerProfile = z.object({
  nationality: z.string().length(2).transform((v) => v.toUpperCase()),
  residence_country: z.string().length(2).transform((v) => v.toUpperCase()).optional(),
  destination_country: z.string().length(2).transform((v) => v.toUpperCase()),
  destination_slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  city: z.string().max(120).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  purpose: z.enum(['tourism', 'remote_work', 'business', 'study', 'other']).default('tourism'),
  activities: z.array(z.string().min(1)).max(30).default([]),
}).refine((value) => {
  if (value.start_date && value.end_date) return value.end_date >= value.start_date;
  return true;
}, { message: 'end_date must be on or after start_date' });
export type TravelerProfile = z.infer<typeof TravelerProfile>;

export const SourceRef = z.object({
  id: z.string(),
  authority: z.string(),
  url: z.string().url(),
  jurisdiction: z.string(),
  source_class: SourceClass,
  retrieved_at: z.string(),
  published_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  content_hash: z.string().nullable().optional(),
});
export type SourceRef = z.infer<typeof SourceRef>;

export const SourceStatus = z.object({
  id: z.string(),
  authority: z.string(),
  source_class: SourceClass,
  status: z.enum(['ok', 'unavailable']),
  retrieved_at: z.string().nullable().optional(),
  detail: z.string().nullable().optional(),
});
export type SourceStatus = z.infer<typeof SourceStatus>;

export const BriefItem = z.object({
  id: z.string(),
  category: z.string(),
  kind: RuleKind,
  title: z.string(),
  summary: z.string(),
  relevance: z.array(z.string()),
  sources: z.array(SourceRef).min(1),
});
export type BriefItem = z.infer<typeof BriefItem>;

export const BriefResponse = z.object({
  destination: z.string(),
  destination_name: z.string().nullable().optional(),
  generated_at: z.string(),
  coverage: z.enum(['partial', 'expanded']),
  warnings: z.array(z.string()),
  source_statuses: z.array(SourceStatus).default([]),
  explain_enabled: z.boolean().default(false),
  disclaimer: z.string(),
  items: z.array(BriefItem),
});
export type BriefResponse = z.infer<typeof BriefResponse>;

export const Explanation = z.object({
  item_id: z.string(),
  label: z.literal('explanation'),
  text: z.string(),
  based_on_source_ids: z.array(z.string()),
});
export type Explanation = z.infer<typeof Explanation>;

export const ExplainResponse = z.object({
  enabled: z.boolean(),
  disclaimer: z.string(),
  explanations: z.array(Explanation),
});
export type ExplainResponse = z.infer<typeof ExplainResponse>;

export const Destination = z.object({
  iso2: z.string(),
  iso3: z.string(),
  slug: z.string(),
  name: z.string(),
  city_hint: z.string(),
  govuk_slug: z.string(),
});
export type Destination = z.infer<typeof Destination>;
