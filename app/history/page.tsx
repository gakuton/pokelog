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

const RESULT_BADGE: Record<string, { label: string; cls: string }> = {
  win: { label: '勝', cls: 'bg-blue-100 text-blue-700' },
  lose: { label: '負', cls: 'bg-red-100 text-red-700' },
  draw: { label: '分', cls: 'bg-gray-100 text-gray-600' },
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ my?: string; opp?: string }>;
}) {
  const { my, opp } = await searchParams;
  const battles = await getBattles(my, opp);

  return (
    <div className="flex flex-col gap-4 p-4 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">対戦履歴</h1>
        <Link
          href="/battles/new"
          className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-bold text-white"
        >
          ＋ 記録する
        </Link>
      </div>

      <Suspense>
        <HistoryFilterBar />
      </Suspense>

      {battles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-4xl">📋</p>
          <p className="font-semibold text-gray-700">
            {my || opp ? '条件に一致する対戦がありません' : '対戦記録がありません'}
          </p>
          {!my && !opp && (
            <p className="text-sm text-gray-500">対戦を記録して履歴を積み上げましょう</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {battles.map((b) => {
            const badge = RESULT_BADGE[b.result] ?? RESULT_BADGE.draw;
            const myNames = [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name]
              .filter(Boolean)
              .join(' / ');
            const oppNames = [b.opp_sel1_name, b.opp_sel2_name, b.opp_sel3_name]
              .filter(Boolean)
              .join(' / ');
            const date = new Date(b.created_at).toLocaleDateString('ja-JP', {
              month: 'numeric',
              day: 'numeric',
            });
            return (
              <Link
                key={b.id}
                href={`/history/${b.id}`}
                className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${badge.cls}`}
                >
                  {badge.label}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-medium text-gray-800">{myNames || '—'}</p>
                  <p className="truncate text-xs text-gray-500">vs {oppNames || '—'}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{date}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
