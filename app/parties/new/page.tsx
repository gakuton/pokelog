'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPartyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('作成に失敗しました');
      const party = await res.json();
      router.push(`/parties/${party.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '作成に失敗しました');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 pt-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
          ←
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>新しいパーティ</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-[18px] border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <label className="mb-1.5 block text-xs font-bold tracking-[0.04em]"
            style={{ color: 'var(--ink-sub)' }}>
            パーティ名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ガブリアス軸"
            maxLength={50}
            className="w-full rounded-xl border px-3.5 py-3 text-sm transition-colors"
            style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)',
                     fontSize: 16 }}
          />
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--ink-sub)' }}>
            パーティを作成後、各スロットにポケモンを登録してください
          </p>
        </div>

        {error && (
          <p className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: 'var(--pb-soft)', color: 'var(--pb)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || loading}
          className="flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--mb)', boxShadow: '0 6px 18px rgba(91,47,176,0.35)' }}
        >
          {loading ? '作成中...' : 'パーティを作成'}
        </button>
      </form>
    </div>
  );
}
