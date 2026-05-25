'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Party, PokemonWinRate } from '@/lib/types';

type Summary = {
  total: number; wins: number; losses: number; draws: number;
  win_rate: number; recent10_win_rate: number;
};

function Donut({ value, color, size = 92 }: { value: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(100, Math.max(0, value)) / 100;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" />
    </svg>
  );
}

function WinRateRow({ r, onClick }: { r: PokemonWinRate; onClick: () => void }) {
  const pct = Number(r.win_rate);
  const bucket = pct >= 60 ? 'good' : pct >= 45 ? 'mid' : 'weak';
  return (
    <button onClick={onClick} className={`stat-row ${bucket}`} style={{ width: '100%', textAlign: 'left' }}>
      <span className="name">{r.pokemon_name}</span>
      <span className="count">{r.count}回</span>
      <div className="bar">
        <span style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <span className="pct">{pct.toFixed(1)}%</span>
    </button>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [partyId, setPartyId] = useState('');
  const [myRates, setMyRates] = useState<PokemonWinRate[]>([]);
  const [oppRates, setOppRates] = useState<PokemonWinRate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'opp'>('my');

  useEffect(() => {
    fetch('/api/parties').then((r) => r.json()).then((ps: Party[]) => setParties(ps));
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

  const totalWinRate = summary?.win_rate ?? 0;
  const recentWinRate = summary?.recent10_win_rate ?? 0;
  const rows = tab === 'my' ? myRates : oppRates;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>レポート</h1>

      {/* Party filter */}
      {parties.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: '0 0 8px' }}>集計対象パーティ</div>
          <select value={partyId} onChange={(e) => setPartyId(e.target.value)} className="select">
            <option value="">全パーティ</option>
            {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* Ring cards */}
      {summary && !loading && (
        <>
          <div className="ring-card">
            <div className="ring-wrap">
              <Donut value={totalWinRate} color="var(--mb)" />
              <div className="ring-text">
                <span className="pct">{totalWinRate.toFixed(0)}%</span>
                <span className="lbl">通算</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-sub)' }}>通算戦績</div>
              <div style={{ fontFamily: 'var(--font-num)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                {summary.wins}<span style={{ fontSize: 13, color: 'var(--ink-sub)', marginLeft: 2 }}>勝</span>
                {' '}
                {summary.losses}<span style={{ fontSize: 13, color: 'var(--ink-sub)', marginLeft: 2 }}>敗</span>
                {summary.draws > 0 && (
                  <>{' '}{summary.draws}<span style={{ fontSize: 13, color: 'var(--ink-sub)', marginLeft: 2 }}>分</span></>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-sub)', marginTop: 4 }}>計 {summary.total} 戦</div>
            </div>
          </div>

          <div className="ring-card">
            <div className="ring-wrap">
              <Donut value={recentWinRate} color="var(--sb)" size={92} />
              <div className="ring-text">
                <span className="pct" style={{ color: 'var(--sb)' }}>{recentWinRate.toFixed(0)}%</span>
                <span className="lbl">直近10</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-sub)' }}>直近10戦の勝率</div>
              <div style={{ fontFamily: 'var(--font-num)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                {recentWinRate.toFixed(0)}%
              </div>
            </div>
          </div>
        </>
      )}
      {loading && (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)' }}>読み込み中...</p>
        </div>
      )}

      {/* Pill tabs */}
      <div className="pill-tabs">
        <button className={`pill ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
          自分の選出
        </button>
        <button className={`pill ${tab === 'opp' ? 'active' : ''}`} onClick={() => setTab('opp')}>
          相手の選出
        </button>
      </div>

      {/* Stat rows */}
      <div className="card" style={{ padding: '4px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 4px 8px', borderBottom: '1px solid var(--line-soft)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-sub)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {tab === 'my' ? '選出ポケモン別勝率' : '相手選出ポケモン別勝率'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>タップで履歴へ</span>
        </div>
        {loading ? (
          <p style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-mute)' }}>読み込み中...</p>
        ) : rows.length === 0 ? (
          <p style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-mute)' }}>データがありません</p>
        ) : (
          rows.map((r) => (
            <WinRateRow
              key={r.pokemon_name}
              r={r}
              onClick={() => router.push(`/history?${tab}=${encodeURIComponent(r.pokemon_name)}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
