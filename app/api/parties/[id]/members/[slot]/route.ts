import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { memberUpdateSchema } from '@/lib/validations/party';
import { hasMegaItem } from '@/lib/calc';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; slot: string }> }
) {
  const { id, slot } = await params;
  const body = await req.json();
  const parsed = memberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const has_mega_item = hasMegaItem(d.held_item);

  const sb = createClient();
  const { data, error } = await sb
    .from('pokemon_members')
    .update({ ...d, has_mega_item, updated_at: new Date().toISOString() })
    .eq('party_id', id)
    .eq('slot', Number(slot))
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
