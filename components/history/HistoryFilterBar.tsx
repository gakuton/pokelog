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
    setMyVal('');
    setOppVal('');
    startTransition(() => router.push(pathname));
  }

  return (
    <div className="rounded-[18px] border p-4"
      style={{ background: 'var(--card)', borderColor: 'var(--line)',
               boxShadow: '0 4px 14px rgba(45,30,15,0.04)' }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.08em]"
          style={{ color: 'var(--ink-sub)' }}>絞り込み</p>
        {hasActiveFilter && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-black"
            style={{ background: 'var(--mb-soft)', color: 'var(--mb-deep)' }}>
            フィルター適用中
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-bold tracking-wider"
            style={{ color: 'var(--ink-mute)' }}>自分の選出</label>
          <input
            type="text"
            value={myVal}
            onChange={(e) => setMyVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder="ガブリアス"
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--line)',
                     color: 'var(--ink)', fontSize: 16 }}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold tracking-wider"
            style={{ color: 'var(--ink-mute)' }}>相手の選出</label>
          <input
            type="text"
            value={oppVal}
            onChange={(e) => setOppVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder="カイリュー"
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--line)',
                     color: 'var(--ink)', fontSize: 16 }}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={apply}
          className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
          style={{ background: 'var(--mb)' }}
        >
          絞り込む
        </button>
        {hasActiveFilter && (
          <button
            onClick={clear}
            className="rounded-xl border px-4 py-2.5 text-sm font-bold"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-sub)' }}
          >
            クリア
          </button>
        )}
      </div>
    </div>
  );
}
