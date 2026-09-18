'use client';

import { categoryLabels, ruleLabels, sourceClassLabels } from '@culture-context/ui';
import type { BriefItem, BriefResponse, TravelerProfile } from '@culture-context/domain';
import { useEffect, useMemo, useState } from 'react';

const DESTINATIONS = [
  { iso2: 'JP', slug: 'japan', name: 'Japan', city: 'Tokyo' },
  { iso2: 'MX', slug: 'mexico', name: 'Mexico', city: 'Mexico City' },
  { iso2: 'FR', slug: 'france', name: 'France', city: 'Paris' },
  { iso2: 'TH', slug: 'thailand', name: 'Thailand', city: 'Bangkok' },
  { iso2: 'MA', slug: 'morocco', name: 'Morocco', city: 'Marrakesh' },
] as const;

const ACTIVITIES = ['driving', 'medication', 'drone', 'filming', 'nightlife', 'hiking', 'climbing', 'surfing', 'camping'];
const PURPOSES = ['tourism', 'remote_work', 'business', 'study', 'other'] as const;
const STORAGE_BRIEF = 'culture-context:last-brief';
const STORAGE_PROFILE = 'culture-context:last-profile';

type FormState = {
  nationality: string;
  residence_country: string;
  destination_country: string;
  destination_slug: string;
  city: string;
  start_date: string;
  end_date: string;
  purpose: (typeof PURPOSES)[number];
  activities: string[];
};

const INITIAL: FormState = {
  nationality: 'US',
  residence_country: 'US',
  destination_country: 'JP',
  destination_slug: 'japan',
  city: 'Tokyo',
  start_date: '',
  end_date: '',
  purpose: 'tourism',
  activities: ['driving', 'filming'],
};

