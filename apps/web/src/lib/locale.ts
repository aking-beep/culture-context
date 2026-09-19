const PASSPORT_LOCALE: Record<string, string> = {
  AF: 'ps', AL: 'sq', DZ: 'ar', AS: 'en', AD: 'ca', AO: 'pt', AI: 'en', AQ: 'en', AG: 'en',
  AR: 'es', AM: 'hy', AW: 'nl', AU: 'en', AT: 'de', AZ: 'az', BS: 'en', BH: 'ar', BD: 'bn',
  BB: 'en', BY: 'be', BE: 'nl', BZ: 'en', BJ: 'fr', BM: 'en', BT: 'dz', BO: 'es', BQ: 'nl',
  BA: 'bs', BW: 'en', BR: 'pt', IO: 'en', VG: 'en', BN: 'ms', BG: 'bg', BF: 'fr', BI: 'fr',
  KH: 'km', CM: 'fr', CA: 'en', CV: 'pt', KY: 'en', CF: 'fr', TD: 'ar', CL: 'es', CN: 'zh',
  CO: 'es', KM: 'ar', CG: 'fr', CK: 'en', CR: 'es', HR: 'hr', CU: 'es', CW: 'nl', CY: 'el',
  CZ: 'cs', CI: 'fr', CD: 'fr', DK: 'da', DJ: 'ar', DM: 'en', DO: 'es', EC: 'es', EG: 'ar',
  SV: 'es', GQ: 'es', ER: 'ti', EE: 'et', SZ: 'en', ET: 'am', FK: 'en', FO: 'fo', FM: 'en',
  FJ: 'en', FI: 'fi', FR: 'fr', GF: 'fr', PF: 'fr', GA: 'fr', GE: 'ka', DE: 'de', GH: 'en',
  GI: 'en', GR: 'el', GL: 'kl', GD: 'en', GP: 'fr', GU: 'en', GT: 'es', GN: 'fr', GW: 'pt',
  GY: 'en', HT: 'fr', HN: 'es', HK: 'zh-HK', HU: 'hu', IS: 'is', IN: 'hi', ID: 'id', IR: 'fa',
  IQ: 'ar', IE: 'en', IM: 'en', IL: 'he', IT: 'it', JM: 'en', JP: 'ja', JO: 'ar', KZ: 'kk',
  KE: 'sw', KI: 'en', XK: 'sq', KW: 'ar', KG: 'ky', LA: 'lo', LV: 'lv', LB: 'ar', LS: 'en',
  LR: 'en', LY: 'ar', LI: 'de', LT: 'lt', LU: 'fr', MO: 'zh', MG: 'mg', MW: 'en', MY: 'ms',
  MV: 'dv', ML: 'fr', MT: 'mt', MH: 'en', MQ: 'fr', MR: 'ar', MU: 'en', YT: 'fr', MX: 'es',
  MD: 'ro', MC: 'fr', MN: 'mn', ME: 'sr', MS: 'en', MA: 'ar', MZ: 'pt', MM: 'my', NA: 'en',
  NR: 'en', NP: 'ne', NL: 'nl', NC: 'fr', NZ: 'en', NI: 'es', NE: 'fr', NG: 'en', KP: 'ko',
  MK: 'mk', MP: 'en', NO: 'no', OM: 'ar', PK: 'ur', PW: 'en', PS: 'ar', PA: 'es', PG: 'en',
  PY: 'es', PE: 'es', PH: 'fil', PN: 'en', PL: 'pl', PT: 'pt', PR: 'es', QA: 'ar', RO: 'ro',
  RU: 'ru', RW: 'rw', RE: 'fr', BL: 'fr', SH: 'en', MF: 'fr', PM: 'fr', WS: 'sm', SM: 'it',
  SA: 'ar', SN: 'fr', RS: 'sr', SC: 'fr', SL: 'en', SG: 'en', SX: 'nl', SK: 'sk', SI: 'sl',
  SB: 'en', SO: 'so', ZA: 'en', GS: 'en', KR: 'ko', SS: 'en', ES: 'es', LK: 'si', KN: 'en',
  LC: 'en', VC: 'en', SD: 'ar', SR: 'nl', SE: 'sv', CH: 'de', SY: 'ar', ST: 'pt', TW: 'zh-TW',
  TJ: 'tg', TZ: 'sw', TH: 'th', GM: 'en', TL: 'pt', TG: 'fr', TO: 'en', TT: 'en', TN: 'ar',
  TR: 'tr', TM: 'tk', TC: 'en', TV: 'en', UG: 'sw', UA: 'uk', AE: 'ar', GB: 'en', US: 'en',
  UY: 'es', VI: 'en', UZ: 'uz', VU: 'en', VA: 'it', VE: 'es', VN: 'vi', WF: 'fr', EH: 'ar',
  YE: 'ar', ZM: 'en', ZW: 'en',
};

const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'yi', 'dv']);

export function baseLocale(locale: string): string {
  const [lang] = locale.split('-');
  return lang || 'en';
}

export function normalizeLocale(raw: string | undefined): string {
  if (!raw) return 'en';
  const cleaned = raw.trim().replace('_', '-');
  if (!cleaned) return 'en';
  const [langRaw, regionRaw] = cleaned.split('-');
  const lang = (langRaw || 'en').toLowerCase();
  const region = regionRaw?.toUpperCase();
  if (lang === 'tl') return 'fil';
  if (lang === 'iw') return 'he';
  if (lang === 'nb' || lang === 'nn') return 'no';
  if (lang === 'zh' && region === 'TW') return 'zh-TW';
  if (lang === 'zh' && (region === 'HK' || region === 'MO')) return 'zh-HK';
  if (lang === 'zh') return 'zh';
  return lang;
}

export function localeFromPassport(iso2: string | undefined): string {
  if (!iso2) return 'en';
  return PASSPORT_LOCALE[iso2.toUpperCase()] || 'en';
}

export function localeFromBrowser(language?: string): string {
  const raw = language || (typeof navigator !== 'undefined' ? navigator.language : 'en');
  return normalizeLocale(raw);
}

export function isEnglish(locale: string): boolean {
  return baseLocale(locale) === 'en';
}

export function isRtl(locale: string): boolean {
  return RTL.has(baseLocale(locale));
}

export function htmlLang(locale: string): string {
  return locale === 'fil' ? 'fil' : locale;
}

export function languageName(locale: string, ofLocale = locale): string {
  try {
    const name = new Intl.DisplayNames([ofLocale], { type: 'language' }).of(baseLocale(locale));
    if (name) return name;
  } catch {
    /* ignore */
  }
  return locale;
}

export function passportLocaleEntries(): Array<[string, string]> {
  return Object.entries(PASSPORT_LOCALE);
}
