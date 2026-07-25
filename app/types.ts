import type { GAME_STATE, SUBMISSION_STATUS } from '@/constants';

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export type RetryAction = 'submitGuess' | null;

export type CellAnimation =
  | { type: 'none' }
  | { type: 'reveal'; index: number }
  | { type: 'winning'; index: number }
  | { type: 'lossFlipToEmpty'; delay: number }
  | { type: 'lossReveal'; delay: number }
  | { type: 'lossPhase2Reveal'; delay: number }
  | { type: 'restartFlipToEmpty'; delay: number }
  /** Clear → letter along the shorter drum path (typing / lab letter pick). */
  | { type: 'letterEnter'; delay: number };

export type GameState = (typeof GAME_STATE)[keyof typeof GAME_STATE];

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

/** Response from GET /api/word */
export type WordApiResponse = { word: string };

/** Response from GET /api/validate */
export type ValidateApiResponse = { isValid: boolean };

/** A single completed game's history record. */
export type RecentGame = {
  id: number;
  word: string;
  won: boolean;
  guesses: number;
};

/** Response from GET /api/stats and POST /api/stats */
export type StatsApiResponse = {
  gamesWon: number;
  gamesLost: number;
  guessDistribution: Record<number, number>;
  recentGames: RecentGame[];
};

/** Response from GET /api/partial-game */
export type PartialGameApiResponse = {
  game: { solution: string; guesses: string[] } | null;
};

/** Server-seeded board for first paint (avoids client /api/partial-game → /api/word waterfall). */
export type InitialGameSeed = {
  solution: string;
  guesses: string[];
};
