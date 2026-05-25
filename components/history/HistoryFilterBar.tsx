'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function HistoryFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [myVal, setMyVal] = useState(params.get('my') ?? '');
  const [oppVal, setOppVal] = useState(params.get('opp') ?? '');
  const [, startTransition] = useTransition();

  const hasActiveFilter = !!params.get('my') || !!params.get('opp');

  function apply() {
    const q = new URLSearchParams();
    if (myVal) q.set('my', myVal);
    if (oppVal) q.set('opp', oppVal);
    const qs = q.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  function clear() {
    setMyVal(''); setOppVal('');
    startTransition(() => router.push(pathname));
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="section-label" style={{ margin: 0 }}>絞り込み</span>
        {hasActiveFilter && <span className="badge tag">フィルター適用中</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div className="field" style={{ margin: 0 }}>
          <div className="field-label">自分の選出</div>
          <input type="text" value={myVal}
            onChange={(e) => setMyVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder="ガブリアス" className="input" style={{ fontSize: 16 }} />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <div className="field-label">相手の選出</div>
          <input type="text" value={oppVal}
            onChange={(e) => setOppVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder="カイリュー" className="input" style={{ fontSize: 16 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={apply} className="btn primary"
          style={{ flex: 1, height: 44 }}>
          絞り込む
        </button>
        {hasActiveFilter && (
          <button onClick={clear} className="btn ghost"
            style={{ height: 44, padding: '0 16px' }}>
            クリア
          </button>
        )}
      </div>
    </div>
  );
}
