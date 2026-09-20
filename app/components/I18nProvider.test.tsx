import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import I18nProvider from '@/components/I18nProvider';
import { useI18nStore, useTranslation } from '@/store/i18nStore';

function Copy() {
  const { locale, t } = useTranslation();
  return <span>{`${locale}:${t('greeting')}`}</span>;
}

describe('I18nProvider', () => {
  beforeEach(() => {
    useI18nStore.setState({
      locale: 'en-US',
      translations: { greeting: 'global' },
    });
  });

  it('uses request-scoped translations during server rendering', () => {
    const html = renderToString(
      <I18nProvider locale="fr-FR" translations={{ greeting: 'bonjour' }}>
        <Copy />
      </I18nProvider>,
    );

    expect(html).toContain('fr-FR:bonjour');
  });

  it('does not mutate the singleton store during server rendering', () => {
    renderToString(
      <I18nProvider locale="fr-FR" translations={{ greeting: 'bonjour' }}>
        <Copy />
      </I18nProvider>,
    );

    expect(useI18nStore.getState()).toMatchObject({
      locale: 'en-US',
      translations: { greeting: 'global' },
    });
  });
});
