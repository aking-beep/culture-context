import { BriefResponse, TravelerProfile, type BriefResponse as Brief, type TravelerProfile as Traveler } from '@culture-context/domain';

export interface CultureContextClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export class CultureContextClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: CultureContextClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.fetchFn = options.fetch ?? fetch;
  }

  async brief(raw: Traveler): Promise<Brief> {
    const profile = TravelerProfile.parse(raw);
    const response = await this.fetchFn(`${this.baseUrl}/v1/brief`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(profile),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`Culture Context API returned ${response.status}`);
    return BriefResponse.parse(await response.json());
  }
}

export type { Brief, Traveler };
