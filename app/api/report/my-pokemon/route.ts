import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  const sb = createClient();
  const { data, error } = await sb.rpc('get_pokemon_win_rates');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
