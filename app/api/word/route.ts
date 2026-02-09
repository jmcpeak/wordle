import { NextResponse } from 'next/server';
import { WORD_LENGTH } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await fetch(
    `https://random-word-api.herokuapp.com/word?length=${WORD_LENGTH}`,
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch from external API' },
      { status: response.status },
    );
  }

  const data = await response.json();
  const word = data[0].toUpperCase();
  console.log(`[Wordle] Answer: ${word}`);
  return NextResponse.json({ word });
}
