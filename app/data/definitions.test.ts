import { describe, expect, it } from 'vitest';
import { getLocalDefinitionEntries } from '@/data/definitions';
import { answers } from '@/data/wordle-answers.mjs';

describe('getLocalDefinitionEntries', () => {
  it('returns entries for a known answer word', () => {
    const entries = getLocalDefinitionEntries('CRANE');
    expect(entries).not.toBeNull();
    expect(entries?.[0]?.word).toBe('crane');
    expect(
      entries?.[0]?.meanings?.[0]?.definitions?.[0]?.definition,
    ).toBeTruthy();
  });

  it('returns null for unknown words', () => {
    expect(getLocalDefinitionEntries('qwxyz')).toBeNull();
  });

  it('has a definition for every answer word', () => {
    const missing = answers.filter((word) => !getLocalDefinitionEntries(word));
    expect(missing).toEqual([]);
  });
});
