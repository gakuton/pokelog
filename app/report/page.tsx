'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Party, PokemonWinRate } from '@/lib/types';

type Summary = {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  recent10_win_rate: number;
};

function WinRateTable({
  rows,
  filterParam,
  emptyMsg,
}: {
  rows: PokemonWinRate[];
  filterParam: 'my' | 'opp';
  emptyMsg: string;
}) {
  const router = useRouter();

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
            <tr
              key={r.pokemon_name}
              onClick={() => router.push(`/history?${filterParam}=${encodeURIComponent(r.pokemon_name)}`)}
              className={`cursor-pointer active:bg-gray-50 ${i > 0 ? 'border-t border-gray-50' : ''}`}
            >
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
                  {Number(r.win_rate).toFixed(0)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [partyId, setPartyId] = useState('');
  const [myRates, setMyRates] = useState<PokemonWinRate[]>([]);
  const [oppRates, setOppRates] = useState<PokemonWinRate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/parties')
      .then((r) => r.json())
      .then((ps: Party[]) => setParties(ps));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = partyId ? `?party_id=${partyId}` : '';
    Promise.all([
      fetch(`/api/report/my-pokemon${q}`).then((r) => r.json()),
      fetch(`/api/report/opp-pokemon${q}`).then((r) => r.json()),
      fetch(`/api/report/summary${q}`).then((r) => r.json()),
    ]).then(([my, opp, sum]) => {
      setMyRates(my);
      setOppRates(opp);
      setSummary(sum);
      setLoading(false);
    });
  }, [partyId]);

  return (
    <div className="flex flex-col gap-5 p-4 pb-10">
      <h1 className="text-xl font-bold text-gray-800">レポート</h1>

      {/* パーティフィルター */}
      {parties.length > 0 && (
        <select
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
        >
          <option value="">全パーティ</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* サマリー */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '総試合数', value: String(summary.total) },
            { label: '通算勝率', value: `${summary.win_rate}%` },
            { label: '直近10戦', value: `${summary.recent10_win_rate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center rounded-2xl bg-white p-3 shadow-sm">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="mt-1 text-lg font-bold text-gray-800">{loading ? '—' : value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 自分の選出別勝率 */}
      <section className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-700">
          自分の選出ポケモン別勝率
          <span className="ml-1 text-xs font-normal text-gray-400">（行タップで履歴へ）</span>
        </p>
        {loading ? (
          <p className="py-4 text-center text-sm text-gray-400">読み込み中...</p>
        ) : (
          <WinRateTable rows={myRates} filterParam="my" emptyMsg="データがありません" />
        )}
      </section>

      {/* 相手の選出別勝率 */}
      <section className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-700">
          相手の選出ポケモン別勝率
          <span className="ml-1 text-xs font-normal text-gray-400">（行タップで履歴へ）</span>
        </p>
        {loading ? (
          <p className="py-4 text-center text-sm text-gray-400">読み込み中...</p>
        ) : (
          <WinRateTable rows={oppRates} filterParam="opp" emptyMsg="データがありません" />
        )}
      </section>
    </div>
  );
}
