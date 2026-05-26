import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { WinRateSummary, Battle, Party, PokemonMember } from '@/lib/types';
import PokeAvatar from '@/components/common/PokeAvatar';

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
    .limit(3);
  return (data ?? []) as RecentBattle[];
}

async function getFirstParty(): Promise<(Party & { pokemon_members: PokemonMember[] }) | null> {
  const sb = createClient();
  const { data } = await sb
    .from('parties')
    .select('*, pokemon_members(*)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data as (Party & { pokemon_members: PokemonMember[] }) | null;
}

export default async function HomePage() {
  const [summary, battles, party] = await Promise.all([getSummary(), getRecentBattles(), getFirstParty()]);
  const partyMembers = party
    ? [...(party.pokemon_members ?? [])].sort((a, b) => a.slot - b.slot)
    : null;

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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, letterSpacing: '0.08em' }}>通算勝率</div>
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              {summary ? `${summary.total_win_rate}%` : '—'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>
              {summary ? `${summary.total_wins}勝${summary.total_losses}敗${summary.total_draws}分` : ''}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.25)', alignSelf: 'stretch' }} />
          <div style={{ flex: 1 }}>
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

      {/* Party preview */}
      {partyMembers && (
        <>
          <div className="section-head">
            <h2>パーティ編成</h2>
            <Link href="/parties" style={{ color: 'var(--mb)', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
              編集 ›
            </Link>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
              {party!.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {Array.from({ length: 6 }, (_, i) => {
                const m = partyMembers.find((x) => x.slot === i + 1);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {m?.pokemon_name ? (
                      <PokeAvatar name={m.pokemon_name} size="xs" mega={m.has_mega_item} />
                    ) : (
                      <div className="poke-avatar xs" style={{ background: 'var(--line-soft)',
                              border: '1px dashed var(--line)', color: 'var(--ink-mute)',
                              fontSize: 16, fontWeight: 700 }}>
                        <span>＋</span>
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: m?.pokemon_name ? 'var(--ink-sub)' : 'var(--ink-mute)',
                                  textAlign: 'center', lineHeight: 1.1, fontWeight: 700,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                  maxWidth: '100%' }}>
                      {m?.pokemon_name || `No.${i + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

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
              const myPokes = [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name].filter(Boolean) as string[];
              const oppPokes = [b.opp_sel1_name, b.opp_sel2_name, b.opp_sel3_name].filter(Boolean) as string[];
              const date = new Date(b.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
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
          </div>
        )}
      </div>
    </div>
  );
}
