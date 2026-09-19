'use client';

import type { BriefResponse, TravelerProfile } from '@culture-context/domain';
import {
  POPULAR_DESTINATIONS,
  POPULAR_PASSPORTS,
  countryByIso,
  displayCountryName,
  findCountries,
  flagEmoji,
  type WorldCountry,
} from '@/lib/countries';
import {
  englishCatalog,
  hasUiDictionary,
  htmlLang,
  isEnglish,
  isRtl,
  languageName,
  localeFromBrowser,
  localeFromPassport,
  setMessageOverlay,
  t,
  type MessageKey,
  type Messages,
} from '@/lib/i18n';
import {
  applyTextMap,
  downSources,
  glance,
  liveAlerts,
  localizeCards,
  localizeFacts,
  readingCards,
  toGuideCards,
  tripFacts,
  type GuideCard,
} from '@/lib/present';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ACTIVITY_KEYS = [
  { id: 'driving', key: 'actDriving' },
  { id: 'medication', key: 'actMedication' },
  { id: 'nightlife', key: 'actNightlife' },
  { id: 'hiking', key: 'actHiking' },
  { id: 'filming', key: 'actFilming' },
  { id: 'drone', key: 'actDrone' },
  { id: 'camping', key: 'actCamping' },
  { id: 'surfing', key: 'actSurfing' },
] as const;

const PURPOSE_KEYS = [
  { id: 'tourism', key: 'purposeTourism' },
  { id: 'business', key: 'purposeBusiness' },
  { id: 'study', key: 'purposeStudy' },
  { id: 'remote_work', key: 'purposeRemote' },
  { id: 'other', key: 'purposeOther' },
] as const;

const STORAGE_BRIEF = 'culture-context:last-brief';
const STORAGE_PROFILE = 'culture-context:last-profile';
const STORAGE_TYPE = 'culture-context:large-type';

type Step = 'where' | 'who' | 'what' | 'guide';

type FormState = {
  nationality: string;
  residence_country: string;
  sameHome: boolean;
  destination_country: string;
  destination_slug: string;
  city: string;
  purpose: (typeof PURPOSE_KEYS)[number]['id'];
  activities: string[];
};

const INITIAL: FormState = {
  nationality: '',
  residence_country: '',
  sameHome: true,
  destination_country: '',
  destination_slug: '',
  city: '',
  purpose: 'tourism',
  activities: [],
};

async function requestTranslations(locale: string, texts: string[]): Promise<string[]> {
  if (isEnglish(locale) || texts.length === 0) return texts;
  const out = texts.slice();
  for (let index = 0; index < texts.length; index += 20) {
    const slice = texts.slice(index, index + 20);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale, texts: slice }),
      });
      if (!response.ok) continue;
      const data = await response.json() as { translations?: string[] };
      slice.forEach((_, offset) => {
        const next = data.translations?.[offset];
        if (next) out[index + offset] = next;
      });
    } catch {
      /* keep original text */
    }
  }
  return out;
}

