import type { BriefItem, BriefResponse, SourceClass, SourceRef } from '@culture-context/domain';

export type Priority = 'need' | 'useful' | 'extra';

export type GuideCard = {
  id: string;
  priority: Priority;
  section: string;
  title: string;
  preview: string;
  paragraphs: string[];
  whyYou: string | null;
  sourceName: string;
  sourceKind: string;
  checked: string;
  url: string;
};

const TITLE_MAP: Record<string, string> = {
  'entry requirements': 'Getting into the country',
  'warnings and insurance': 'Before you go',
  'safety and security': 'Staying safe',
  'regional risks': 'Places with extra caution',
  health: 'Health and medicine',
  'getting help': 'If you need help',
  'public behaviour': 'Everyday manners',
  'public behavior': 'Everyday manners',
  tattoos: 'Tattoos',
  'lgbt+ travellers': 'LGBT+ travelers',
  'lgbt+ travelers': 'LGBT+ travelers',
};

const SKIP_TITLES = [
  'getting help',
  'cultural context from',
  'laws and restrictions noted in',
];

export function friendlySourceName(authority: string, sourceClass: SourceClass): string {
  if (authority.includes('Foreign, Commonwealth')) return 'UK government travel advice';
  if (authority.includes('World Bank')) return 'World Bank country facts';
  if (authority.includes('ISO')) return 'Country facts (currency, language, driving)';
  if (authority.includes('Frankfurter')) return 'Reference exchange rate';
  if (authority.includes('GDACS') || authority.includes('Disaster')) return 'International disaster alerts';
  if (authority.includes('ReliefWeb')) return 'UN humanitarian updates';
  if (sourceClass === 'government_advisory') return 'Official travel advice';
  if (sourceClass === 'reference_data') return 'Reference facts';
  if (sourceClass === 'intergovernmental_alert') return 'International alert';
  return authority;
}

export function friendlySourceKind(sourceClass: SourceClass): string {
  if (sourceClass === 'government_advisory') return 'Advice from another government. Not the destination’s own law.';
  if (sourceClass === 'primary_law') return 'Official law from the destination.';
  if (sourceClass === 'regulator_guidance') return 'Guidance from a regulator.';
  if (sourceClass === 'intergovernmental_alert') return 'An international alert. Not a local law.';
  if (sourceClass === 'reference_data') return 'Background facts, not rules.';
  return 'Local context. Not a law.';
}

export function friendlyTitle(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [needle, label] of Object.entries(TITLE_MAP)) {
    if (lower === needle || lower.startsWith(needle)) return label;
  }
  if (lower.startsWith('driving notes')) return 'If you plan to drive';
  if (lower.startsWith('medication notes')) return 'If you take medicine';
  if (lower.startsWith('drone notes')) return 'If you bring a drone';
  if (lower.startsWith('filming notes')) return 'Photos and filming';
  if (lower.startsWith('nightlife notes')) return 'Nights out';
  if (lower.startsWith('hiking notes')) return 'Hiking';
  if (lower.startsWith('climbing notes')) return 'Climbing';
  if (lower.startsWith('surfing notes')) return 'Beaches and water';
  if (lower.startsWith('camping notes')) return 'Camping';
  if (lower.startsWith('country reference')) return 'Money, language, and driving side';
  if (lower.startsWith('home vs destination')) return 'How this compares with home';
  if (lower.startsWith('reference fx')) return 'Today’s exchange rate';
  if (lower.startsWith('alert:')) return `Current alert: ${raw.slice(6).trim()}`;
  if (lower.startsWith('humanitarian context')) return 'Humanitarian update';
  return raw.replace(/\s+from\s+(Safety and security|Health|Entry requirements).*$/i, '').trim() || raw;
}

function skipItem(item: BriefItem): boolean {
  const lower = item.title.toLowerCase();
  return SKIP_TITLES.some((needle) => lower.includes(needle));
}

function dropBoilerplate(parts: string[]): string[] {
  const skipped = /british citizen|british national|this information is for people travelling on a full|fcdo travel advice|sign up to get email|follow fcdo|travel insurance should cover|based on the uk government|most common types of travel/i;
  const kept = parts.filter((part) => !skipped.test(part));
  return kept.length ? kept : parts;
}

