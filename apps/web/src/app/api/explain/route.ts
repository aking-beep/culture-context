import { NextResponse } from 'next/server';
import { requestExplain } from '@/lib/server-api';
import { BriefItem } from '@culture-context/domain';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = BriefItem.array().parse(body.items ?? body);
    const result = await requestExplain(items);
    if (result === null) {
      return NextResponse.json({ enabled: false, detail: 'Explanation is disabled' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid explanation request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
