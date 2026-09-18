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
  purpose: z.enum(['tourism', 'remote_work', 'business', 'study', 'other']).default('tourism'),
  activities: z.array(z.string().min(1)).max(30).default([]),
});
export type TravelerProfile = z.infer<typeof TravelerProfile>;

export const SourceRef = z.object({
  id: z.string(),
  authority: z.string(),
  url: z.string().url(),
  jurisdiction: z.string(),
  source_class: SourceClass,
  retrieved_at: z.string(),
  content_hash: z.string().nullable().optional(),
});
export type SourceRef = z.infer<typeof SourceRef>;

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
  generated_at: z.string(),
  coverage: z.enum(['partial', 'expanded']),
  warnings: z.array(z.string()),
  items: z.array(BriefItem),
});
export type BriefResponse = z.infer<typeof BriefResponse>;
