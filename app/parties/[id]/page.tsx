import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Party, PokemonMember } from '@/lib/types';
import DeletePartyButton from '@/components/parties/DeletePartyButton';
import PartyNameEditor from '@/components/parties/PartyNameEditor';

async function getParty(id: string): Promise<Party & { pokemon_members: PokemonMember[] }> {
  const sb = createClient();
  const { data, error } = await sb.from('parties').select('*, pokemon_members(*)').eq('id', id).single();
  if (error || !data) notFound();
  return data as Party & { pokemon_members: PokemonMember[] };
}

export default async function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const party = await getParty(id);
  const members = [...(party.pokemon_members ?? [])].sort((a, b) => a.slot - b.slot);
  const filled = members.filter((m) => m.pokemon_name).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/parties"
            style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center',
                     background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)',
                     textDecoration: 'none' }}>
            ←
          </Link>
          <div>
            <PartyNameEditor partyId={id} initialName={party.name} />
            <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 1 }}>{filled}/6 匹登録済み</p>
          </div>
        </div>
        <DeletePartyButton partyId={id} />
      </div>

      <div style={{ background: 'var(--mb-tint)', border: '1px solid var(--mb-soft)',
                    borderRadius: 'var(--r-md)', padding: '10px 14px',
                    fontSize: 13, color: 'var(--ink)' }}>
        各スロットをタップしてポケモンを登録してください
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 6 }, (_, i) => {
          const m = members.find((x) => x.slot === i + 1);
          return (
            <Link key={i} href={`/parties/${id}/members/${i + 1}`}
              style={{ textDecoration: 'none' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 17, flexShrink: 0,
                  display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800,
                  background: m?.pokemon_name ? 'var(--mb-soft)' : 'var(--bg-warm)',
                  color: m?.pokemon_name ? 'var(--mb-deep)' : 'var(--ink-mute)',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {m?.pokemon_name ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.pokemon_name}
                        {m.has_mega_item && <span className="badge mega">メガ</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-sub)', marginTop: 2 }}>
                        {[m.nature, m.held_item].filter(Boolean).join(' / ') || '詳細未設定'}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--ink-mute)' }}>未設定 — タップして登録</p>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--ink-mute)', flexShrink: 0 }}>
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
