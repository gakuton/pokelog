import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { Battle, WinRateSummary } from '@/lib/types';

type BattleWithNames = Battle & {
  sel1: { pokemon_name: string } | null;
  sel2: { pokemon_name: string } | null;
  sel3: { pokemon_name: string } | null;
};

async function getSummary(): Promise<WinRateSummary | null> {
  const sb = createClient();
  const { data } = await sb.from('win_rate_summary').select('*').single();
  return data as WinRateSummary | null;
}

async function getRecentBattles(): Promise<BattleWithNames[]> {
  const sb = createClient();
  const { data } = await sb
    .from('battles')
    .select(`*, sel1:pokemon_members!battles_my_sel1_id_fkey(pokemon_name),
                  sel2:pokemon_members!battles_my_sel2_id_fkey(pokemon_name),
                  sel3:pokemon_members!battles_my_sel3_id_fkey(pokemon_name)`)
    .order('created_at', { ascending: false })
    .limit(5);
  return (data ?? []) as BattleWithNames[];
}

const RESULT_LABEL: Record<string, string> = { win: '勝', lose: '負', draw: '分' };
const RESULT_CLS: Record<string, string> = {
  win: 'bg-blue-100 text-blue-700',
  lose: 'bg-red-100 text-red-700',
  draw: 'bg-gray-100 text-gray-500',
};

export default async function HomePage() {
  const [summary, battles] = await Promise.all([getSummary(), getRecentBattles()]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-red-600">PokeLog</h1>

      {/* 勝率サマリー */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-medium text-gray-500">勝率サマリー</p>
        {!summary || summary.total_battles === 0 ? (
          <p className="text-sm text-gray-400">対戦記録がありません</p>
        ) : (
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <StatCell label="総戦数" value={`${summary.total_battles} 戦`} />
            <StatCell label="通算勝率" value={`${summary.total_win_rate ?? 0}%`} accent />
            <StatCell
              label="直近10戦"
              value={`${summary.recent10_wins}勝${summary.recent10_draws}分 (${summary.recent10_win_rate ?? 0}%)`}
            />
            <StatCell
              label="レート"
              value={summary.latest_rating != null ? String(summary.latest_rating) : '—'}
              accent
            />
          </div>
        )}
      </section>

      {/* 直近の対戦 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">直近の対戦</p>
          <Link href="/history" className="text-xs text-red-600">
            すべて見る
          </Link>
        </div>
        {battles.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">対戦記録がありません</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {battles.map((b) => {
              const myNames = [b.sel1?.pokemon_name, b.sel2?.pokemon_name, b.sel3?.pokemon_name]
                .filter(Boolean)
                .join(' / ');
              const oppNames = [b.opp_sel1_name, b.opp_sel2_name, b.opp_sel3_name]
                .filter(Boolean)
                .join(' / ');
              return (
                <li key={b.id}>
                  <Link
                    href={`/history/${b.id}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${RESULT_CLS[b.result]}`}
                    >
                      {RESULT_LABEL[b.result]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-gray-600">自: {myNames || '—'}</p>
                      <p className="truncate text-xs text-gray-600">相: {oppNames}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {new Date(b.created_at).toLocaleDateString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* FAB */}
      <Link
        href="/battles/new"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg"
      >
        ＋
      </Link>
    </div>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}
