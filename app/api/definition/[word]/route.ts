import { type NextRequest, NextResponse } from 'next/server';
import {
  type DictionaryEntry,
  getLocalDefinitionEntries,
} from '@/data/definitions';

const WORD_PATTERN = /^[a-z]{1,30}$/i;

/** Definitions are deploy-immutable; allow CDN/browser caching for a day. */
const CACHE_CONTROL =
  'public, max-age=86400, stale-while-revalidate=604800' as const;

type DefinitionResponse =
  | { entries: readonly DictionaryEntry[] }
  | { error: 'notFound' | 'invalidWord' };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ word: string }> },
): Promise<NextResponse<DefinitionResponse>> {
  const { word: rawWord } = await params;
  const word = rawWord?.trim().toLowerCase();

  if (!word || !WORD_PATTERN.test(word)) {
    return NextResponse.json({ error: 'invalidWord' }, { status: 400 });
  }

  const entries = getLocalDefinitionEntries(word);
  if (!entries) {
    return NextResponse.json({ error: 'notFound' }, { status: 404 });
  }

  return NextResponse.json(
    { entries },
    { headers: { 'Cache-Control': CACHE_CONTROL } },
  );
}
