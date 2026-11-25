import { NextResponse } from 'next/server';
import { requestBrief } from '@/lib/server-api';
import { TravelerProfile } from '@culture-context/domain';

export async function POST(request: Request) {
  try {
    const profile = TravelerProfile.parse(await request.json());
    const brief = await requestBrief(profile);
    return NextResponse.json(brief);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid traveler profile';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
