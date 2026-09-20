import { beforeEach, describe, expect, it } from 'vitest';
import { t, useI18nStore } from '@/store/i18nStore';

describe('t() interpolation', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'en-US', translations: {} });
  });

  it('substitutes a single parameter', () => {
    useI18nStore.setState({ translations: { greet: 'Hello {name}' } });

    expect(t('greet', { name: 'Ada' })).toBe('Hello Ada');
  });

  it('substitutes every occurrence of a repeated parameter', () => {
    useI18nStore.setState({
      translations: { echo: '{word} really means {word}' },
    });

    expect(t('echo', { word: 'CRANE' })).toBe('CRANE really means CRANE');
  });

  it('treats $ sequences in values as literal text, not replacement patterns', () => {
    useI18nStore.setState({ translations: { raw: 'value: {v}' } });

    expect(t('raw', { v: '$&' })).toBe('value: $&');
    expect(t('raw', { v: "$'" })).toBe("value: $'");
    expect(t('raw', { v: '$1' })).toBe('value: $1');
  });

  it('leaves unknown placeholders untouched', () => {
    useI18nStore.setState({ translations: { partial: '{a} and {b}' } });

    expect(t('partial', { a: 'one' })).toBe('one and {b}');
  });

  it('falls back to the key when no translation exists', () => {
    expect(t('totally.missing.key')).toBe('totally.missing.key');
  });
});
