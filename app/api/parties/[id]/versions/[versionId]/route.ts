import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  const sb = createClient();

  const { data: version, error: verErr } = await sb
    .from('party_versions')
    .select('*')
    .eq('id', versionId)
    .eq('party_id', id)
    .single();
  if (verErr || !version) return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 });

  const { data: members, error: memErr } = await sb
    .from('pokemon_members')
    .select('*')
    .eq('party_version_id', versionId)
    .order('slot', { ascending: true });
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

  return NextResponse.json({ ...version, members: members ?? [] });
}
