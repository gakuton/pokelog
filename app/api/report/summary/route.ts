import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const partyId = new URL(req.url).searchParams.get('party_id');
  const sb = createClient();

  let q = sb
    .from('battles')
    .select('result, created_at')
    .order('created_at', { ascending: false });
  if (partyId) q = q.eq('party_id', partyId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const total = rows.length;
  const wins = rows.filter((r) => r.result === 'win').length;
  const losses = rows.filter((r) => r.result === 'lose').length;
  const draws = rows.filter((r) => r.result === 'draw').length;
  const win_rate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;

  const recent10 = rows.slice(0, 10);
  const r10total = recent10.length;
  const r10wins = recent10.filter((r) => r.result === 'win').length;
  const recent10_win_rate = r10total > 0 ? Math.round((r10wins / r10total) * 1000) / 10 : 0;

  return NextResponse.json({ total, wins, losses, draws, win_rate, recent10_win_rate });
}
