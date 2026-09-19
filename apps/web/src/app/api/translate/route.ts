import { NextResponse } from 'next/server';
import { translateTexts } from '@/lib/translate-text';

const MAX_BATCH = 40;
const MAX_LENGTH = 2000;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { locale?: unknown; texts?: unknown };
    const locale = typeof body.locale === 'string' ? body.locale.trim() : '';
    if (!locale || locale.length > 16) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }
    if (!Array.isArray(body.texts) || body.texts.length > MAX_BATCH) {
      return NextResponse.json({ error: 'Invalid texts' }, { status: 400 });
    }
    const texts = body.texts.map((item) => {
      if (typeof item !== 'string') return '';
      return item.slice(0, MAX_LENGTH);
    });
    const translations = await translateTexts(locale, texts);
    return NextResponse.json({ translations, original: false });
  } catch {
    return NextResponse.json({ error: 'Translation failed' }, { status: 400 });
  }
}
