import { type NextRequest, NextResponse } from 'next/server';
import { getAllowedGuessesSet } from '@/data/wordLists';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word')?.trim().toUpperCase();

  if (!word) {
    return NextResponse.json(
      { isValid: false, error: 'Word parameter is required' },
      { status: 400 },
    );
  }

  const allowed = getAllowedGuessesSet();
  return NextResponse.json({ isValid: allowed.has(word) });
}
