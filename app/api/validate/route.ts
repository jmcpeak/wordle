import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json(
      { isValid: false, error: 'Word parameter is required' },
      { status: 400 },
    );
  }

  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
  );

  if (response.ok) {
    return NextResponse.json({ isValid: true });
  }

  return NextResponse.json({ isValid: false });
}
