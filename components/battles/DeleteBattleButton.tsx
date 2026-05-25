'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteBattleButton({ battleId }: { battleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('この対戦記録を削除しますか？')) return;
    setLoading(true);
    await fetch(`/api/battles/${battleId}`, { method: 'DELETE' });
    router.push('/history');
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
