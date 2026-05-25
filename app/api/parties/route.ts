import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { partyCreateSchema } from '@/lib/validations/party';

export async function GET() {
  const sb = createClient();
  const { data, error } = await sb
    .from('parties')
    .select('*, pokemon_members(*)')
    .order('created_at', { ascending: false });
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
    .insert({ name: parsed.data.name })
    .select()
    .single();
  if (partyErr) return NextResponse.json({ error: partyErr.message }, { status: 500 });

  const slots = Array.from({ length: 6 }, (_, i) => ({
    party_id: party.id,
    slot: i + 1,
    pokemon_name: '',
  }));
  const { error: memberErr } = await sb.from('pokemon_members').insert(slots);
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });

  return NextResponse.json(party, { status: 201 });
}
