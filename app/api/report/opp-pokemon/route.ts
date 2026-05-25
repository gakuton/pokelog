import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const partyId = new URL(req.url).searchParams.get('party_id');
  const sb = createClient();
  const args = partyId ? { p_party_id: partyId } : {};
  const { data, error } = await sb.rpc('get_opp_pokemon_win_rates', args);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
