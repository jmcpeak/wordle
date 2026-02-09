import { describe, expect, it } from 'vitest';
import { checkGuess } from '@/utils/gameLogic';

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
