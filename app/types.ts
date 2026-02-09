import type { GAME_STATE, SUBMISSION_STATUS } from '@/constants';

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export type GameState = (typeof GAME_STATE)[keyof typeof GAME_STATE];

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];
