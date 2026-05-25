import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Party, PokemonMember } from '@/lib/types';
import DeletePartyButton from '@/components/parties/DeletePartyButton';

async function getParty(id: string): Promise<Party & { pokemon_members: PokemonMember[] }> {
  const sb = createClient();
  const { data, error } = await sb
    .from('parties')
    .select('*, pokemon_members(*)')
    .eq('id', id)
    .single();
  if (error || !data) notFound();
  return data as Party & { pokemon_members: PokemonMember[] };
}

export default async function PartyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const party = await getParty(id);
  const members = [...(party.pokemon_members ?? [])].sort((a, b) => a.slot - b.slot);
  const filled = members.filter((m) => m.pokemon_name).length;

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/parties"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{party.name}</h1>
            <p className="text-xs" style={{ color: 'var(--ink-mute)' }}>{filled}/6 匹登録済み</p>
          </div>
        </div>
        <DeletePartyButton partyId={id} />
      </div>

      {/* Guide */}
      <div className="rounded-[18px] border px-4 py-3 text-xs leading-relaxed"
        style={{ background: 'var(--mb-tint)', borderColor: 'var(--mb-soft)', color: 'var(--ink)' }}>
        各スロットをタップしてポケモンを登録してください
      </div>

      {/* Slot list */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const m = members.find((x) => x.slot === i + 1);
          return (
            <Link key={i} href={`/parties/${id}/members/${i + 1}`}
              className="flex items-center gap-3 rounded-[18px] border px-4 py-3.5"
              style={{ background: 'var(--card)', borderColor: 'var(--line)',
                       boxShadow: '0 4px 14px rgba(45,30,15,0.04)' }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                style={{ background: m?.pokemon_name ? 'var(--mb-soft)' : 'var(--bg-warm)',
                         color: m?.pokemon_name ? 'var(--mb-deep)' : 'var(--ink-mute)' }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                {m?.pokemon_name ? (
                  <>
                    <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                      {m.pokemon_name}
                      {m.has_mega_item && (
                        <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-black"
                          style={{ background: 'var(--hb-soft)', color: '#7B5310' }}>メガ</span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-sub)' }}>
                      {[m.nature, m.held_item].filter(Boolean).join(' / ') || '詳細未設定'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--ink-mute)' }}>未設定 — タップして登録</p>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--ink-mute)' }}>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
