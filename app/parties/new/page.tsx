'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Party, PokemonMember } from '@/lib/types';

type SourceParty = Party & { pokemon_members: PokemonMember[] };

function NewPartyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from');

  const [name, setName] = useState('');
  const [sourceMembers, setSourceMembers] = useState<PokemonMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!fromId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fromId) return;
    setFetching(true);
    fetch(`/api/parties/${fromId}`)
      .then((r) => r.json())
      .then((data: SourceParty) => {
        setName(data.name ?? '');
        setSourceMembers(
          [...(data.pokemon_members ?? [])].sort((a, b) => a.slot - b.slot)
        );
      })
      .finally(() => setFetching(false));
  }, [fromId]);

  const isDuplicate = !!fromId;

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

      if (isDuplicate) {
        const filled = sourceMembers.filter((m) => m.pokemon_name);
        await Promise.all(
          filled.map((m) =>
            fetch(`/api/parties/${party.id}/members/${m.slot}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pokemon_name: m.pokemon_name,
                move1: m.move1,
                move2: m.move2,
                move3: m.move3,
                move4: m.move4,
                nature: m.nature,
                held_item: m.held_item,
                ev_h: m.ev_h,
                ev_a: m.ev_a,
                ev_b: m.ev_b,
                ev_c: m.ev_c,
                ev_d: m.ev_d,
                ev_s: m.ev_s,
                has_mega_item: m.has_mega_item,
              }),
            })
          )
        );
      }

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
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
          {isDuplicate ? 'パーティを複製' : '新しいパーティ'}
        </h1>
      </div>

      {fetching ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)' }}>読み込み中...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label" style={{ margin: '0 0 8px' }}>パーティ名</div>
            <input type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ガブリアス軸"
              maxLength={50}
              className="input" />
            {isDuplicate && sourceMembers.filter((m) => m.pokemon_name).length > 0 && (
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-sub)', lineHeight: 1.6 }}>
                {sourceMembers.filter((m) => m.pokemon_name).map((m) => m.pokemon_name).join('・')} をコピーします
              </p>
            )}
            {!isDuplicate && (
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-sub)', lineHeight: 1.6 }}>
                パーティを作成後、各スロットにポケモンを登録してください
              </p>
            )}
          </div>

          {error && (
            <div style={{ background: 'var(--pb-soft)', borderRadius: 12,
                          padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--pb)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={!name.trim() || loading}
            className="btn primary block" style={{ height: 56, fontSize: 16 }}>
            {loading
              ? (isDuplicate ? '複製中...' : '作成中...')
              : (isDuplicate ? 'パーティを複製して作成' : 'パーティを作成')}
          </button>
        </form>
      )}
    </div>
  );
}

export default function NewPartyPage() {
  return (
    <Suspense>
      <NewPartyForm />
    </Suspense>
  );
}
