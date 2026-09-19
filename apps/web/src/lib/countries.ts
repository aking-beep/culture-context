import raw from './world-countries.json';

export type WorldCountry = {
  iso2: string;
  iso3: string;
  name: string;
  slug: string;
  govuk_slug: string;
  capital: string;
  currency: string;
  currency_name: string;
  languages: string[];
  driving: string;
  aliases: string[];
};

export const COUNTRIES: WorldCountry[] = raw as WorldCountry[];

const BY_ISO2 = new Map(COUNTRIES.map((country) => [country.iso2, country]));
const BY_SLUG = new Map(COUNTRIES.map((country) => [country.slug, country]));

export const POPULAR_DESTINATIONS = ['JP', 'IT', 'ES', 'MX', 'TH', 'US', 'FR', 'AE'];
export const POPULAR_PASSPORTS = ['US', 'IN', 'NG', 'BR', 'PH', 'MX', 'GB', 'CN'];

export function countryByIso(iso2: string | undefined): WorldCountry | undefined {
  if (!iso2) return undefined;
  return BY_ISO2.get(iso2.toUpperCase());
}

export function countryBySlug(slug: string | undefined): WorldCountry | undefined {
  if (!slug) return undefined;
  return BY_SLUG.get(slug);
}

export function countryName(iso2: string | undefined): string {
  return countryByIso(iso2)?.name ?? iso2 ?? '';
}

export function foldText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function displayCountryName(iso2: string | undefined, locale = 'en'): string {
  if (!iso2) return '';
  try {
    const name = new Intl.DisplayNames([locale], { type: 'region' }).of(iso2.toUpperCase());
    if (name && name !== iso2.toUpperCase()) return name;
  } catch {
    /* some runtimes lack the locale */
  }
  return countryName(iso2);
}

export function flagEmoji(iso2: string): string {
  if (iso2.length !== 2 || iso2 === 'XK') return '🏳️';
  const upper = iso2.toUpperCase();
  return String.fromCodePoint(...[...upper].map((char) => 127397 + char.charCodeAt(0)));
}

export function findCountries(query: string, locale = 'en'): WorldCountry[] {
  const needle = foldText(query.trim());
  if (!needle) return [];
  const scored: { country: WorldCountry; score: number }[] = [];
  for (const country of COUNTRIES) {
    const localized = foldText(displayCountryName(country.iso2, locale));
    const hay = foldText(
      [country.name, localized, country.slug, country.iso2, country.iso3, country.capital, ...country.aliases].join(' '),
    );
    if (!hay.includes(needle) && foldText(country.iso2) !== needle) continue;
    const name = foldText(country.name);
    let score = 50;
    if (name === needle || localized === needle || foldText(country.iso2) === needle || country.slug === needle) score = 0;
    else if (name.startsWith(needle) || localized.startsWith(needle) || country.aliases.some((alias) => foldText(alias).startsWith(needle))) score = 1;
    else if (name.includes(needle) || localized.includes(needle)) score = 2;
    else score = 3;
    scored.push({ country, score });
  }
  scored.sort((a, b) => a.score - b.score || displayCountryName(a.country.iso2, locale).localeCompare(displayCountryName(b.country.iso2, locale), locale));
  return scored.slice(0, 10).map((item) => item.country);
}
