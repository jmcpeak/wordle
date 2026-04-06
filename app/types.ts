import type { GAME_STATE, SUBMISSION_STATUS } from '@/constants';

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export type RetryAction = 'submitGuess' | null;

export type CellAnimation =
  | { type: 'none' }
  | { type: 'winning'; index: number }
  | { type: 'lossFlipToEmpty'; delay: number }
  | { type: 'lossReveal'; delay: number }
  | { type: 'lossPhase2Reveal'; delay: number }
  | { type: 'restartFlipToEmpty'; delay: number };

export type GameState = (typeof GAME_STATE)[keyof typeof GAME_STATE];

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

/** Response from GET /api/word */
export type WordApiResponse = { word: string };

/** Response from GET /api/validate */
export type ValidateApiResponse = { isValid: boolean };

/** Response from GET /api/stats and POST /api/stats */
export type StatsApiResponse = {
  gamesWon: number;
  gamesLost: number;
  guessDistribution: Record<number, number>;
};