export function BriefApp() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const [step, setStep] = useState<Step>('where');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showExtra, setShowExtra] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [largeType, setLargeType] = useState(false);
  const [saved, setSaved] = useState<{ destination: string } | null>(null);
  const [browserLocale, setBrowserLocale] = useState('en');
  const [overlayTick, setOverlayTick] = useState(0);
  const [textMap, setTextMap] = useState<Map<string, string> | null>(null);
  const [translating, setTranslating] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const locale = form.nationality ? localeFromPassport(form.nationality) : browserLocale;
  const tr = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => t(locale, key, vars),
    [locale, overlayTick],
  );

  useEffect(() => {
    setBrowserLocale(localeFromBrowser());
    try {
      setLargeType(localStorage.getItem(STORAGE_TYPE) === '1');
      const savedProfile = localStorage.getItem(STORAGE_PROFILE);
      const savedBrief = localStorage.getItem(STORAGE_BRIEF);
      if (savedProfile) setForm({ ...INITIAL, ...JSON.parse(savedProfile) });
      if (savedBrief) {
        const data = JSON.parse(savedBrief) as BriefResponse;
        setBrief(data);
        setSaved({ destination: data.destination_name || 'your last trip' });
      }
    } catch {
      /* ignore broken local data */
    }
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-type', largeType);
    try { localStorage.setItem(STORAGE_TYPE, largeType ? '1' : '0'); } catch { /* ignore */ }
  }, [largeType]);

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
    document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
  }, [locale]);

  useEffect(() => {
    if (isEnglish(locale) || hasUiDictionary(locale)) return;
    const cacheKey = `culture-context:ui:${locale}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setMessageOverlay(locale, JSON.parse(cached) as Partial<Messages>);
        setOverlayTick((value) => value + 1);
        return;
      }
    } catch {
      /* ignore */
    }
    let cancelled = false;
    const catalog = englishCatalog();
    void requestTranslations(locale, catalog.map(([, value]) => value)).then((translated) => {
      if (cancelled) return;
      const partial: Partial<Messages> = {};
      catalog.forEach(([key], index) => {
        const next = translated[index];
        if (next) partial[key] = next;
      });
      setMessageOverlay(locale, partial);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(partial)); } catch { /* ignore */ }
      setOverlayTick((value) => value + 1);
    });
    return () => { cancelled = true; };
  }, [locale]);

  const allCards = useMemo(() => (brief ? toGuideCards(brief) : []), [brief]);
  const cards = useMemo(() => readingCards(allCards), [allCards]);
  const englishFacts = useMemo(() => tripFacts(allCards), [allCards]);
  const facts = useMemo(() => {
    const localized = localizeFacts(englishFacts, tr);
    if (!textMap) return localized;
    return localized.map((fact, index) => {
      const original = englishFacts[index]?.value ?? '';
      if (fact.value !== original) return fact;
      return { ...fact, value: textMap.get(original) ?? fact.value };
    });
  }, [englishFacts, tr, textMap]);
  const highlights = glance(cards);
  const alerts = liveAlerts(cards);
  const visible = cards.filter((card) => {
    if (card.section === 'Right now') return showAlerts || showExtra;
    if (!showExtra && card.priority === 'extra') return false;
    return true;
  });
  const extraCount = cards.filter((card) => card.priority === 'extra').length;
  const destination = countryByIso(form.destination_country);
  const destinationLabel = displayCountryName(form.destination_country, locale) || destination?.name || '';
  const missing = brief ? downSources(brief) : [];
  const stepIndex = step === 'where' ? 1 : step === 'who' ? 2 : 3;

  useEffect(() => {
    if (!brief || isEnglish(locale)) {
      setTextMap(null);
      setTranslating(false);
      return;
    }
    const sourceCards = toGuideCards(brief);
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const card of sourceCards) {
      for (const part of [...card.paragraphs, card.blurb]) {
        if (part && !seen.has(part)) {
          seen.add(part);
          unique.push(part);
        }
      }
    }
    for (const fact of tripFacts(sourceCards)) {
      if (fact.value && !seen.has(fact.value)) {
        seen.add(fact.value);
        unique.push(fact.value);
      }
    }
    let cancelled = false;
    setTranslating(true);
    void requestTranslations(locale, unique).then((translated) => {
      if (cancelled) return;
      const map = new Map<string, string>();
      unique.forEach((source, index) => {
        const next = translated[index];
        if (next && next !== source) map.set(source, next);
      });
      setTextMap(map.size ? map : null);
      setTranslating(false);
    });
    return () => { cancelled = true; };
  }, [brief, locale]);

  async function loadNotes() {
    if (!form.destination_slug || !form.nationality) return;
    setPending(true);
    setError(null);
    const payload: TravelerProfile = {
      nationality: form.nationality,
      residence_country: form.sameHome ? form.nationality : form.residence_country || form.nationality,
      destination_country: form.destination_country,
      destination_slug: form.destination_slug,
      city: form.city || undefined,
      purpose: form.purpose,
      activities: form.activities,
    };
    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr('loadErrorShort'));
      setBrief(data);
      setStep('guide');
      setShowExtra(false);
      setShowAlerts(false);
      setOpen({});
      setSaved(null);
      localStorage.setItem(STORAGE_BRIEF, JSON.stringify(data));
      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(form));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('loadError'));
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step === 'where' && form.destination_slug) setStep('who');
    else if (step === 'who' && form.nationality) setStep('what');
    else if (step === 'what') void loadNotes();
  }

  const shown = localizeCards(visible, tr).map((card) => applyTextMap(card, textMap));
  const shownHighlights = localizeCards(highlights, tr).map((card) => applyTextMap(card, textMap));

  const grouped = new Map<string, GuideCard[]>();
  for (const card of shown) {
    const list = grouped.get(card.section) ?? [];
    list.push(card);
    grouped.set(card.section, list);
  }

  const missingLabel = missing.map((item) => tr(item === 'no_page' ? 'missingNoPage' : 'missingAdvice')).join(` ${tr('andJoin')} `);
  const purposeLabel = PURPOSE_KEYS.find((item) => item.id === form.purpose);

  return (
    <>
      <a className="skip" href="#main">{tr('skip')}</a>
      <header className="top">
        <div className="top-inner">
          <div className="brand">Culture Context</div>
          <div className="top-actions">
            {step !== 'guide' && step !== 'where' && (
              <button
                className="ghost"
                type="button"
                onClick={() => setStep(step === 'what' ? 'who' : 'where')}
              >
                {tr('back')}
              </button>
            )}
            <button
              className="ghost"
              type="button"
              aria-pressed={largeType}
              onClick={() => setLargeType((value) => !value)}
            >
              {largeType ? tr('smallerType') : tr('biggerType')}
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="shell">
        {step !== 'guide' && (
          <form onSubmit={onSubmit}>
            <p className="progress" aria-live="polite">{tr('questionOf', { n: stepIndex })}</p>

            {step === 'where' && (
              <>
                <div className="hero">
                  <h1 ref={headingRef} tabIndex={-1}>{tr('whereTitle')}</h1>
                  <p>{tr('whereHint')}</p>
                </div>

                {saved && (
                  <button
                    type="button"
                    className="resume"
                    onClick={() => { setStep('guide'); window.scrollTo({ top: 0 }); }}
                  >
                    <b>{tr('resumeTitle')}</b>
                    <span>{tr('resumeHint', { destination: saved.destination })}</span>
                  </button>
                )}

                <CountryPicker
                  value={form.destination_country}
                  locale={locale}
                  popular={POPULAR_DESTINATIONS}
                  popularLabel={tr('popularTrips')}
                  searchLabel={tr('findAnyCountry')}
                  searchPlaceholder={tr('countryPlaceholder')}
                  noMatch={tr}
                  onChange={(country) => setForm((current) => ({
                    ...current,
                    destination_country: country.iso2,
                    destination_slug: country.slug,
                    city: country.capital,
                  }))}
                />

                <div className="dock">
                  <button className="primary" type="submit" disabled={!form.destination_slug}>
                    {tr('nextFrom')}
                  </button>
                </div>
              </>
            )}

            {step === 'who' && (
              <>
                <div className="hero">
                  <h1 ref={headingRef} tabIndex={-1}>{tr('whoTitle')}</h1>
                  <p>{tr('whoHint', { destination: destinationLabel || tr('fromPassportFallback') })}</p>
                </div>
                <CountryPicker
                  value={form.nationality}
                  locale={locale}
                  popular={POPULAR_PASSPORTS}
                  popularLabel={tr('popularPassports')}
                  searchLabel={tr('findPassport')}
                  searchPlaceholder={tr('typeCountry')}
                  noMatch={tr}
                  onChange={(country) => setForm((current) => ({
                    ...current,
                    nationality: country.iso2,
                    residence_country: current.sameHome ? country.iso2 : current.residence_country,
                  }))}
                />
                <label className="same">
                  <input
                    type="checkbox"
                    checked={form.sameHome}
                    onChange={(event) => setForm({
                      ...form,
                      sameHome: event.target.checked,
                      residence_country: event.target.checked ? form.nationality : form.residence_country,
                    })}
                  />
                  {tr('sameHome')}
                </label>
                {!form.sameHome && (
                  <div className="nested">
                    <h2 className="subhead">{tr('liveTitle')}</h2>
                    <CountryPicker
                      value={form.residence_country}
                      locale={locale}
                      popular={POPULAR_PASSPORTS}
                      popularLabel={tr('popularHome')}
                      searchLabel={tr('findHome')}
                      searchPlaceholder={tr('typeCountry')}
                      noMatch={tr}
                      onChange={(country) => setForm({ ...form, residence_country: country.iso2 })}
                    />
                  </div>
                )}
                <div className="dock">
                  <button className="primary" type="submit" disabled={!form.nationality || (!form.sameHome && !form.residence_country)}>
                    {tr('nextWhat')}
                  </button>
                </div>
              </>
            )}

            {step === 'what' && !pending && (
              <>
                <div className="hero">
                  <h1 ref={headingRef} tabIndex={-1}>{tr('whatTitle', { destination: destinationLabel || '' })}</h1>
                  <p>{tr('whatHint')}</p>
                </div>
                <h2 className="subhead">{tr('kindOfTrip')}</h2>
                <div className="choices" role="group" aria-label={tr('kindOfTrip')}>
                  {PURPOSE_KEYS.map((item) => (
                    <button type="button" className="choice" key={item.id} aria-pressed={form.purpose === item.id} onClick={() => setForm({ ...form, purpose: item.id })}>
                      <b>{tr(item.key)}</b>
                    </button>
                  ))}
                </div>
                <h2 className="subhead">{tr('anythingElse')}</h2>
                <p className="hint">{tr('optionalHint')}</p>
                <div className="choices" role="group" aria-label={tr('anythingElse')}>
                  {ACTIVITY_KEYS.map((item) => {
                    const on = form.activities.includes(item.id);
                    return (
                      <button
                        type="button"
                        className="check"
                        key={item.id}
                        aria-pressed={on}
                        onClick={() => setForm({
                          ...form,
                          activities: on ? form.activities.filter((value) => value !== item.id) : [...form.activities, item.id],
                        })}
                      >
                        <b>{tr(item.key)}</b>
                      </button>
                    );
                  })}
                </div>
                <div className="dock">
                  {error && <div className="banner warn" role="alert"><p>{error}</p></div>}
                  <button className="primary" type="submit" disabled={pending}>
                    {pending ? tr('lookingUp', { destination: destinationLabel }) : tr('showNotes', { destination: destinationLabel })}
                  </button>
                </div>
              </>
            )}
            {step === 'what' && pending && (
              <div className="loading" aria-live="polite">
                <p>{tr('lookingUpLong', { destination: destinationLabel })}</p>
              </div>
            )}
          </form>
        )}

        {step === 'guide' && brief && !pending && (
          <>
            <div className="hero">
              <h1 ref={headingRef} tabIndex={-1}>{tr('notesTitle', { destination: destinationLabel || brief.destination_name })}</h1>
              <p className="trip-line">
                {form.nationality ? tr('fromPassport', { country: displayCountryName(form.nationality, locale) }) : tr('fromPassportFallback')}
                {form.city ? ` · ${tr('visiting', { city: form.city })}` : ''}
                {` · ${purposeLabel ? tr(purposeLabel.key) : tr('purposeOther')}`}
              </p>
              <p>{tr('notesIntro')}</p>
              {!isEnglish(locale) && (
                <p className="language-banner">{tr('languageBanner', {
                  language: languageName(locale, locale),
                  country: displayCountryName(form.nationality, locale),
                })}</p>
              )}
              <button className="ghost" type="button" onClick={() => { setStep('where'); window.scrollTo({ top: 0 }); }}>
                {tr('changeTrip')}
              </button>
            </div>

            {facts.length > 0 && (
              <section className="facts" aria-label={tr('factsLabel')}>
                {facts.map((fact) => (
                  <div className="fact" key={fact.label}>
                    <span>{fact.label}</span>
                    <b>{fact.value}</b>
                  </div>
                ))}
              </section>
            )}

            {translating && !isEnglish(locale) && (
              <div className="banner ok" role="status">
                <p>{tr('translating')}</p>
              </div>
            )}

            {textMap && !translating && !isEnglish(locale) && (
              <div className="banner ok" role="status">
                <p>{tr('translationNote')}</p>
              </div>
            )}

            {missing.length > 0 && (
              <div className="banner warn" role="status">
                <p>{tr('missingSources', { sources: missingLabel })}</p>
              </div>
            )}

            {cards.length === 0 && (
              <div className="banner warn" role="status">
                <p>{tr('noNotes')}</p>
              </div>
            )}

            {alerts.length > 0 && (
              <div className="banner warn" role="status">
                <p>{alerts.length === 1 ? tr('alertOne') : tr('alertMany', { n: alerts.length })}</p>
                {!showAlerts && (
                  <button className="ghost" type="button" onClick={() => setShowAlerts(true)}>
                    {tr('readAlerts')}
                  </button>
                )}
              </div>
            )}

            {shownHighlights.length > 0 && (
              <section className="glance">
                <h2>{tr('startHere')}</h2>
                <p className="hint">{tr('startHint')}</p>
                <ol>
                  {shownHighlights.map((item) => (
                    <li key={item.id}>
                      <a href={`#note-${item.id}`}>
                        <strong>{item.title}</strong>
                        <span>{item.blurb}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {[...grouped.entries()].map(([section, items]) => (
              <section key={section} aria-labelledby={`h-${section}`}>
                <h2 className="section" id={`h-${section}`}>{section}</h2>
                {items.map((card) => (
                  <GuideCardView
                    key={card.id}
                    card={card}
                    expanded={!!open[card.id]}
                    labels={{
                      need: tr('needToKnow'),
                      useful: tr('goodToKnow'),
                      extra: tr('background'),
                      less: tr('showLess'),
                      more: tr('readMore'),
                      official: tr('openOfficial'),
                    }}
                    onToggle={() => setOpen((current) => ({ ...current, [card.id]: !current[card.id] }))}
                  />
                ))}
              </section>
            ))}

            {extraCount > 0 && !showExtra && (
              <button className="ghost wide" type="button" onClick={() => setShowExtra(true)}>
                {tr('extraNotes', { n: extraCount })}
              </button>
            )}

            <p className="footer-note">{tr('footer')}</p>
          </>
        )}
      </main>
    </>
  );
}

