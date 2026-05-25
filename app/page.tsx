import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { WinRateSummary, Battle } from '@/lib/types';

async function getSummary(): Promise<WinRateSummary | null> {
  const sb = createClient();
  const { data } = await sb.from('win_rate_summary').select('*').single();
  return data as WinRateSummary | null;
}

type RecentBattle = Battle & {
  sel1: { pokemon_name: string } | null;
  sel2: { pokemon_name: string } | null;
  sel3: { pokemon_name: string } | null;
};

async function getRecentBattles(): Promise<RecentBattle[]> {
  const sb = createClient();
  const { data } = await sb
    .from('battles')
    .select(`*, sel1:my_sel1_id(pokemon_name), sel2:my_sel2_id(pokemon_name), sel3:my_sel3_id(pokemon_name)`)
    .order('created_at', { ascending: false })
    .limit(5);
  return (data ?? []) as RecentBattle[];
}

export default async function HomePage() {
  const [summary, battles] = await Promise.all([getSummary(), getRecentBattles()]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 18px 110px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>PokeLog</h1>
        <Link href="/parties"
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
                   fontWeight: 700, color: 'var(--mb)', textDecoration: 'none' }}>
          パーティ管理
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {/* Hero rating */}
      <div className="hero-rating">
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160,
                      borderRadius: '50%', border: '40px solid rgba(255,255,255,0.15)', opacity: 0.6 }} />
        <div className="label">現在のレート</div>
        <div className="value">{summary?.latest_rating?.toLocaleString() ?? '—'}</div>
        <div style={{ display: 'flex', gap: 16, background: 'rgba(255,255,255,0.16)',
                      backdropFilter: 'blur(8px)', borderRadius: 14, padding: '10px 14px', marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, letterSpacing: '0.08em' }}>通算勝率</div>
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              {summary ? `${summary.total_win_rate}%` : '—'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>
              {summary ? `${summary.total_wins}勝${summary.total_losses}敗${summary.total_draws}分` : ''}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.25)', alignSelf: 'stretch' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, letterSpacing: '0.08em' }}>直近10戦</div>
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              {summary ? `${summary.recent10_win_rate}%` : '—'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>
              {summary ? `${summary.recent10_wins}勝` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <Link href="/battles/new" className="btn primary block"
        style={{ textDecoration: 'none', fontSize: 16, height: 56 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
        </svg>
        新規対戦を記録
      </Link>

      {/* Recent battles */}
      <div>
        <div className="section-head">
          <h2>最近の対戦</h2>
          <Link href="/history" style={{ color: 'var(--mb)', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
            すべて見る ›
          </Link>
        </div>

        {battles.length === 0 ? (
          <div className="card empty">
            <p className="empty-msg">まだ対戦記録がありません</p>
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
          </div>
        )}
      </div>
    </div>
  );
}
