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
      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50"
    >
      削除
    </button>
  );
}
