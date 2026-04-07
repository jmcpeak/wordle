import { describe, expect, it } from 'vitest';
import { checkGuess, rebuildLetterStatuses } from '@/utils/gameLogic';

describe('checkGuess', () => {
  it('should return all correct for a perfect match', () => {
    const guess = 'REACT';
    const solution = 'REACT';
    const result = checkGuess(guess, solution);
    expect(result).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('should return all absent for a complete mismatch', () => {
    const guess = 'QUICK';
    const solution = 'WORLD';
    const result = checkGuess(guess, solution);
    expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
  });

  it('should handle present letters correctly', () => {
    const guess = 'TRAIN';
    const solution = 'REACT';
    const result = checkGuess(guess, solution);
    expect(result).toEqual([
      'present',
      'present',
      'correct',
      'absent',
      'absent',
    ]);
  });

  // guess:    A P P L E
  // solution: P A P E R
  // Expected: ['present', 'present', 'correct', 'absent', 'present']
  it('should handle duplicate letters in the guess', () => {
    const guess = 'APPLE';
    const solution = 'PAPER';
    const result = checkGuess(guess, solution);
    expect(result).toEqual([
      'present',
      'present',
      'correct',
      'absent',
      'present',
    ]);
  });

  // guess:    L E V E L
  // solution: A P P L E
  // Expected: ['present', 'present', 'absent', 'absent', 'absent']
  it('should handle duplicate letters in the solution', () => {
    const guess = 'LEVEL';
    const solution = 'APPLE';
    const result = checkGuess(guess, solution);
    expect(result).toEqual([
      'present',
      'present',
      'absent',
      'absent',
      'absent',
    ]);
  });

  // guess:    C R A N E
  // solution: R E A C T
  // Expected: ['present', 'present', 'correct', 'absent', 'present']
  it('should handle a mix of correct, present, and absent letters', () => {
    const guess = 'CRANE';
    const solution = 'REACT';
    const result = checkGuess(guess, solution);
    expect(result).toEqual([
      'present',
      'present',
      'correct',
      'absent',
      'present',
    ]);
  });

  // guess:    S A S S Y
  // solution: B A S I C
  // Expected: ['absent', 'correct', 'correct', 'absent', 'absent']
  it('should handle multiple same-letter guesses with one in solution', () => {
    const guess = 'SASSY';
    const solution = 'BASIC';
    const result = checkGuess(guess, solution);
    expect(result).toEqual([
      'absent',
      'correct',
      'correct',
      'absent',
      'absent',
    ]);
  });
});

describe('rebuildLetterStatuses', () => {
  it('returns empty map for empty guesses', () => {
    expect(rebuildLetterStatuses([], 'APPLE')).toEqual({});
  });

  it('builds correct statuses from a single guess', () => {
    const result = rebuildLetterStatuses(['CRANE'], 'APPLE');
    expect(result).toEqual({
      C: 'absent',
      R: 'absent',
      A: 'present',
      N: 'absent',
      E: 'correct',
    });
  });

  it('accumulates statuses across multiple guesses', () => {
    const result = rebuildLetterStatuses(['CRANE', 'APPLE'], 'APPLE');
    expect(result.A).toBe('correct');
    expect(result.P).toBe('correct');
    expect(result.L).toBe('correct');
    expect(result.E).toBe('correct');
    expect(result.C).toBe('absent');
    expect(result.R).toBe('absent');
    expect(result.N).toBe('absent');
  });

  it('does not downgrade correct to present', () => {
    // First guess gets E correct; second guess has E in wrong position
    const result = rebuildLetterStatuses(['PLANE', 'RESET'], 'APPLE');
    expect(result.E).toBe('correct');
  });

  it('does not downgrade present to absent', () => {
    // First guess has A present; second guess has A absent (already used)
    const result = rebuildLetterStatuses(['CRANE', 'QUICK'], 'APPLE');
    expect(result.A).toBe('present');
  });
});
