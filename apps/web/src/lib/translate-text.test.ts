import assert from 'node:assert/strict';
import test from 'node:test';
import { mymemoryLang, protectPlaceholders, restorePlaceholders, translateTexts } from './translate-text.ts';

test('English and missing locales are not sent to the translator', () => {
  assert.equal(mymemoryLang('en'), null);
  assert.equal(mymemoryLang('en-GB'), null);
  assert.equal(mymemoryLang('es'), 'es');
  assert.equal(mymemoryLang('fil'), 'tl');
  assert.equal(mymemoryLang('zh-TW'), 'zh-TW');
});

test('placeholders survive a round trip', () => {
  const protectedText = protectPlaceholders('Show my notes for {destination}.');
  assert.match(protectedText, /⟦destination⟧/);
  assert.equal(restorePlaceholders('Mostrar mis notas para ⟦destination⟧.'), 'Mostrar mis notas para {destination}.');
});

test('failed or warned translations fall back to the original sourced text', async () => {
  const fetchImpl = (async () => ({
    ok: true,
    json: async () => ({ responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY' } }),
  })) as unknown as typeof fetch;
  const out = await translateTexts('es', ['If you plan to drive.'], fetchImpl);
  assert.deepEqual(out, ['If you plan to drive.']);
});

test('successful translations are returned in order', async () => {
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const q = new URL(url).searchParams.get('q') || '';
    return {
      ok: true,
      json: async () => ({ responseData: { translatedText: q === 'Hello' ? 'Hola' : q } }),
    };
  }) as unknown as typeof fetch;
  const out = await translateTexts('es', ['Hello', '123'], fetchImpl);
  assert.equal(out[0], 'Hola');
  assert.equal(out[1], '123');
});
