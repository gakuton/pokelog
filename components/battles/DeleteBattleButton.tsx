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
      className="btn sm"
      style={{ border: '1px solid var(--pb-soft)', color: 'var(--pb)', background: 'var(--pb-soft)', opacity: loading ? 0.5 : 1 }}
    >
      削除
    </button>
  );
}
