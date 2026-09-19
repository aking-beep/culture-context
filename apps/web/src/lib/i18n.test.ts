import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isEnglish,
  isRtl,
  localeFromBrowser,
  localeFromPassport,
  localizeLanguageList,
  normalizeLocale,
} from './locale.ts';

test('passport country selects the native language', () => {
  assert.equal(localeFromPassport('MX'), 'es');
  assert.equal(localeFromPassport('BR'), 'pt');
  assert.equal(localeFromPassport('JP'), 'ja');
  assert.equal(localeFromPassport('CN'), 'zh');
  assert.equal(localeFromPassport('SA'), 'ar');
  assert.equal(localeFromPassport('NG'), 'en');
  assert.equal(localeFromPassport('US'), 'en');
  assert.equal(localeFromPassport('GB'), 'en');
  assert.equal(localeFromPassport('IN'), 'hi');
  assert.equal(localeFromPassport('PH'), 'fil');
  assert.equal(localeFromPassport('FR'), 'fr');
  assert.equal(localeFromPassport('DE'), 'de');
  assert.equal(localeFromPassport('IT'), 'it');
  assert.equal(localeFromPassport('IL'), 'he');
  assert.equal(localeFromPassport('BO'), 'es');
  assert.equal(localeFromPassport('TW'), 'zh-TW');
  assert.equal(localeFromPassport('AE'), 'ar');
  assert.equal(localeFromPassport('th'), 'th');
});

test('unknown or missing passport stays English', () => {
  assert.equal(localeFromPassport(undefined), 'en');
  assert.equal(localeFromPassport(''), 'en');
  assert.equal(localeFromPassport('ZZ'), 'en');
});

test('Arabic, Hebrew, Persian, and Urdu passports are right-to-left', () => {
  assert.equal(isRtl(localeFromPassport('EG')), true);
  assert.equal(isRtl(localeFromPassport('IL')), true);
  assert.equal(isRtl(localeFromPassport('IR')), true);
  assert.equal(isRtl(localeFromPassport('PK')), true);
  assert.equal(isRtl(localeFromPassport('MX')), false);
  assert.equal(isRtl(localeFromPassport('NG')), false);
});

test('English passports stay in English', () => {
  assert.equal(isEnglish(localeFromPassport('NG')), true);
  assert.equal(isEnglish(localeFromPassport('MX')), false);
});

test('browser locale is normalized without inventing a language', () => {
  assert.equal(normalizeLocale('es-MX'), 'es');
  assert.equal(normalizeLocale('zh-TW'), 'zh-TW');
  assert.equal(normalizeLocale('pt-BR'), 'pt');
  assert.equal(normalizeLocale('tl-PH'), 'fil');
  assert.equal(localeFromBrowser('fr-FR'), 'fr');
});

test('spoken language names follow the passport language', () => {
  assert.equal(localizeLanguageList('Italian', 'es'), 'italiano');
  assert.equal(localizeLanguageList('Japanese', 'es'), 'japonés');
  assert.equal(new Intl.DisplayNames(['es'], { type: 'region' }).of('JP'), 'Japón');
});
