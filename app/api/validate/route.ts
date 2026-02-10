import { type NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/api/_utils/fetchWithTimeout';
import { API_FETCH_TIMEOUT_MS } from '@/constants';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word')?.trim().toUpperCase();

  if (!word) {
    return NextResponse.json(
      { isValid: false, error: 'Word parameter is required' },
      { status: 400 },
    );
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      API_FETCH_TIMEOUT_MS,
    );

    if (response.ok) {
      return NextResponse.json({ isValid: true });
    }

    return NextResponse.json({ isValid: false });
  } catch {
    return NextResponse.json(
      { isValid: false, error: 'Validation service timed out' },
      { status: 503 },
    );
  }
}
