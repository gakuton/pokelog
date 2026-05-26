export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { Party, PokemonMember } from '@/lib/types';

async function getParties(): Promise<(Party & { pokemon_members: PokemonMember[] })[]> {
  const sb = createClient();
  const { data } = await sb.from('parties').select('*, pokemon_members(*)').order('created_at', { ascending: false });
  return (data ?? []) as (Party & { pokemon_members: PokemonMember[] })[];
}

export default async function PartiesPage() {
  const parties = await getParties();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>パーティ</h1>
      </div>

      {/* Guide */}
      <div style={{ background: 'var(--mb-tint)', border: '1px solid var(--mb-soft)',
                    borderRadius: 'var(--r-md)', padding: '12px 14px',
                    fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>
        6体構成のパーティを登録し、対戦記録と紐付けて勝率を分析できます
      </div>

      {parties.length === 0 ? (
        <div className="empty">
          <p className="empty-title">パーティがありません</p>
          <p className="empty-msg">最初のパーティを作成しましょう</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {parties.map((party) => {
            const members = [...(party.pokemon_members ?? [])].sort((a, b) => a.slot - b.slot);
            const filled = members.filter((m) => m.pokemon_name);
            return (
              <Link key={party.id} href={`/parties/${party.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{party.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 700 }}>{filled.length}/6 匹</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                    {Array.from({ length: 6 }, (_, i) => {
                      const m = members.find((x) => x.slot === i + 1);
                      const name = m?.pokemon_name;
                      return (
                        <div key={i}
                          style={{ aspectRatio: '1', borderRadius: 10, display: 'grid', placeItems: 'center',
                                   background: name ? 'var(--mb-soft)' : 'var(--bg-warm)',
                                   border: `1px solid ${name ? 'var(--mb-soft)' : 'var(--line)'}` }}>
                          {name ? (
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--mb-deep)' }}>
                              {name.charAt(0)}
                            </span>
                          ) : (
                            <span style={{ fontSize: 14, color: 'var(--ink-mute)' }}>·</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {filled.length > 0 && (
                    <p style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-sub)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {filled.map((m) => m.pokemon_name).join('・')}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/parties/new"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                 height: 56, borderRadius: 'var(--r-lg)',
                 border: '2px dashed var(--mb-soft)', background: 'var(--mb-tint)',
                 color: 'var(--mb)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
        新しいパーティを作成
      </Link>
    </div>
  );
}
