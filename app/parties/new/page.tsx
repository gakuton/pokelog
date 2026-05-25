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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center',
                   background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>新しいパーティ</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="section-label" style={{ margin: '0 0 8px' }}>パーティ名</div>
          <input type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ガブリアス軸"
            maxLength={50}
            className="input" />
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-sub)', lineHeight: 1.6 }}>
            パーティを作成後、各スロットにポケモンを登録してください
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--pb-soft)', borderRadius: 12,
                        padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--pb)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={!name.trim() || loading}
          className="btn primary block" style={{ height: 56, fontSize: 16 }}>
          {loading ? '作成中...' : 'パーティを作成'}
        </button>
      </form>
    </div>
  );
}
