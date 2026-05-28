'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeletePartyButton({ partyId, style }: { partyId: string; style?: React.CSSProperties }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('このパーティを削除しますか？')) return;
    setLoading(true);
    await fetch(`/api/parties/${partyId}`, { method: 'DELETE' });
    router.push('/parties');
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn sm"
      style={{ border: '1px solid var(--pb-soft)', color: 'var(--pb)', background: 'var(--pb-soft)', opacity: loading ? 0.5 : 1, ...style }}
    >
      削除
    </button>
  );
}
