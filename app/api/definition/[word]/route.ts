import { type NextRequest, NextResponse } from 'next/server';

const DICTIONARY_ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/** Definitions don't change — cache each word for 24h to spare the public API. */
const DEFINITION_REVALIDATE_SECONDS = 86_400;

const WORD_PATTERN = /^[a-z]{1,30}$/i;

type DictionaryDefinition = {
  definition: string;
  example?: string;
};

type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
};

type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings: DictionaryMeaning[];
};

type DefinitionResponse =
  | { entries: DictionaryEntry[] }
  | { error: 'notFound' | 'invalidWord' | 'upstream' };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ word: string }> },
): Promise<NextResponse<DefinitionResponse>> {
  const { word: rawWord } = await params;
  const word = rawWord?.trim().toLowerCase();

  if (!word || !WORD_PATTERN.test(word)) {
    return NextResponse.json({ error: 'invalidWord' }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${DICTIONARY_ENDPOINT}/${encodeURIComponent(word)}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: DEFINITION_REVALIDATE_SECONDS },
      },
    );

    if (upstream.status === 404) {
      return NextResponse.json({ error: 'notFound' }, { status: 404 });
    }

    if (!upstream.ok) {
      return NextResponse.json({ error: 'upstream' }, { status: 502 });
    }

    const data = (await upstream.json()) as unknown;
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'notFound' }, { status: 404 });
    }

    return NextResponse.json({ entries: data as DictionaryEntry[] });
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
