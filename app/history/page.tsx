import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { Battle } from '@/lib/types';
import HistoryFilterBar from '@/components/history/HistoryFilterBar';

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
        <Link href="/battles/new" className="btn primary sm"
          style={{ textDecoration: 'none' }}>
          ＋ 記録
        </Link>
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
            const myNames = [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name]
              .filter(Boolean).join('・');
            const oppNames = [b.opp_sel1_name, b.opp_sel2_name, b.opp_sel3_name]
              .filter(Boolean).join('・');
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
                    <div className="side-names">{myNames || '—'}</div>
                  </div>
                  <div className="vs-divider">VS</div>
                  <div className="side right">
                    <div className="side-label">相手</div>
                    <div className="side-names">{oppNames || '—'}</div>
                  </div>
                </div>
              </Link>
            );
          })}
          <p style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--ink-mute)' }}>
            すべての対戦を表示しています
          </p>
        </div>
      )}
    </div>
  );
}
