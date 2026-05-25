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

const sectionStyle = {
  background: 'var(--card)',
  borderColor: 'var(--line)',
  boxShadow: '0 4px 14px rgba(45,30,15,0.04)',
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
    return (
      <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-mute)' }}>
        {emptyMsg}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {rows.map((r, i) => {
        const pct = Number(r.win_rate);
        const isGood = pct >= 60;
        const isWeak = pct <= 40;
        const barColor = isGood ? 'var(--sb)' : isWeak ? 'var(--pb)' : 'var(--mb)';
        const textColor = isGood ? 'var(--sb)' : isWeak ? 'var(--pb)' : 'var(--ink)';

        return (
          <button
            key={r.pokemon_name}
            onClick={() =>
              router.push(`/history?${filterParam}=${encodeURIComponent(r.pokemon_name)}`)
            }
            className="flex items-center gap-3 border-b py-3 text-left last:border-0"
            style={{ borderColor: 'var(--line-soft)' }}
          >
            <span className="w-5 text-right text-[10px] font-black shrink-0"
              style={{ color: 'var(--ink-mute)' }}>{i + 1}</span>
            <span className="w-[6.5rem] shrink-0 text-sm font-bold truncate"
              style={{ color: 'var(--ink)' }}>
              {r.pokemon_name}
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--bg-warm)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(4, pct)}%`, background: barColor }}
                />
              </div>
            </div>
            <span className="shrink-0 text-xs" style={{ color: 'var(--ink-mute)' }}>
              {r.count}戦
            </span>
            <span
              className="w-12 shrink-0 text-right text-sm font-black"
              style={{ color: textColor }}
            >
              {pct.toFixed(0)}%
            </span>
          </button>
        );
      })}
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
  const [tab, setTab] = useState<'my' | 'opp'>('my');

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
      setMyRates(Array.isArray(my) ? my : []);
      setOppRates(Array.isArray(opp) ? opp : []);
      setSummary(sum && typeof sum === 'object' && 'total' in sum ? sum : null);
      setLoading(false);
    });
  }, [partyId]);

  const winRatePct = summary?.win_rate ?? 0;
  const winRateColor = winRatePct >= 60 ? 'var(--sb)' : winRatePct <= 40 ? 'var(--pb)' : 'var(--mb)';

  return (
    <div className="flex flex-col gap-4 p-4 pb-10 pt-5">
      <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>レポート</h1>

      {/* パーティフィルター */}
      {parties.length > 0 && (
        <div className="rounded-[18px] border p-4" style={sectionStyle}>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.08em]"
            style={{ color: 'var(--ink-sub)' }}>集計対象パーティ</p>
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="w-full rounded-xl border px-3.5 py-3 text-sm"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
              fontSize: 16,
            }}
          >
            <option value="">全パーティ</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* サマリー */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '総試合数', value: String(summary.total), color: 'var(--ink)' },
            { label: '通算勝率', value: `${summary.win_rate}%`, color: winRateColor },
            {
              label: '直近10戦',
              value: `${summary.recent10_win_rate}%`,
              color:
                summary.recent10_win_rate >= 60
                  ? 'var(--sb)'
                  : summary.recent10_win_rate <= 40
                    ? 'var(--pb)'
                    : 'var(--mb)',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-[18px] border p-3.5"
              style={sectionStyle}
            >
              <span className="text-[10px] font-bold" style={{ color: 'var(--ink-sub)' }}>
                {label}
              </span>
              <span
                className="mt-1.5 text-xl font-black"
                style={{ color: loading ? 'var(--ink-mute)' : color }}
              >
                {loading ? '—' : value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex rounded-xl p-1"
        style={{ background: 'var(--bg-warm)' }}>
        {(['my', 'opp'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-[10px] py-2 text-sm font-bold transition-all"
            style={
              tab === t
                ? { background: 'var(--card)', color: 'var(--mb)',
                    boxShadow: '0 2px 8px rgba(43,28,75,0.10)' }
                : { background: 'transparent', color: 'var(--ink-sub)' }
            }
          >
            {t === 'my' ? '自分の選出' : '相手の選出'}
          </button>
        ))}
      </div>

      {/* Win rate table */}
      <div className="rounded-[18px] border px-4" style={sectionStyle}>
        <div className="py-3 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--line-soft)' }}>
          <p className="text-[11px] font-black uppercase tracking-[0.08em]"
            style={{ color: 'var(--ink-sub)' }}>
            {tab === 'my' ? '選出ポケモン別勝率' : '相手選出ポケモン別勝率'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--ink-mute)' }}>
            タップで履歴へ
          </p>
        </div>
        {loading ? (
          <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-mute)' }}>
            読み込み中...
          </p>
        ) : (
          <WinRateTable
            rows={tab === 'my' ? myRates : oppRates}
            filterParam={tab}
            emptyMsg="データがありません"
          />
        )}
      </div>
    </div>
  );
}
