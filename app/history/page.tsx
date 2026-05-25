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
    .select(`
      *,
      sel1:my_sel1_id(pokemon_name),
      sel2:my_sel2_id(pokemon_name),
      sel3:my_sel3_id(pokemon_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (opp) {
    q = q.or(
      `opp_sel1_name.ilike.%${opp}%,opp_sel2_name.ilike.%${opp}%,opp_sel3_name.ilike.%${opp}%`,
    );
  }

  const { data } = await q;
  let rows = (data ?? []) as BattleRow[];

  if (my) {
    const myLower = my.toLowerCase();
    rows = rows.filter((b) =>
      [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name].some((n) =>
        n?.toLowerCase().includes(myLower),
      ),
    );
  }

  return rows;
}

const RESULT_CHIP: Record<string, { label: string; bg: string; color: string }> = {
  win:  { label: '勝', bg: 'var(--sb)',      color: '#fff' },
  lose: { label: '負', bg: 'var(--pb)',      color: '#fff' },
  draw: { label: '分', bg: 'var(--ink-sub)', color: '#fff' },
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ my?: string; opp?: string }>;
}) {
  const { my, opp } = await searchParams;
  const battles = await getBattles(my, opp);

  return (
    <div className="flex flex-col gap-4 p-4 pb-10 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>対戦履歴</h1>
        <Link
          href="/battles/new"
          className="rounded-xl px-3.5 py-2 text-sm font-bold text-white"
          style={{ background: 'var(--mb)', boxShadow: '0 4px 12px rgba(91,47,176,0.30)' }}
        >
          ＋ 記録
        </Link>
      </div>

      <Suspense>
        <HistoryFilterBar />
      </Suspense>

      {battles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
            style={{ background: 'var(--bg-warm)' }}>
            📋
          </div>
          <p className="font-bold" style={{ color: 'var(--ink)' }}>
            {my || opp ? '条件に一致する対戦がありません' : '対戦記録がありません'}
          </p>
          {!my && !opp && (
            <p className="text-sm" style={{ color: 'var(--ink-mute)' }}>
              対戦を記録して履歴を積み上げましょう
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {battles.map((b) => {
            const chip = RESULT_CHIP[b.result] ?? RESULT_CHIP.draw;
            const myNames = [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name]
              .filter(Boolean);
            const oppNames = [b.opp_sel1_name, b.opp_sel2_name, b.opp_sel3_name].filter(Boolean);
            const date = new Date(b.created_at).toLocaleDateString('ja-JP', {
              month: 'numeric',
              day: 'numeric',
            });
            return (
              <Link
                key={b.id}
                href={`/history/${b.id}`}
                className="flex flex-col gap-2.5 rounded-[18px] border p-4"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--line)',
                  boxShadow: '0 4px 14px rgba(45,30,15,0.04)',
                }}
              >
                {/* Meta row */}
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: chip.bg, color: chip.color }}
                  >
                    {chip.label}
                  </span>
                  <span className="text-sm font-bold"
                    style={{ color: chip.bg === 'var(--sb)' ? 'var(--sb)' : chip.bg === 'var(--pb)' ? 'var(--pb)' : 'var(--ink-sub)' }}>
                    {b.result === 'win' ? '勝利' : b.result === 'lose' ? '敗北' : '引き分け'}
                  </span>
                  {b.rating_after && (
                    <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-black"
                      style={{ background: 'var(--bg-warm)', color: 'var(--ink-sub)' }}>
                      {b.rating_after}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--ink-mute)' }}>{date}</span>
                </div>
                {/* Versus row */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black tracking-wider"
                      style={{ color: 'var(--ink-sub)' }}>自分</span>
                    <span className="text-xs font-bold leading-relaxed"
                      style={{ color: 'var(--ink)' }}>
                      {myNames.join(' · ') || '—'}
                    </span>
                  </div>
                  <div className="flex h-full items-center px-1">
                    <span className="text-[11px] font-black tracking-wider"
                      style={{ color: 'var(--ink-mute)' }}>VS</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-[10px] font-black tracking-wider"
                      style={{ color: 'var(--ink-sub)' }}>相手</span>
                    <span className="text-xs font-bold leading-relaxed"
                      style={{ color: 'var(--ink)' }}>
                      {oppNames.join(' · ') || '—'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          <p className="py-2 text-center text-xs" style={{ color: 'var(--ink-mute)' }}>
            すべての対戦を表示しています
          </p>
        </div>
      )}
    </div>
  );
}
