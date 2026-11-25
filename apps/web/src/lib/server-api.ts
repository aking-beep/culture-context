import { BriefResponse, TravelerProfile, type BriefItem, type BriefResponse as Brief, type TravelerProfile as Traveler } from '@culture-context/domain';

const API = process.env.CULTURE_API_URL || 'http://127.0.0.1:8580';

export async function requestBrief(raw: Traveler): Promise<Brief> {
  const profile = TravelerProfile.parse(raw);
  const response = await fetch(`${API}/v1/brief`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(profile),
    cache: 'no-store',
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Brief failed (${response.status})`);
  }
  return BriefResponse.parse(await response.json());
}

export async function requestExplain(items: BriefItem[]) {
  const response = await fetch(`${API}/v1/explain`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Explain failed (${response.status})`);
  return response.json();
}
