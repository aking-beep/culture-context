'use client';

import type { BriefResponse, TravelerProfile } from '@culture-context/domain';
import { COUNTRIES, countryName, findCountries } from '@/lib/countries';
import { downSources, glance, liveAlerts, readingCards, toGuideCards, tripFacts, type GuideCard } from '@/lib/present';
import { useEffect, useMemo, useRef, useState } from 'react';

const DESTINATIONS = [
  { iso2: 'JP', slug: 'japan', name: 'Japan', city: 'Tokyo', flag: '🇯🇵', blurb: 'Cities, trains, and temples' },
  { iso2: 'MX', slug: 'mexico', name: 'Mexico', city: 'Mexico City', flag: '🇲🇽', blurb: 'Food, beaches, and cities' },
  { iso2: 'FR', slug: 'france', name: 'France', city: 'Paris', flag: '🇫🇷', blurb: 'Cities, countryside, and food' },
  { iso2: 'TH', slug: 'thailand', name: 'Thailand', city: 'Bangkok', flag: '🇹🇭', blurb: 'Cities, islands, and temples' },
  { iso2: 'MA', slug: 'morocco', name: 'Morocco', city: 'Marrakesh', flag: '🇲🇦', blurb: 'Cities, markets, and mountains' },
] as const;

const ACTIVITIES = [
  { id: 'driving', label: 'I may drive a car' },
  { id: 'medication', label: 'I take prescription medicine' },
  { id: 'nightlife', label: 'I may go out at night' },
  { id: 'hiking', label: 'I may hike' },
  { id: 'filming', label: 'I take a lot of photos or video' },
  { id: 'drone', label: 'I may bring a drone' },
  { id: 'camping', label: 'I may camp' },
  { id: 'surfing', label: 'I may swim or surf' },
] as const;

const PURPOSES = [
  { id: 'tourism', label: 'Vacation' },
  { id: 'business', label: 'Work trip' },
  { id: 'study', label: 'Study' },
  { id: 'remote_work', label: 'Working from there' },
  { id: 'other', label: 'Something else' },
] as const;

