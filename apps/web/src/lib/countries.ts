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

export function flagEmoji(iso2: string): string {
  if (iso2.length !== 2 || iso2 === 'XK') return '🏳️';
  const upper = iso2.toUpperCase();
  return String.fromCodePoint(...[...upper].map((char) => 127397 + char.charCodeAt(0)));
}

export function findCountries(query: string): WorldCountry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const scored: { country: WorldCountry; score: number }[] = [];
  for (const country of COUNTRIES) {
    const hay = [country.name, country.slug, country.iso2, country.iso3, country.capital, ...country.aliases]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(needle) && country.iso2.toLowerCase() !== needle) continue;
    const name = country.name.toLowerCase();
    let score = 50;
    if (name === needle || country.iso2.toLowerCase() === needle || country.slug === needle) score = 0;
    else if (name.startsWith(needle) || country.aliases.some((alias) => alias.toLowerCase().startsWith(needle))) score = 1;
    else if (name.includes(needle)) score = 2;
    else score = 3;
    scored.push({ country, score });
  }
  scored.sort((a, b) => a.score - b.score || a.country.name.localeCompare(b.country.name));
  return scored.slice(0, 10).map((item) => item.country);
}
