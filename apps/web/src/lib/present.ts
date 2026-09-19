import type { BriefItem, BriefResponse, SourceClass, SourceRef } from '@culture-context/domain';

export type Priority = 'need' | 'useful' | 'extra';

export type GuideCard = {
  id: string;
  priority: Priority;
  section: string;
  title: string;
  blurb: string;
  preview: string;
  paragraphs: string[];
  whyYou: string | null;
  sourceName: string;
  sourceKind: string;
  checked: string;
  url: string;
};

export type Fact = {
  label: string;
  value: string;
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

const NOISE = /british citizen|british national|this information is for people travelling on a full|fcdo travel advice|sign up to get email|follow fcdo|travel insurance should cover|based on the uk government|most common types of travel|this guide also has safety advice|you should also read fcdo|reference data only, not law|this comparison uses iso|this is market reference data|world bank region|world bank capital|common name:/i;

const GLOBAL_BOILERPLATE = /terrorist attack globally|global travel impacts due to escalation in the middle east/i;

export function friendlySourceName(authority: string, sourceClass: SourceClass): string {
  if (authority.includes('Foreign, Commonwealth')) return 'UK government travel advice';
  if (authority.includes('World Bank')) return 'World Bank country facts';
  if (authority.includes('ISO')) return 'Country facts (currency, language, driving)';
  if (authority.includes('Frankfurter')) return 'Reference exchange rate';
  if (authority.includes('GDACS') || authority.includes('Disaster')) return 'International disaster alerts';
  if (authority.includes('ReliefWeb')) return 'UN humanitarian updates';
  if (sourceClass === 'government_advisory') return 'Official travel advice';
  if (sourceClass === 'reference_data') return 'Background facts';
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

function cleanFragment(part: string): string {
  return part
    .replace(/^…+\s*/, '')
    .replace(/^[a-z]{1,4}\s+(?=[A-Z])/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentences(text: string): string[] {
  const parts = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(cleanFragment)
    .filter((part) => part.length > 24 && !NOISE.test(part) && !part.startsWith('…'));
  return parts;
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

function isActivity(item: BriefItem): boolean {
  return item.relevance.some((reason) => reason.startsWith('activity:'));
}

function priority(item: BriefItem): Priority {
  const title = item.title.toLowerCase();
  const blob = `${item.title} ${item.summary}`;
  if (GLOBAL_BOILERPLATE.test(blob) && !isActivity(item)) return 'extra';
  if (isActivity(item)) return 'need';
  if (item.category === 'entry') return 'need';
  if (item.category === 'disruption') return 'need';
  if (title.includes('medication') || title.includes('illegal drugs') || title.includes('passport')) return 'need';
  if (title === 'health' || title.startsWith('warnings')) return 'extra';
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

function isFactCard(title: string): boolean {
  return (
    title === 'Money, language, and driving side' ||
    title === 'How this compares with home' ||
    title === 'Today’s exchange rate'
  );
}

export function checkedLabel(source: SourceRef): string {
  const when = new Date(source.retrieved_at);
  if (Number.isNaN(when.getTime())) return 'Checked recently';
  const hours = (Date.now() - when.getTime()) / 36e5;
  if (hours < 18) return 'Checked today';
  if (hours < 48) return 'Checked yesterday';
  return `Checked ${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function oneLine(text: string, max = 140): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 60 ? cut.slice(0, sp) : cut).trim()}…`;
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
    const paragraphs = parts.length ? parts : [cleanFragment(item.summary) || item.summary];
    const source = item.sources[0];
    cards.push({
      id: item.id,
      priority: priority(item),
      section: sectionFor(item),
      title,
      blurb: oneLine(paragraphs[0] || title),
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

function capture(blob: string, pattern: RegExp): string | null {
  const match = blob.match(pattern);
  const value = match?.[1]?.replace(/\s+/g, ' ').trim();
  return value && value.length > 1 ? value.replace(/\.$/, '') : null;
}

export function tripFacts(cards: GuideCard[]): Fact[] {
  const ref = cards.find((card) => card.title === 'Money, language, and driving side');
  const compare = cards.find((card) => card.title === 'How this compares with home');
  const fx = cards.find((card) => card.title === 'Today’s exchange rate');
  if (!ref && !compare && !fx) return [];
  const refBlob = ref?.paragraphs.join(' ') ?? '';
  const compareBlob = compare?.paragraphs.join(' ') ?? '';
  const fxBlob = fx?.paragraphs.join(' ') ?? '';
  const facts: Fact[] = [];
  const currency = capture(refBlob, /Currency:\s*([^.]{2,80})/i);
  const languages = capture(refBlob, /Languages:\s*([^.]{2,80})/i);
  const driving = capture(refBlob, /Driving side:\s*(left|right)/i);
  const homeDriving = compareBlob.match(/Driving side:\s*(left|right)\s+vs\s+(left|right)/i);
  const rate = fxBlob.match(/1\s+([A-Z]{3})\s*=\s*([\d.]+)\s+([A-Z]{3})/);

  if (currency) facts.push({ label: 'Money', value: currency });
  if (languages && !/^not listed$/i.test(languages)) {
    facts.push({ label: 'Language', value: languages });
  }
  if (driving) {
    const dest = driving.toLowerCase();
    const home = homeDriving?.[1]?.toLowerCase();
    const compareDest = homeDriving?.[2]?.toLowerCase() || dest;
    const value = compareDest === 'left' ? 'Drive on the left' : 'Drive on the right';
    facts.push({
      label: 'Driving',
      value: home && compareDest && home !== compareDest ? `${value} (different from home)` : value,
    });
  }
  if (rate) {
    const amount = Number.parseFloat(rate[2] ?? '');
    const pretty = Number.isFinite(amount) ? (amount >= 10 ? amount.toFixed(0) : amount.toFixed(2)) : (rate[2] ?? '');
    facts.push({ label: 'Exchange', value: `1 ${rate[1]} ≈ ${pretty} ${rate[3]}` });
  }
  return facts;
}

export function readingCards(cards: GuideCard[]): GuideCard[] {
  return cards.filter((card) => !isFactCard(card.title));
}

export function glance(cards: GuideCard[]): GuideCard[] {
  const pool = [
    ...cards.filter((card) => card.section !== 'Right now' && card.priority === 'need'),
    ...cards.filter((card) => card.title === 'Tattoos' || card.title === 'Everyday manners'),
  ];
  const seen = new Set<string>();
  const out: GuideCard[] = [];
  for (const card of pool) {
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
