'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeletePartyButton({ partyId }: { partyId: string }) {
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
      className="rounded-xl px-3 py-1.5 text-xs font-bold disabled:opacity-50"
      style={{ border: '1px solid var(--pb-soft)', color: 'var(--pb)' }}
    >
      削除
    </button>
  );
}
