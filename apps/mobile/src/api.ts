import { CultureContextClient } from '@culture-context/sdk';
import type { TravelerProfile } from '@culture-context/domain';

export function createMobileClient(baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8580') {
  return new CultureContextClient({ baseUrl, timeoutMs: 15000 });
}

export const defaultProfile: TravelerProfile = {
  nationality: 'US',
  residence_country: 'US',
  destination_country: 'JP',
  destination_slug: 'japan',
  city: 'Tokyo',
  purpose: 'tourism',
  activities: ['driving', 'filming'],
};
