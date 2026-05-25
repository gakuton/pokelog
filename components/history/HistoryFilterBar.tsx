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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={myVal}
          onChange={(e) => setMyVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="自分の選出"
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
        <input
          type="text"
          value={oppVal}
          onChange={(e) => setOppVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="相手の選出"
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={apply}
          className="flex-1 rounded-xl bg-gray-800 py-2 text-sm font-medium text-white"
        >
          絞り込む
        </button>
        {hasActiveFilter && (
          <button
            onClick={clear}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600"
          >
            クリア
          </button>
        )}
      </div>
    </div>
  );
}
