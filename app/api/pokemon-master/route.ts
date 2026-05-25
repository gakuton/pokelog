import { NextResponse } from 'next/server';
import master from '@/public/data/pokemon_master.json';

export async function GET() {
  return NextResponse.json(master);
}
