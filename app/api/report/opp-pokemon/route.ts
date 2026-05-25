import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const partyId = new URL(req.url).searchParams.get('party_id');
  const sb = createClient();

  let q = sb.from('battles').select('result, opp_sel1_name, opp_sel2_name, opp_sel3_name');
  if (partyId) q = q.eq('party_id', partyId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, { count: number; wins: number }>();
  for (const b of data ?? []) {
    for (const name of [b.opp_sel1_name, b.opp_sel2_name, b.opp_sel3_name]) {
      if (!name) continue;
      const entry = map.get(name) ?? { count: 0, wins: 0 };
      entry.count++;
      if (b.result === 'win') entry.wins++;
      map.set(name, entry);
    }
  }

  const rows = Array.from(map.entries())
    .map(([pokemon_name, { count, wins }]) => ({
      pokemon_name,
      count,
      wins,
      win_rate: count > 0 ? Math.round((wins / count) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(rows);
}
