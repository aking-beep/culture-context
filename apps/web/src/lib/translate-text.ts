const MYMEMORY: Record<string, string> = {
  es: 'es', pt: 'pt', fr: 'fr', de: 'de', it: 'it', ja: 'ja', zh: 'zh-CN',
  'zh-TW': 'zh-TW', 'zh-HK': 'zh-TW', ar: 'ar', hi: 'hi', ko: 'ko', ru: 'ru',
  id: 'id', th: 'th', vi: 'vi', tr: 'tr', pl: 'pl', nl: 'nl', uk: 'uk', fil: 'tl',
  bn: 'bn', ur: 'ur', fa: 'fa', he: 'he', sw: 'sw', cs: 'cs', el: 'el', ro: 'ro',
  hu: 'hu', sv: 'sv', da: 'da', fi: 'fi', no: 'no', ms: 'ms', am: 'am', km: 'km',
  my: 'my', ne: 'ne', lo: 'lo', si: 'si', ta: 'ta', ps: 'ps', is: 'is', ga: 'ga',
  sq: 'sq', hy: 'hy', az: 'az', be: 'be', bg: 'bg', hr: 'hr', et: 'et', ka: 'ka',
  lt: 'lt', lv: 'lv', mk: 'mk', mn: 'mn', sk: 'sk', sl: 'sl', sr: 'sr', so: 'so',
  uz: 'uz', kk: 'kk', ky: 'ky', tg: 'tg', tk: 'tk', ca: 'ca', mt: 'mt', rw: 'rw',
  sm: 'sm', ti: 'ti', fo: 'fo', kl: 'kl', dv: 'dv', dz: 'dz', bs: 'bs',
};

const FAIL = /MYMEMORY WARNING|INVALID LANGUAGE PAIR|QUERY LENGTH|PLEASE SELECT TWO DISTINCT|INVALID SOURCE LANGUAGE|INVALID TARGET LANGUAGE/i;
const cache = new Map<string, string>();
const MAX_CACHE = 800;
const MAX_CHUNK = 450;

export function mymemoryLang(locale: string): string | null {
  if (!locale || locale === 'en' || locale.startsWith('en-')) return null;
  return MYMEMORY[locale] || MYMEMORY[locale.split('-')[0] || ''] || locale.split('-')[0] || null;
}

export function protectPlaceholders(text: string): string {
  return text.replace(/\{(\w+)\}/g, '⟦$1⟧');
}

export function restorePlaceholders(text: string): string {
  return text.replace(/⟦\s*(\w+)\s*⟧/g, '{$1}');
}

function cacheGet(key: string): string | undefined {
  return cache.get(key);
}

function cacheSet(key: string, value: string) {
  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, value);
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      out[index] = await fn(items[index] as T, index);
    }
  }
  const workers = Array.from({ length: Math.min(limit, Math.max(items.length, 1)) }, () => worker());
  await Promise.all(workers);
  return out;
}

function splitChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > MAX_CHUNK) {
    const window = rest.slice(0, MAX_CHUNK);
    const cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf(' '), 200);
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

type FetchLike = typeof fetch;

async function translateChunk(text: string, langpair: string, fetchImpl: FetchLike): Promise<string> {
  const key = `${langpair}:${text}`;
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;
  const email = process.env.MYMEMORY_EMAIL;
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', langpair);
  if (email) url.searchParams.set('de', email);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return text;
    const data = await response.json() as { responseData?: { translatedText?: string } };
    const translated = data.responseData?.translatedText?.trim();
    if (!translated || FAIL.test(translated)) return text;
    const cleaned = translated.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    cacheSet(key, cleaned);
    return cleaned;
  } catch {
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function translateTexts(
  locale: string,
  texts: string[],
  fetchImpl: FetchLike = fetch,
): Promise<string[]> {
  const target = mymemoryLang(locale);
  if (!target || texts.length === 0) return texts;
  const langpair = `en|${target}`;
  return mapPool(texts, 4, async (text) => {
    const trimmed = text?.trim();
    if (!trimmed) return text;
    if (!/[A-Za-z]/.test(trimmed)) return text;
    const protectedText = protectPlaceholders(trimmed);
    const parts = splitChunks(protectedText);
    const translatedParts: string[] = [];
    for (const part of parts) {
      translatedParts.push(await translateChunk(part, langpair, fetchImpl));
    }
    return restorePlaceholders(translatedParts.join(' '));
  });
}