function sentences(text: string): string[] {
  return dropBoilerplate(
    text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 20),
  );
}

function whyYou(item: BriefItem): string | null {
  const hits = item.relevance.filter((reason) => reason.startsWith('activity:')).map((reason) => reason.slice(9));
  if (!hits.length) return null;
  const labels: Record<string, string> = {
    driving: 'Shown because you said you may drive.',
    medication: 'Shown because you said you take medicine.',
    drone: 'Shown because you said you may bring a drone.',
    filming: 'Shown because you said you may take photos or film.',
    nightlife: 'Shown because you said you may go out at night.',
    hiking: 'Shown because you said you may hike.',
    climbing: 'Shown because you said you may climb.',
    surfing: 'Shown because you said you may go in the water.',
    camping: 'Shown because you said you may camp.',
  };
  return hits.map((hit) => labels[hit] ?? `Shown because of: ${hit}.`).join(' ');
}

function priority(item: BriefItem): Priority {
  const title = item.title.toLowerCase();
  if (item.relevance.some((reason) => reason.startsWith('activity:'))) return 'need';
  if (item.category === 'entry') return 'need';
  if (item.category === 'disruption') return 'need';
  if (title.includes('medication') || title.includes('illegal drugs') || title.includes('passport')) return 'need';
  if (item.category === 'safety' || item.category === 'laws-customs' || item.category === 'culture') return 'useful';
  return 'extra';
}

function sectionFor(item: BriefItem): string {
  if (item.category === 'entry') return 'Getting in';
  if (item.category === 'laws-customs') return 'Rules to know';
  if (item.category === 'safety') return 'Staying safe';
  if (item.category === 'culture') return 'Local customs';
  if (item.category === 'disruption') return 'Right now';
  return 'Helpful extras';
}

export function checkedLabel(source: SourceRef): string {
  const when = new Date(source.retrieved_at);
  if (Number.isNaN(when.getTime())) return 'Checked recently';
  const hours = (Date.now() - when.getTime()) / 36e5;
  if (hours < 18) return 'Checked today';
  if (hours < 48) return 'Checked yesterday';
  return `Checked ${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function toGuideCards(brief: BriefResponse): GuideCard[] {
  const seen = new Set<string>();
  const cards: GuideCard[] = [];
  for (const item of brief.items) {
    if (skipItem(item) || !item.sources[0]) continue;
    const title = friendlyTitle(item.title);
    const key = `${item.category}:${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const parts = sentences(item.summary);
    const paragraphs = parts.length ? parts : [item.summary];
    const source = item.sources[0];
    cards.push({
      id: item.id,
      priority: priority(item),
      section: sectionFor(item),
      title,
      preview: paragraphs.slice(0, 2).join(' '),
      paragraphs,
      whyYou: whyYou(item),
      sourceName: friendlySourceName(source.authority, source.source_class),
      sourceKind: friendlySourceKind(source.source_class),
      checked: checkedLabel(source),
      url: source.url,
    });
  }
  const rank: Record<Priority, number> = { need: 0, useful: 1, extra: 2 };
  cards.sort((a, b) => rank[a.priority] - rank[b.priority] || a.section.localeCompare(b.section) || a.title.localeCompare(b.title));
  return cards;
}

export function glance(cards: GuideCard[]): GuideCard[] {
  const preferred = cards.filter((card) => card.section !== 'Right now' && card.priority === 'need');
  const seen = new Set<string>();
  const out: GuideCard[] = [];
  for (const card of preferred) {
    if (seen.has(card.title)) continue;
    seen.add(card.title);
    out.push(card);
    if (out.length >= 5) break;
  }
  return out;
}

export function liveAlerts(cards: GuideCard[]): GuideCard[] {
  return cards.filter((card) => card.section === 'Right now');
}

export function downSources(brief: BriefResponse): string[] {
  return brief.source_statuses
    .filter((status) => status.status === 'unavailable' && status.id === 'govuk')
    .map(() => 'official travel advice');
}
