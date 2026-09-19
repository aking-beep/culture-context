'use client';

import type { BriefResponse, TravelerProfile } from '@culture-context/domain';
import { COUNTRIES, countryName } from '@/lib/countries';
import { downSources, glance, liveAlerts, toGuideCards, type GuideCard } from '@/lib/present';
import { useEffect, useMemo, useState } from 'react';

const DESTINATIONS = [
  { iso2: 'JP', slug: 'japan', name: 'Japan', city: 'Tokyo', blurb: 'Cities, trains, and temples' },
  { iso2: 'MX', slug: 'mexico', name: 'Mexico', city: 'Mexico City', blurb: 'Food, beaches, and cities' },
  { iso2: 'FR', slug: 'france', name: 'France', city: 'Paris', blurb: 'Cities, countryside, and food' },
  { iso2: 'TH', slug: 'thailand', name: 'Thailand', city: 'Bangkok', blurb: 'Cities, islands, and temples' },
  { iso2: 'MA', slug: 'morocco', name: 'Morocco', city: 'Marrakesh', blurb: 'Cities, markets, and mountains' },
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

const STORAGE_BRIEF = 'culture-context:last-brief';
const STORAGE_PROFILE = 'culture-context:last-profile';

type FormState = {
  nationality: string;
  residence_country: string;
  sameHome: boolean;
  destination_country: string;
  destination_slug: string;
  city: string;
  start_date: string;
  end_date: string;
  purpose: (typeof PURPOSES)[number]['id'];
  activities: string[];
};

const INITIAL: FormState = {
  nationality: 'US',
  residence_country: 'US',
  sameHome: true,
  destination_country: 'JP',
  destination_slug: 'japan',
  city: 'Tokyo',
  start_date: '',
  end_date: '',
  purpose: 'tourism',
  activities: [],
};

export function BriefApp() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const [screen, setScreen] = useState<'ask' | 'guide'>('ask');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_PROFILE);
    const savedBrief = localStorage.getItem(STORAGE_BRIEF);
    if (savedProfile) {
      try { setForm({ ...INITIAL, ...JSON.parse(savedProfile) }); } catch { /* ignore */ }
    }
    if (savedBrief) {
      try {
        setBrief(JSON.parse(savedBrief));
        setScreen('guide');
      } catch { /* ignore */ }
    }
  }, []);

  const cards = useMemo(() => (brief ? toGuideCards(brief) : []), [brief]);
  const highlights = glance(cards);
  const alerts = liveAlerts(cards);
  const visible = showExtra ? cards : cards.filter((card) => card.priority !== 'extra');
  const extraCount = cards.filter((card) => card.priority === 'extra').length;
  const destination = DESTINATIONS.find((item) => item.slug === form.destination_slug)?.name || form.destination_slug;
  const missing = brief ? downSources(brief) : [];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const payload: TravelerProfile = {
      nationality: form.nationality,
      residence_country: form.sameHome ? form.nationality : form.residence_country || form.nationality,
      destination_country: form.destination_country,
      destination_slug: form.destination_slug,
      city: form.city || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
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
      setScreen('guide');
      setShowExtra(false);
      setOpen({});
      localStorage.setItem(STORAGE_BRIEF, JSON.stringify(data));
      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(form));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not load your notes. Please try again.');
    } finally {
      setPending(false);
    }
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
          {screen === 'guide' && (
            <button className="ghost" type="button" onClick={() => { setScreen('ask'); window.scrollTo({ top: 0 }); }}>
              Change trip
            </button>
          )}
        </div>
      </header>

      <main id="main" className="shell">
        {screen === 'ask' && (
          <form onSubmit={onSubmit}>
            <div className="hero">
              <h1>What should you know before you go?</h1>
              <p>Answer three short questions. We will turn official travel notes into a simple reading list. We do not guess, and this is not legal advice.</p>
            </div>

            <section className="step">
              <h2>1. Where are you going?</h2>
              <p className="hint">Tap one country. You can add a city if you like.</p>
              <div className="choices places" role="group" aria-label="Country">
                {DESTINATIONS.map((item) => (
                  <button
                    type="button"
                    className="choice"
                    key={item.slug}
                    aria-pressed={form.destination_slug === item.slug}
                    onClick={() => setForm((current) => ({
                      ...current,
                      destination_country: item.iso2,
                      destination_slug: item.slug,
                      city: item.city,
                    }))}
                  >
                    <span>
                      <b>{item.name}</b>
                      <span>{item.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>
              <label className="field-label">City you will visit, if you know it
                <input className="field" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} autoComplete="address-level2" />
              </label>
              <div className="pair">
                <label className="field-label">First day, optional
                  <input className="field" type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
                </label>
                <label className="field-label">Last day, optional
                  <input className="field" type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
                </label>
              </div>
            </section>

            <section className="step">
              <h2>2. Where are you from?</h2>
              <p className="hint">Use the country on your passport. This helps us compare home and destination. It does not decide if you can enter.</p>
              <label className="field-label">Passport country
                <select className="field" value={form.nationality} onChange={(event) => setForm({
                  ...form,
                  nationality: event.target.value,
                  residence_country: form.sameHome ? event.target.value : form.residence_country,
                })}>
                  {COUNTRIES.map((country) => (
                    <option key={country.iso2} value={country.iso2}>{country.name}</option>
                  ))}
                </select>
              </label>
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
                <label className="field-label">Country where you live now
                  <select className="field" value={form.residence_country} onChange={(event) => setForm({ ...form, residence_country: event.target.value })}>
                    {COUNTRIES.map((country) => (
                      <option key={country.iso2} value={country.iso2}>{country.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </section>

            <section className="step">
              <h2>3. What will you do?</h2>
              <p className="hint">Tap every line that is true. Skip anything that does not apply.</p>
              <div className="choices" role="group" aria-label="Trip purpose">
                {PURPOSES.map((item) => (
                  <button type="button" className="choice" key={item.id} aria-pressed={form.purpose === item.id} onClick={() => setForm({ ...form, purpose: item.id })}>
                    <b>{item.label}</b>
                  </button>
                ))}
              </div>
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
            </section>

            <div className="dock">
              {error && <div className="banner warn" role="alert"><p>{error}</p></div>}
              <button className="primary" type="submit" disabled={pending}>
                {pending ? `Looking up notes for ${destination}…` : `Show my notes for ${destination}`}
              </button>
            </div>
          </form>
        )}

        {screen === 'guide' && pending && (
          <div className="loading" aria-live="polite">
            <p>Looking up official notes for {destination}. This can take a few seconds.</p>
          </div>
        )}

        {screen === 'guide' && brief && !pending && (
          <>
            <div className="hero">
              <h1>Your notes for {brief.destination_name || destination}</h1>
              <p>
                Written for someone from {countryName(form.nationality)}
                {form.city ? `, visiting ${form.city}` : ''}.
                These are official notes in plain language. They are not a visa decision or legal advice.
              </p>
            </div>

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
                  Read the “Right now” section below, then check local news.
                </p>
              </div>
            )}

            {highlights.length > 0 && (
              <section className="glance">
                <h2>Start here</h2>
                <p className="hint">The few things most people should read first. Tap a line to jump to it.</p>
                <ol>
                  {highlights.map((item) => (
                    <li key={item.id}><a href={`#note-${item.id}`}>{item.title}</a></li>
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
              <button className="ghost" type="button" onClick={() => setShowExtra(true)}>
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

function GuideCardView({ card, expanded, onToggle }: { card: GuideCard; expanded: boolean; onToggle: () => void }) {
  const long = card.paragraphs.length > 2 || card.preview.length > 280;
  const body = expanded ? card.paragraphs : card.paragraphs.slice(0, 2);
  const label = card.priority === 'need' ? 'Need to know' : card.priority === 'useful' ? 'Good to know' : 'Background';
  return (
    <article className={`card ${card.priority}`} id={`note-${card.id}`}>
      <span className="badge">{label}</span>
      <h3>{card.title}</h3>
      {body.map((paragraph, index) => <p key={`${card.id}-${index}`}>{paragraph}</p>)}
      {card.whyYou && <p className="why">{card.whyYou}</p>}
      <p className="source-line">{card.sourceName} · {card.checked}. {card.sourceKind}</p>
      <div className="links">
        {long && (
          <button type="button" onClick={onToggle}>{expanded ? 'Show less' : 'Read more'}</button>
        )}
        <a href={card.url} target="_blank" rel="noreferrer">Open official page</a>
      </div>
    </article>
  );
}
