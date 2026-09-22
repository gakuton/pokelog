import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { memberUpdateSchema } from '@/lib/validations/party';
import { hasMegaItem } from '@/lib/calc';
import type { PokemonMember } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; slot: string }> }
) {
  const { id, slot } = await params;
  const slotNum = Number(slot);
  const body = await req.json();
  const parsed = memberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const has_mega_item = hasMegaItem(d.held_item);

  const sb = createClient();

  const { data: party, error: partyErr } = await sb
    .from('parties')
    .select('id, current_version_id')
    .eq('id', id)
    .single();
  if (partyErr || !party) return NextResponse.json({ error: 'パーティが見つかりません' }, { status: 404 });

  const { data: currentMembers, error: curErr } = await sb
    .from('pokemon_members')
    .select('*')
    .eq('party_version_id', party.current_version_id);
  if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 });

  // 編集は既存の版を書き換えず、6スロット全体を新しい版としてコピー作成する。
  // 過去の版の行は二度と更新しないことで、battles から参照される選出履歴が
  // 遡って変わらないようにする。
  const { data: newVersion, error: verErr } = await sb
    .from('party_versions')
    .insert({ party_id: id })
    .select()
    .single();
  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });

  const now = new Date().toISOString();
  const newSlots = Array.from({ length: 6 }, (_, i) => {
    const slotN = i + 1;
    if (slotN === slotNum) {
      return {
        party_id: id,
        party_version_id: newVersion.id,
        slot: slotN,
        ...d,
        has_mega_item,
        updated_at: now,
      };
    }
    const existing = (currentMembers as PokemonMember[] | null)?.find((m) => m.slot === slotN);
    return {
      party_id: id,
      party_version_id: newVersion.id,
      slot: slotN,
      pokemon_name: existing?.pokemon_name ?? '',
      move1: existing?.move1 ?? null,
      move2: existing?.move2 ?? null,
      move3: existing?.move3 ?? null,
      move4: existing?.move4 ?? null,
      nature: existing?.nature ?? null,
      held_item: existing?.held_item ?? null,
      ev_h: existing?.ev_h ?? 0,
      ev_a: existing?.ev_a ?? 0,
      ev_b: existing?.ev_b ?? 0,
      ev_c: existing?.ev_c ?? 0,
      ev_d: existing?.ev_d ?? 0,
      ev_s: existing?.ev_s ?? 0,
      has_mega_item: existing?.has_mega_item ?? false,
      updated_at: existing?.updated_at ?? null,
    };
  });

  const { data: inserted, error: insErr } = await sb
    .from('pokemon_members')
    .insert(newSlots)
    .select();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { error: updPartyErr } = await sb
    .from('parties')
    .update({ current_version_id: newVersion.id, updated_at: now })
    .eq('id', id);
  if (updPartyErr) return NextResponse.json({ error: updPartyErr.message }, { status: 500 });

  const saved = (inserted as PokemonMember[]).find((m) => m.slot === slotNum);
  return NextResponse.json(saved);
}
