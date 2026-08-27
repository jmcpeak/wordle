import { MAX_GUESSES } from '@/constants';
import { t } from '@/store/i18nStore';

export function getWinCongratulationsMessage(guessCount: number): string {
  const attempts = Math.min(Math.max(guessCount, 1), MAX_GUESSES);
  return t(`message.win.${attempts}`);
}
