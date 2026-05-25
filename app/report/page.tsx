import { createClient } from '@/lib/supabase';
import type { PokemonWinRate } from '@/lib/types';

async function getMyWinRates(): Promise<PokemonWinRate[]> {
  const sb = createClient();
  const { data } = await sb.rpc('get_pokemon_win_rates');
  return (data ?? []) as PokemonWinRate[];
}

async function getOppWinRates(): Promise<PokemonWinRate[]> {
  const sb = createClient();
  const { data } = await sb.rpc('get_opp_pokemon_win_rates');
  return (data ?? []) as PokemonWinRate[];
}

function WinRateTable({ rows, emptyMsg }: { rows: PokemonWinRate[]; emptyMsg: string }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">{emptyMsg}</p>;
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-500">
            <th className="px-4 py-2.5 text-left">ポケモン</th>
            <th className="px-3 py-2.5 text-right">試合</th>
            <th className="px-3 py-2.5 text-right">勝利</th>
            <th className="px-3 py-2.5 text-right">勝率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.pokemon_name} className={i > 0 ? 'border-t border-gray-50' : ''}>
              <td className="px-4 py-2.5 font-medium text-gray-800">{r.pokemon_name}</td>
              <td className="px-3 py-2.5 text-right text-gray-600">{r.count}</td>
              <td className="px-3 py-2.5 text-right text-gray-600">{r.wins}</td>
              <td className="px-3 py-2.5 text-right">
                <span
                  className={`font-semibold ${
                    r.win_rate >= 60
                      ? 'text-blue-600'
                      : r.win_rate <= 40
                      ? 'text-red-500'
                      : 'text-gray-700'
                  }`}
                >
                  {r.win_rate.toFixed(0)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ReportPage() {
  const [myRates, oppRates] = await Promise.all([getMyWinRates(), getOppWinRates()]);

  return (
    <div className="flex flex-col gap-6 p-4 pb-10">
      <h1 className="text-xl font-bold text-gray-800">レポート</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-700">自分の選出ポケモン別勝率</h2>
        <WinRateTable rows={myRates} emptyMsg="対戦記録がありません" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-700">相手の選出ポケモン別勝率</h2>
        <WinRateTable rows={oppRates} emptyMsg="対戦記録がありません" />
      </section>
    </div>
  );
}
