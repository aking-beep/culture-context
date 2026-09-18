import {
  BriefResponse,
  ExplainResponse,
  TravelerProfile,
  type BriefItem,
  type BriefResponse as Brief,
  type TravelerProfile as Traveler,
} from '@culture-context/domain';

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
    this.timeoutMs = options.timeoutMs ?? 12_000;
    this.fetchFn = options.fetch ?? fetch;
  }

  async brief(raw: Traveler): Promise<Brief> {
    const profile = TravelerProfile.parse(raw);
    return BriefResponse.parse(await this.post('/v1/brief', profile));
  }

  async destinations(): Promise<unknown> {
    return this.get('/v1/destinations');
  }

  async sources(): Promise<unknown> {
    return this.get('/v1/sources');
  }

  async changes(): Promise<unknown> {
    return this.get('/v1/changes');
  }

  async explain(items: BriefItem[]) {
    return ExplainResponse.parse(await this.post('/v1/explain', { items }));
  }

  private async get(path: string) {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`Culture Context API returned ${response.status}`);
    return response.json();
  }

  private async post(path: string, body: unknown) {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`Culture Context API returned ${response.status}`);
    return response.json();
  }
}

export type { Brief, Traveler };
