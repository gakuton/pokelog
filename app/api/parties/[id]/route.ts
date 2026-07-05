import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { partyCreateSchema, partyUpdateSchema } from '@/lib/validations/party';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = createClient();
  const { data, error } = await sb
    .from('parties')
    .select('*, pokemon_members(*)')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = partyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const sb = createClient();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if ('season_id' in parsed.data) updateData.season_id = parsed.data.season_id ?? null;
  const { data, error } = await sb
    .from('parties')
    .update(updateData)
    .eq('id', id)
    .select('*, season:seasons(*)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = createClient();
  const { error } = await sb.from('parties').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
