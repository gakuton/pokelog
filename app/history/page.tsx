import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { Battle } from '@/lib/types';
import HistoryFilterBar from '@/components/history/HistoryFilterBar';
import PokeAvatar from '@/components/common/PokeAvatar';

type BattleRow = Battle & {
  sel1: { pokemon_name: string } | null;
  sel2: { pokemon_name: string } | null;
  sel3: { pokemon_name: string } | null;
};

async function getBattles(my?: string, opp?: string): Promise<BattleRow[]> {
  const sb = createClient();
  let q = sb
    .from('battles')
    .select(`*, sel1:my_sel1_id(pokemon_name), sel2:my_sel2_id(pokemon_name), sel3:my_sel3_id(pokemon_name)`)
    .order('created_at', { ascending: false })
    .limit(200);

  if (opp) {
    q = q.or(`opp_sel1_name.ilike.%${opp}%,opp_sel2_name.ilike.%${opp}%,opp_sel3_name.ilike.%${opp}%`);
  }

  const { data } = await q;
  let rows = (data ?? []) as BattleRow[];

  if (my) {
    const myLower = my.toLowerCase();
    rows = rows.filter((b) =>
      [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name]
        .some((n) => n?.toLowerCase().includes(myLower)),
    );
  }
  return rows;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ my?: string; opp?: string }>;
}) {
  const { my, opp } = await searchParams;
  const battles = await getBattles(my, opp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>対戦履歴</h1>
        {(my || opp) && (
          <span className="badge tag">フィルター適用中</span>
        )}
      </div>

      <Suspense>
        <HistoryFilterBar />
      </Suspense>

      {battles.length === 0 ? (
        <div className="empty" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p className="empty-title">
            {my || opp ? '条件に一致する対戦がありません' : '対戦記録がありません'}
          </p>
          {!my && !opp && (
            <p className="empty-msg">対戦を記録して履歴を積み上げましょう</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {battles.map((b) => {
            const myPokes = [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name].filter(Boolean) as string[];
            const oppPokes = [b.opp_sel1_name, b.opp_sel2_name, b.opp_sel3_name].filter(Boolean) as string[];
            const date = new Date(b.created_at).toLocaleDateString('ja-JP', {
              month: 'numeric', day: 'numeric',
            });
            return (
              <Link key={b.id} href={`/history/${b.id}`} className="battle-card">
                <div className="meta">
                  <span className={`result-chip ${b.result}`}>
                    {b.result === 'win' ? '勝' : b.result === 'lose' ? '負' : '分'}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 12,
                                 color: b.result === 'win' ? 'var(--sb)' : b.result === 'lose' ? 'var(--pb)' : 'var(--ink-sub)' }}>
                    {b.result === 'win' ? '勝利' : b.result === 'lose' ? '敗北' : '引き分け'}
                  </span>
                  {b.rating_after && (
                    <span className="rating-pill" style={{ marginLeft: 'auto' }}>{b.rating_after}</span>
                  )}
                  {!b.rating_after && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-mute)' }}>{date}</span>
                  )}
                </div>
                <div className="versus-row">
                  <div className="side">
                    <div className="side-label">自分</div>
                    <div className="selection">
                      {myPokes.map((n) => <PokeAvatar key={n} name={n} size="xs" />)}
                    </div>
                    <div className="side-names">{myPokes.join('・') || '—'}</div>
                  </div>
                  <div className="vs-divider">VS</div>
                  <div className="side right">
                    <div className="side-label">相手</div>
                    <div className="selection" style={{ justifyContent: 'flex-end' }}>
                      {oppPokes.map((n) => <PokeAvatar key={n} name={n} size="xs" />)}
                    </div>
                    <div className="side-names">{oppPokes.join('・') || '—'}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 8,
                              display: 'flex', alignItems: 'center', gap: 6,
                              fontSize: 11, color: 'var(--ink-sub)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  {date}
                </div>
              </Link>
            );
          })}
          <p style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--ink-mute)' }}>
            すべての対戦を表示しています
          </p>
        </div>
      )}

      {/* FAB */}
      <Link href="/battles/new" className="fab" aria-label="新規対戦を記録">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
        </svg>
      </Link>
    </div>
  );
}
