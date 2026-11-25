'use client';

import { sourceClassLabels } from '@culture-context/ui';
import { useEffect, useState } from 'react';

type Source = {
  id: string;
  authority: string;
  source_class: keyof typeof sourceClassLabels;
  refresh: string;
  mvp: boolean;
  notes?: string;
  url: string;
};

type Change = {
  id: string;
  source_id: string;
  previous_hash: string | null;
  current_hash: string;
  detected_at: string;
  materiality: string;
  url?: string | null;
};

type Status = { id: string; authority: string; status: string; detail?: string | null };

export default function Page() {
  const [sources, setSources] = useState<Source[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [health, setHealth] = useState<{ ok?: boolean; explain_enabled?: boolean } | null>(null);
  const [live, setLive] = useState<Status[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [sourceRes, changeRes, healthRes] = await Promise.all([
          fetch('/v1/sources'),
          fetch('/v1/changes'),
          fetch('/health'),
        ]);
        if (!sourceRes.ok) throw new Error('API unavailable');
        setSources((await sourceRes.json()).sources ?? []);
        setChanges((await changeRes.json()).changes ?? []);
        setHealth(await healthRes.json());
        const destRes = await fetch('/v1/brief', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ nationality: 'US', destination_country: 'JP', destination_slug: 'japan' }),
        });
        if (destRes.ok) {
          const brief = await destRes.json();
          setLive(brief.source_statuses ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load admin data');
      }
    }
    void load();
  }, []);

  const ok = live.filter((s) => s.status === 'ok').length;
  const down = live.filter((s) => s.status === 'unavailable').length;

  return (
    <main className="shell">
      <p className="pill">INTERNAL</p>
      <h1>Culture Context Admin</h1>
      <p className="muted">
        Provenance, source health, and hash-change review. A hash change opens a review job; it does not publish that the law changed.
        Review actions will require authentication before production.
      </p>
      {error && <p className="card" style={{ marginTop: 14 }}>{error}. Start the API on port 8580.</p>}
      <section className="grid" style={{ marginTop: 16 }}>
        <article className="card">
          <div className="muted">Source changes</div>
          <h2>{changes.length}</h2>
          <p>Unreviewed or historical hash changes from persisted snapshots.</p>
        </article>
        <article className="card">
          <div className="muted">Source health</div>
          <h2>{live.length ? `${ok} ok / ${down} down` : sources.filter((s) => s.mvp).length}</h2>
          <p>Live adapter status from a Japan probe, or registered MVP adapters if the probe has not returned.</p>
        </article>
        <article className="card">
          <div className="muted">Explanation path</div>
          <h2>{health?.explain_enabled ? 'on' : 'off'}</h2>
          <p>Optional restatement endpoint. Disabled unless CULTURE_EXPLAIN_ENABLED is set.</p>
        </article>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Registered sources</h2>
        <table>
          <thead>
            <tr><th>Authority</th><th>Class</th><th>MVP</th><th>Refresh</th></tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>
                  <div>{source.authority}</div>
                  <div className="muted">{source.notes}</div>
                </td>
                <td>{sourceClassLabels[source.source_class]}</td>
                <td><span className={`pill ${source.mvp ? 'ok' : ''}`}>{source.mvp ? 'yes' : 'later'}</span></td>
                <td>{source.refresh}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Change candidates</h2>
        {changes.length === 0 && <p className="muted">No hash changes stored yet. Retrievals persist snapshots; a later different hash will appear here as unreviewed.</p>}
        {changes.length > 0 && (
          <table>
            <thead>
              <tr><th>Source</th><th>Materiality</th><th>Hashes</th><th>Detected</th></tr>
            </thead>
            <tbody>
              {changes.map((change) => (
                <tr key={change.id}>
                  <td>{change.source_id}</td>
                  <td>{change.materiality}</td>
                  <td className="muted">{(change.previous_hash || 'new').slice(0, 12)} → {change.current_hash.slice(0, 12)}</td>
                  <td>{new Date(change.detected_at).toUTCString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
