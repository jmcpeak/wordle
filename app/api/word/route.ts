import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/api/_utils/fetchWithTimeout';
import {
  API_FETCH_TIMEOUT_MS,
  DIFFICULTY_LEVEL,
  WORD_API_MAX_ATTEMPTS,
  WORD_LENGTH,
} from '@/constants';

export const dynamic = 'force-dynamic';

async function isValidDictionaryWord(word: string): Promise<boolean> {
  const response = await fetchWithTimeout(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    API_FETCH_TIMEOUT_MS,
  );
  return response.ok;
}

export async function GET() {
  for (let attempt = 1; attempt <= WORD_API_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `https://random-word-api.herokuapp.com/word?length=${WORD_LENGTH}&diff=${DIFFICULTY_LEVEL}`,
        API_FETCH_TIMEOUT_MS,
      );

      if (!response.ok) continue;
      const data = (await response.json()) as string[];
      const candidateWord = data[0]?.toUpperCase();
      if (!candidateWord || candidateWord.length !== WORD_LENGTH) continue;

      if (!(await isValidDictionaryWord(candidateWord))) continue;

      console.log(`[Wordle] Answer: ${candidateWord}`);
      return NextResponse.json({ word: candidateWord });
    } catch {}
  }

  return NextResponse.json(
    { error: 'Could not fetch a valid word from external APIs' },
    { status: 503 },
  );
}
