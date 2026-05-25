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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-gray-500">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">新しいパーティ</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            パーティ名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ガブリアス軸"
            maxLength={50}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!name.trim() || loading}
          className="w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? '作成中...' : 'パーティを作成'}
        </button>
      </form>
    </div>
  );
}