const POPULAR_PASSPORTS = ['US', 'GB', 'CA', 'AU', 'IN', 'MX', 'DE', 'BR'] as const;

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
  purpose: (typeof PURPOSES)[number]['id'];
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
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
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

  const allCards = useMemo(() => (brief ? toGuideCards(brief) : []), [brief]);
  const cards = useMemo(() => readingCards(allCards), [allCards]);
  const facts = useMemo(() => tripFacts(allCards), [allCards]);
  const highlights = glance(cards);
  const alerts = liveAlerts(cards);
  const visible = cards.filter((card) => {
    if (card.section === 'Right now') return showAlerts || showExtra;
    if (!showExtra && card.priority === 'extra') return false;
    return true;
  });
  const extraCount = cards.filter((card) => card.priority === 'extra').length;
  const destination = DESTINATIONS.find((item) => item.slug === form.destination_slug);
  const missing = brief ? downSources(brief) : [];
  const stepIndex = step === 'where' ? 1 : step === 'who' ? 2 : 3;

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
      if (!response.ok) throw new Error(data.error || 'We could not load your notes.');
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
      setError(err instanceof Error ? err.message : 'We could not load your notes. Please try again.');
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

  const grouped = new Map<string, GuideCard[]>();
  for (const card of visible) {
    const list = grouped.get(card.section) ?? [];
    list.push(card);
    grouped.set(card.section, list);
  }

  return (
    <>
      <a className="skip" href="#main">Skip to the notes</a>
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
                Back
              </button>
            )}
            <button
              className="ghost"
              type="button"
              aria-pressed={largeType}
              onClick={() => setLargeType((value) => !value)}
            >
              {largeType ? 'Regular text' : 'Larger text'}
            </button>
            {step === 'guide' && (
              <button className="ghost" type="button" onClick={() => { setStep('where'); window.scrollTo({ top: 0 }); }}>
                Change trip
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="shell">
        {step !== 'guide' && (
          <form onSubmit={onSubmit}>
            <p className="progress" aria-live="polite">Question {stepIndex} of 3</p>

            {step === 'where' && (
              <>
                <div className="hero">
                  <h1 ref={headingRef} tabIndex={-1}>Where are you going?</h1>
                  <p>Tap one country. That is the only choice you need to make on this page.</p>
                </div>

                {saved && (
                  <button
                    type="button"
                    className="resume"
                    onClick={() => { setStep('guide'); window.scrollTo({ top: 0 }); }}
                  >
                    <b>Open your last notes</b>
                    <span>You already have notes for {saved.destination}.</span>
                  </button>
                )}

                <div className="choices places" role="group" aria-label="Country">
                  {DESTINATIONS.map((item) => (
                    <button
                      type="button"
                      className="choice place"
                      key={item.slug}
                      aria-pressed={form.destination_slug === item.slug}
                      onClick={() => setForm((current) => ({
                        ...current,
                        destination_country: item.iso2,
                        destination_slug: item.slug,
                        city: item.city,
                      }))}
                    >
                      <span className="flag" aria-hidden="true">{item.flag}</span>
                      <span>
                        <b>{item.name}</b>
                        <span>{item.blurb}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="dock">
                  <button className="primary" type="submit" disabled={!form.destination_slug}>
                    Next: where are you from?
                  </button>
                </div>
              </>
            )}

            {step === 'who' && (
              <>
                <div className="hero">
                  <h1 ref={headingRef} tabIndex={-1}>What country is on your passport?</h1>
                  <p>This helps us compare home and {destination?.name || 'your destination'}. It does not decide if you can enter.</p>
                </div>
                <CountryPicker
                  value={form.nationality}
                  onChange={(iso2) => setForm((current) => ({
                    ...current,
                    nationality: iso2,
                    residence_country: current.sameHome ? iso2 : current.residence_country,
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
                  I live in the same country
                </label>
                {!form.sameHome && (
                  <div className="nested">
                    <h2 className="subhead">Where do you live now?</h2>
                    <CountryPicker
                      value={form.residence_country}
                      onChange={(iso2) => setForm({ ...form, residence_country: iso2 })}
                    />
                  </div>
                )}
                <div className="dock">
                  <button className="primary" type="submit" disabled={!form.nationality || (!form.sameHome && !form.residence_country)}>
                    Next: what will you do?
                  </button>
                </div>
              </>
            )}

            {step === 'what' && !pending && (
              <>
                <div className="hero">
                  <h1 ref={headingRef} tabIndex={-1}>What will you do in {destination?.name || 'this country'}?</h1>
                  <p>Pick the kind of trip. Then tap anything else that is true. Skip what does not apply.</p>
                </div>
                <h2 className="subhead">Kind of trip</h2>
                <div className="choices" role="group" aria-label="Trip purpose">
                  {PURPOSES.map((item) => (
                    <button type="button" className="choice" key={item.id} aria-pressed={form.purpose === item.id} onClick={() => setForm({ ...form, purpose: item.id })}>
                      <b>{item.label}</b>
                    </button>
                  ))}
                </div>
                <h2 className="subhead">Anything else to look up?</h2>
                <p className="hint">Optional. Tap every line that is true.</p>
                <div className="choices" role="group" aria-label="Activities">
                  {ACTIVITIES.map((item) => {
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
                        <b>{item.label}</b>
                      </button>
                    );
                  })}
                </div>
                <div className="dock">
                  {error && <div className="banner warn" role="alert"><p>{error}</p></div>}
                  <button className="primary" type="submit" disabled={pending}>
                    {pending ? `Looking up notes for ${destination?.name}…` : `Show my notes for ${destination?.name}`}
                  </button>
                </div>
              </>
            )}
            {step === 'what' && pending && (
              <div className="loading" aria-live="polite">
                <p>Looking up official notes for {destination?.name}. This can take a few seconds. Please wait.</p>
              </div>
            )}
          </form>
        )}

        {step === 'guide' && brief && !pending && (
          <>
            <div className="hero">
              <h1 ref={headingRef} tabIndex={-1}>Your notes for {brief.destination_name || destination?.name}</h1>
              <p className="trip-line">
                {countryName(form.nationality) ? `From ${countryName(form.nationality)}` : 'From your passport country'}
                {form.city ? ` · visiting ${form.city}` : ''}
                {` · ${PURPOSES.find((item) => item.id === form.purpose)?.label || 'Trip'}`}
              </p>
              <p>Short notes from official sources. Easy to read. Not a visa decision or legal advice.</p>
            </div>

            {facts.length > 0 && (
              <section className="facts" aria-label="Quick facts">
                {facts.map((fact) => (
                  <div className="fact" key={fact.label}>
                    <span>{fact.label}</span>
                    <b>{fact.value}</b>
                  </div>
                ))}
              </section>
            )}

            {missing.length > 0 && (
              <div className="banner warn" role="status">
                <p>We could not load {missing.join(' and ')} just now. We did not fill the gap with guesses.</p>
              </div>
            )}

            {cards.length === 0 && (
              <div className="banner warn" role="status">
                <p>We could not find official notes for this trip. We did not invent any.</p>
              </div>
            )}

            {alerts.length > 0 && (
              <div className="banner warn" role="status">
                <p>
                  There {alerts.length === 1 ? 'is a current alert' : `are ${alerts.length} current alerts`} listed for this country.
                  Check local news as well.
                </p>
                {!showAlerts && (
                  <button className="ghost" type="button" onClick={() => setShowAlerts(true)}>
                    Read the current alerts
                  </button>
                )}
              </div>
            )}

            {highlights.length > 0 && (
              <section className="glance">
                <h2>Start here</h2>
                <p className="hint">The few things most people should read first. Tap a line to jump to it.</p>
                <ol>
                  {highlights.map((item) => (
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
                    onToggle={() => setOpen((current) => ({ ...current, [card.id]: !current[card.id] }))}
                  />
                ))}
              </section>
            ))}

            {extraCount > 0 && !showExtra && (
              <button className="ghost wide" type="button" onClick={() => setShowExtra(true)}>
                Show {extraCount} extra background notes
              </button>
            )}

            <p className="footer-note">
              UK travel advice is written mainly for British travelers. Some entry rules may be different for you.
              For anything high-stakes, open the official page on the card and, if needed, ask the destination’s embassy.
              Culture Context does not replace that.
            </p>
          </>
        )}
      </main>
    </>
  );
}

function CountryPicker({ value, onChange }: { value: string; onChange: (iso2: string) => void }) {
  const [query, setQuery] = useState('');
  const matches = findCountries(query);
  const selected = value ? countryName(value) : '';
  const popular: string[] = POPULAR_PASSPORTS.filter((iso2) => COUNTRIES.some((country) => country.iso2 === iso2));
  const showSelected = Boolean(value && !popular.includes(value));

  return (
    <div className="picker">
      <div className="choices places" role="group" aria-label="Popular passport countries">
        {showSelected && (
          <button type="button" className="choice" aria-pressed="true" onClick={() => onChange(value)}>
            <b>{selected}</b>
          </button>
        )}
        {popular.map((iso2) => (
          <button type="button" className="choice" key={iso2} aria-pressed={value === iso2} onClick={() => { onChange(iso2); setQuery(''); }}>
            <b>{countryName(iso2)}</b>
          </button>
        ))}
      </div>
      <label className="field-label">Find another country
        <input
          className="field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a country name"
          autoComplete="country-name"
        />
      </label>
      {query.trim() && (
        <div className="choices" role="listbox" aria-label="Country matches">
          {matches.map((country) => (
            <button
              type="button"
              className="choice"
              key={country.iso2}
              aria-pressed={value === country.iso2}
              onClick={() => { onChange(country.iso2); setQuery(''); }}
            >
              <b>{country.name}</b>
            </button>
          ))}
          {matches.length === 0 && <p className="hint">No country matches “{query}”.</p>}
        </div>
      )}
    </div>
  );
}

function GuideCardView({ card, expanded, onToggle }: { card: GuideCard; expanded: boolean; onToggle: () => void }) {
  const long = card.paragraphs.length > 1 || (card.paragraphs[0]?.length || 0) > 220;
  const preview = expanded ? card.paragraphs : card.paragraphs.slice(0, 1);
  const label = card.priority === 'need' ? 'Need to know' : card.priority === 'useful' ? 'Good to know' : 'Background';
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
          <button type="button" onClick={onToggle}>{expanded ? 'Show less' : 'Read more'}</button>
        )}
        <a href={card.url} target="_blank" rel="noreferrer">Open official page</a>
      </div>
    </article>
  );
}
