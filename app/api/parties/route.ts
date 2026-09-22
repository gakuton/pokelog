import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { partyCreateSchema } from '@/lib/validations/party';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const seasonId = searchParams.get('season_id');

  const sb = createClient();
  let query = sb
    .from('parties')
    .select('*, pokemon_members(*), season:seasons(*)')
    .order('created_at', { ascending: false });

  if (seasonId === 'null') {
    query = query.is('season_id', null);
  } else if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = partyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sb = createClient();
  const { data: party, error: partyErr } = await sb
    .from('parties')
    .insert({
      name: parsed.data.name,
      season_id: parsed.data.season_id ?? null,
    })
    .select()
    .single();
  if (partyErr) return NextResponse.json({ error: partyErr.message }, { status: 500 });

  const { data: version, error: verErr } = await sb
    .from('party_versions')
    .insert({ party_id: party.id })
    .select()
    .single();
  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });

  const slots = Array.from({ length: 6 }, (_, i) => ({
    party_id: party.id,
    party_version_id: version.id,
    slot: i + 1,
    pokemon_name: '',
  }));
  const { error: memberErr } = await sb.from('pokemon_members').insert(slots);
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });

  const { data: updated, error: updErr } = await sb
    .from('parties')
    .update({ current_version_id: version.id })
    .eq('id', party.id)
    .select()
    .single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json(updated, { status: 201 });
}