export function BriefApp() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_PROFILE);
    const savedBrief = localStorage.getItem(STORAGE_BRIEF);
    if (savedProfile) {
      try { setForm({ ...INITIAL, ...JSON.parse(savedProfile) }); } catch { /* ignore */ }
    }
    if (savedBrief) {
      try { setBrief(JSON.parse(savedBrief)); } catch { /* ignore */ }
    }
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, BriefItem[]>();
    for (const item of brief?.items ?? []) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [brief]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setExplanations({});
    const payload: TravelerProfile = {
      nationality: form.nationality,
      residence_country: form.residence_country || undefined,
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
      if (!response.ok) throw new Error(data.error || 'Could not build a brief');
      setBrief(data);
      localStorage.setItem(STORAGE_BRIEF, JSON.stringify(data));
      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build a brief');
    } finally {
      setPending(false);
    }
  }

  async function explain(item: BriefItem) {
    if (!brief?.explain_enabled) return;
    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [item] }),
    });
    if (response.status === 404) return;
    const data = await response.json();
    const text = data.explanations?.[0]?.text;
    if (text) setExplanations((current) => ({ ...current, [item.id]: text }));
  }

  return (
    <main className="shell">
      <header className="hero">
        <div className="kicker">Culture Context · provenance first</div>
        <h1>What you may not know you need to know.</h1>
        <p className="lede">
          A destination brief built only from cited records. Advisories stay advisories.
          Missing sources stay missing. This is not legal advice.
        </p>
      </header>

      <div className="layout">
        <form className="card" onSubmit={onSubmit}>
          <div className="stamp">Partial coverage</div>
          <h2 style={{ paddingRight: 92 }}>Traveler</h2>
          <div className="destinations" role="group" aria-label="Launch destinations">
            {DESTINATIONS.map((destination) => (
              <button
                type="button"
                className="dest"
                key={destination.slug}
                aria-pressed={form.destination_slug === destination.slug}
                onClick={() => setForm((current) => ({
                  ...current,
                  destination_country: destination.iso2,
                  destination_slug: destination.slug,
                  city: destination.city,
                }))}
              >
                <b>{destination.name}</b>
                <span>{destination.iso2} · {destination.city}</span>
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <label>Nationality
              <input className="field" maxLength={2} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value.toUpperCase() })} />
            </label>
            <label>Residence
              <input className="field" maxLength={2} value={form.residence_country} onChange={(e) => setForm({ ...form, residence_country: e.target.value.toUpperCase() })} />
            </label>
          </div>
          <label style={{ marginTop: 10 }}>City
            <input className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <div className="row" style={{ marginTop: 10 }}>
            <label>Start
              <input className="field" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </label>
            <label>End
              <input className="field" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </label>
          </div>
          <p className="section-title">Purpose</p>
          <div className="chips">
            {PURPOSES.map((purpose) => (
              <button type="button" key={purpose} className="chip" aria-pressed={form.purpose === purpose} onClick={() => setForm({ ...form, purpose })}>
                {purpose.replace('_', ' ')}
              </button>
            ))}
          </div>
          <p className="section-title">Activities</p>
          <div className="chips">
            {ACTIVITIES.map((activity) => {
              const on = form.activities.includes(activity);
              return (
                <button
                  type="button"
                  key={activity}
                  className="chip"
                  aria-pressed={on}
                  onClick={() => setForm({
                    ...form,
                    activities: on ? form.activities.filter((item) => item !== activity) : [...form.activities, activity],
                  })}
                >
                  {activity}
                </button>
              );
            })}
          </div>
          <button className="submit" type="submit" disabled={pending}>
            {pending ? 'Retrieving sources…' : 'Get sourced brief'}
          </button>
        </form>

        <section>
          {error && <p className="warn">{error}</p>}
          {!brief && !error && (
            <div className="card note">
              Enter who you are and where you are going. The brief will show source class, authority, retrieval time, and the canonical URL on every card.
            </div>
          )}
          {brief && (
            <>
              <div className="card">
                <div className="kicker">{brief.destination_name || brief.destination} · {brief.coverage} coverage</div>
                <h2>Sourced brief</h2>
                <p className="lede">{brief.disclaimer}</p>
                <div className="chips" style={{ marginTop: 12 }}>
                  {brief.source_statuses.map((status) => (
                    <span key={status.id} className={`pill ${status.status === 'ok' ? 'cultural_norm' : 'advisory'}`}>
                      {(status.authority.split('(')[0] ?? status.authority).trim()} · {status.status}
                    </span>
                  ))}
                </div>
              </div>
              {brief.warnings.map((warning) => <p className="note" key={warning} style={{ marginTop: 10 }}>{warning}</p>)}
              {brief.items.length === 0 && (
                <div className="card warn" style={{ marginTop: 12 }}>
                  We could not verify source records for this brief. No facts were invented to fill the gap.
                </div>
              )}
              {grouped.map(([category, items]) => (
                <div key={category}>
                  <div className="section-title">{categoryLabels[category] || category}</div>
                  {items.map((item) => (
                    <article className="card item" key={item.id} style={{ marginBottom: 12 }}>
                      <div className="meta">
                        <span className={`pill ${item.kind}`}>{ruleLabels[item.kind]}</span>
                        {item.relevance.filter((r) => r.startsWith('activity:')).map((r) => (
                          <span className="pill" key={r}>{r.replace('activity:', '')}</span>
                        ))}
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                      <div className="sources">
                        {item.sources.map((source) => (
                          <div className="source" key={source.id}>
                            <div><b>{source.authority}</b> · {sourceClassLabels[source.source_class]} · {source.jurisdiction}</div>
                            <div>Retrieved {new Date(source.retrieved_at).toUTCString()}{source.content_hash ? ` · ${source.content_hash.slice(0, 12)}` : ''}</div>
                            <a href={source.url} target="_blank" rel="noreferrer">Open canonical source</a>
                          </div>
                        ))}
                      </div>
                      {explanations[item.id] && (
                        <div className="explain">
                          <b>Explanation · not a source</b>
                          {explanations[item.id]}
                        </div>
                      )}
                      <div className="actions">
                        {brief.explain_enabled && (
                          <button type="button" className="linkish" onClick={() => explain(item)}>Explain this record</button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
