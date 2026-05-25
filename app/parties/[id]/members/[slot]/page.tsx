import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { PokemonMember } from '@/lib/types';
import MemberEditForm from '@/components/parties/MemberEditForm';

async function getMember(partyId: string, slot: number): Promise<PokemonMember | null> {
  const sb = createClient();
  const { data } = await sb
    .from('pokemon_members')
    .select('*')
    .eq('party_id', partyId)
    .eq('slot', slot)
    .single();
  return data as PokemonMember | null;
}

export default async function MemberEditPage({
  params,
}: {
  params: Promise<{ id: string; slot: string }>;
}) {
  const { id, slot } = await params;
  const slotNum = Number(slot);
  if (isNaN(slotNum) || slotNum < 1 || slotNum > 6) notFound();

  const member = await getMember(id, slotNum);
  if (!member) notFound();

  return <MemberEditForm partyId={id} slot={slotNum} member={member} />;
}
