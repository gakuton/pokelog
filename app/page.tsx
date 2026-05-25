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

const RESULT_CHIP: Record<string, { label: string; bg: string }> = {
  win:  { label: '勝', bg: 'var(--sb)'  },
  lose: { label: '負', bg: 'var(--pb)'  },
  draw: { label: '分', bg: 'var(--ink-mute)' },
};

export default async function HomePage() {
  const [summary, battles] = await Promise.all([getSummary(), getRecentBattles()]);

  return (
    <div className="flex flex-col p-4 pt-5 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>PokeLog</h1>
        <Link href="/parties" className="flex items-center gap-1 text-sm font-bold"
          style={{ color: 'var(--mb)' }}>
          パーティ管理
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {/* Hero rating card */}
      <div className="relative overflow-hidden rounded-[22px] p-5"
        style={{
          background: 'linear-gradient(140deg, #5B2FB0 0%, #7B4FD1 55%, #9F76E8 100%)',
          boxShadow: '0 18px 40px rgba(91,47,176,0.35)',
        }}>
        <div className="absolute right-[-30px] top-[-30px] rounded-full opacity-20"
          style={{ width: 160, height: 160, background: 'rgba(255,255,255,0.3)' }} />
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/85">
          現在のレート
        </div>
        <div className="my-1 font-black text-white" style={{ fontSize: 44, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          {summary?.latest_rating?.toLocaleString() ?? '—'}
        </div>
        <div className="mt-3 flex gap-3 rounded-2xl p-3"
          style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)' }}>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-white/80 tracking-wider">通算勝率</div>
            <div className="mt-0.5 font-black text-white" style={{ fontSize: 20 }}>
              {summary ? `${summary.total_win_rate}%` : '—'}
            </div>
            <div className="mt-0.5 text-[10px] text-white/70">
              {summary ? `${summary.total_wins}勝${summary.total_losses}敗${summary.total_draws}分` : ''}
            </div>
          </div>
          <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.25)' }} />
          <div className="flex-1">
            <div className="text-[10px] font-bold text-white/80 tracking-wider">直近10戦</div>
            <div className="mt-0.5 font-black text-white" style={{ fontSize: 20 }}>
              {summary ? `${summary.recent10_win_rate}%` : '—'}
            </div>
            <div className="mt-0.5 text-[10px] text-white/70">
              {summary ? `${summary.recent10_wins}勝` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <Link href="/battles/new"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white"
        style={{ background: 'var(--mb)', boxShadow: '0 6px 18px rgba(91,47,176,0.35)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
        </svg>
        新規対戦を記録
      </Link>

      {/* Recent battles */}
      <div>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>最近の対戦</h2>
          <Link href="/history" className="text-xs font-bold" style={{ color: 'var(--mb)' }}>
            すべて見る ›
          </Link>
        </div>

        {battles.length === 0 ? (
          <div className="rounded-[18px] border p-8 text-center"
            style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
            <p className="text-sm" style={{ color: 'var(--ink-sub)' }}>まだ対戦記録がありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {battles.map((b) => {
              const chip = RESULT_CHIP[b.result] ?? RESULT_CHIP.draw;
              const myNames = [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name]
                .filter(Boolean).join('・');
              const oppNames = [b.opp_sel1_name, b.opp_sel2_name, b.opp_sel3_name]
                .filter(Boolean).join('・');
              const date = new Date(b.created_at).toLocaleDateString('ja-JP', {
                month: 'numeric', day: 'numeric',
              });
              return (
                <Link key={b.id} href={`/history/${b.id}`}
                  className="rounded-[18px] border p-4"
                  style={{ background: 'var(--card)', borderColor: 'var(--line)',
                           boxShadow: '0 4px 14px rgba(45,30,15,0.04)' }}>
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                      style={{ background: chip.bg }}>
                      {chip.label}
                    </span>
                    <span className="text-xs font-bold"
                      style={{ color: b.result === 'win' ? 'var(--sb)' : b.result === 'lose' ? 'var(--pb)' : 'var(--ink-sub)' }}>
                      {b.result === 'win' ? '勝利' : b.result === 'lose' ? '敗北' : '引き分け'}
                    </span>
                    {b.rating_after && (
                      <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-black"
                        style={{ background: 'var(--hb-soft)', color: '#7B5310' }}>
                        {b.rating_after}
                      </span>
                    )}
                    {!b.rating_after && (
                      <span className="ml-auto text-xs" style={{ color: 'var(--ink-mute)' }}>{date}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 text-[10px] font-black tracking-widest"
                        style={{ color: 'var(--ink-mute)' }}>自分</div>
                      <div className="truncate text-xs font-bold" style={{ color: 'var(--ink)' }}>
                        {myNames || '—'}
                      </div>
                    </div>
                    <div className="text-xs font-black" style={{ color: 'var(--ink-mute)' }}>VS</div>
                    <div className="min-w-0 text-right">
                      <div className="mb-1 text-[10px] font-black tracking-widest"
                        style={{ color: 'var(--ink-mute)' }}>相手</div>
                      <div className="truncate text-xs font-bold" style={{ color: 'var(--ink)' }}>
                        {oppNames || '—'}
                      </div>
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
