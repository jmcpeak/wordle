import { NextResponse } from 'next/server';
import { pickRandomSolution } from '@/data/wordLists';

export const dynamic = 'force-dynamic';

export async function GET() {
  const word = pickRandomSolution();
  return NextResponse.json({ word });
}
