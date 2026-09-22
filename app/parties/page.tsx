export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import type { Party, PokemonMember, Season } from '@/lib/types';
import SeasonFilterTabs from '@/components/seasons/SeasonFilterTabs';

async function getSeasons(): Promise<Season[]> {
  const sb = createClient();
  const { data } = await sb
    .from('seasons')
    .select('*')
    .order('end_date', { ascending: false, nullsFirst: true });
  return (data ?? []) as Season[];
}

async function getActiveSeasonId(): Promise<string | null> {
  const sb = createClient();
  const { data } = await sb
    .from('parties')
    .select('season_id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  return (data as { season_id: string | null } | null)?.season_id ?? null;
}

async function getParties(seasonId: string | null): Promise<(Party & { pokemon_members: PokemonMember[] })[]> {
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

  const { data } = await query;
  return (data ?? []) as (Party & { pokemon_members: PokemonMember[] })[];
}

interface Props {
  searchParams: Promise<{ season_id?: string }>;
}

export default async function PartiesPage({ searchParams }: Props) {
  const { season_id } = await searchParams;

  const [seasons, activeSeasonId] = await Promise.all([
    getSeasons(),
    season_id === undefined ? getActiveSeasonId() : Promise.resolve(null),
  ]);

  // season_id未指定時は、利用中パーティのシーズンをデフォルトにする
  // 'all' は明示的に「すべて」を選んだ場合
  const seasonId =
    season_id === undefined
      ? activeSeasonId
      : season_id === 'all'
        ? null
        : season_id;

  const parties = await getParties(seasonId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>パーティ</h1>
        <Link
          href="/seasons"
          style={{
            fontSize: 12, fontWeight: 700, color: 'var(--mb)',
            textDecoration: 'none', padding: '6px 12px',
            border: '1px solid var(--mb-soft)', borderRadius: 20,
            background: 'var(--mb-tint)',
          }}
        >
          シーズン管理
        </Link>
      </div>

      {/* シーズンフィルタ */}
      {seasons.length > 0 && (
        <Suspense fallback={null}>
          <SeasonFilterTabs seasons={seasons} activeSeasonId={activeSeasonId} />
        </Suspense>
      )}

      {/* Guide */}
      <div style={{
        background: 'var(--mb-tint)', border: '1px solid var(--mb-soft)',
        borderRadius: 'var(--r-md)', padding: '12px 14px',
        fontSize: 13, color: 'var(--ink)', lineHeight: 1.6,
      }}>
        6体構成のパーティを登録し、対戦記録と紐付けて勝率を分析できます
      </div>

      {parties.length === 0 ? (
        <div className="empty">
          <p className="empty-title">
            {seasonId ? 'このシーズンにパーティはありません' : 'パーティがありません'}
          </p>
          <p className="empty-msg">
            {seasonId ? '別のシーズンを選択するか、新しいパーティを作成しましょう' : '最初のパーティを作成しましょう'}
          </p>
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
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{party.name}</span>
                      {party.season && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, fontWeight: 700,
                          color: 'var(--mb)', background: 'var(--mb-tint)',
                          border: '1px solid var(--mb-soft)', borderRadius: 10,
                          padding: '2px 8px',
                        }}>
                          {(party.season as Season).name}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 700 }}>{filled.length}/6 匹</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                    {Array.from({ length: 6 }, (_, i) => {
                      const m = members.find((x) => x.slot === i + 1);
                      const name = m?.pokemon_name;
                      return (
                        <div
                          key={i}
                          style={{
                            aspectRatio: '1', borderRadius: 10, display: 'grid', placeItems: 'center',
                            background: name ? 'var(--mb-soft)' : 'var(--bg-warm)',
                            border: `1px solid ${name ? 'var(--mb-soft)' : 'var(--line)'}`,
                          }}
                        >
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
                    <p style={{
                      marginTop: 10, fontSize: 12, color: 'var(--ink-sub)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {filled.map((m) => m.pokemon_name).join('・')}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/parties/new"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          height: 56, borderRadius: 'var(--r-lg)',
          border: '2px dashed var(--mb-soft)', background: 'var(--mb-tint)',
          color: 'var(--mb)', fontWeight: 700, fontSize: 15, textDecoration: 'none',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
        新しいパーティを作成
      </Link>
    </div>
  );
}