function CountryPicker({
  value,
  locale,
  onChange,
  popular,
  searchLabel,
  searchPlaceholder,
  popularLabel,
  noMatch,
}: {
  value: string;
  locale: string;
  onChange: (country: WorldCountry) => void;
  popular: readonly string[];
  popularLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  noMatch: (key: MessageKey, vars?: Record<string, string | number>) => string;
}) {
  const [query, setQuery] = useState('');
  const matches = findCountries(query, locale);
  const selected = countryByIso(value);
  const popularCountries = popular.map((iso2) => countryByIso(iso2)).filter((item): item is WorldCountry => !!item);
  const showSelected = Boolean(selected && !popular.includes(selected.iso2));

  function choose(country: WorldCountry) {
    onChange(country);
    setQuery('');
  }

  function label(country: WorldCountry) {
    return displayCountryName(country.iso2, locale) || country.name;
  }

  return (
    <div className="picker">
      <label className="field-label">{searchLabel}
        <input
          className="field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="country-name"
          autoCapitalize="words"
        />
      </label>
      {query.trim() && (
        <div className="choices" role="listbox" aria-label={noMatch('countryMatches')}>
          {matches.map((country) => (
            <button
              type="button"
              className="choice place"
              key={country.iso2}
              aria-pressed={value === country.iso2}
              onClick={() => choose(country)}
            >
              <span className="flag" aria-hidden="true">{flagEmoji(country.iso2)}</span>
              <span>
                <b>{label(country)}</b>
                {country.capital ? <span>{country.capital}</span> : null}
              </span>
            </button>
          ))}
          {matches.length === 0 && <p className="hint">{noMatch('noMatch', { query })}</p>}
        </div>
      )}
      {!query.trim() && (
        <>
          <h2 className="subhead">{popularLabel}</h2>
          <div className="choices places" role="group" aria-label={popularLabel}>
            {showSelected && selected && (
              <button type="button" className="choice place" aria-pressed="true" onClick={() => choose(selected)}>
                <span className="flag" aria-hidden="true">{flagEmoji(selected.iso2)}</span>
                <span>
                  <b>{label(selected)}</b>
                  {selected.capital ? <span>{selected.capital}</span> : null}
                </span>
              </button>
            )}
            {popularCountries.map((country) => (
              <button
                type="button"
                className="choice place"
                key={country.iso2}
                aria-pressed={value === country.iso2}
                onClick={() => choose(country)}
              >
                <span className="flag" aria-hidden="true">{flagEmoji(country.iso2)}</span>
                <span>
                  <b>{label(country)}</b>
                  {country.capital ? <span>{country.capital}</span> : null}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GuideCardView({
  card,
  expanded,
  onToggle,
  labels,
}: {
  card: GuideCard;
  expanded: boolean;
  onToggle: () => void;
  labels: { need: string; useful: string; extra: string; less: string; more: string; official: string };
}) {
  const long = card.paragraphs.length > 1 || (card.paragraphs[0]?.length || 0) > 220;
  const preview = expanded ? card.paragraphs : card.paragraphs.slice(0, 1);
  const label = card.priority === 'need' ? labels.need : card.priority === 'useful' ? labels.useful : labels.extra;
  return (
    <article className={`card ${card.priority}${expanded ? ' expanded' : ''}`} id={`note-${card.id}`}>
      <span className="badge">{label}</span>
      <h3>{card.title}</h3>
      {preview.map((paragraph, index) => <p key={`${card.id}-${index}`}>{paragraph}</p>)}
      {long && !expanded && card.paragraphs.length > 1 && (
        <div className="print-only">
          {card.paragraphs.slice(1).map((paragraph, index) => <p key={`${card.id}-print-${index}`}>{paragraph}</p>)}
        </div>
      )}
      {card.whyYou && <p className="why">{card.whyYou}</p>}
      <p className="source-line">{card.sourceName} · {card.checked}</p>
      <p className="source-kind">{card.sourceKind}</p>
      <div className="links">
        {long && (
          <button type="button" onClick={onToggle}>{expanded ? labels.less : labels.more}</button>
        )}
        <a href={card.url} target="_blank" rel="noreferrer">{labels.official}</a>
      </div>
    </article>
  );
}
