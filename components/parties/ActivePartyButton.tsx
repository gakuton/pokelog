'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = { partyId: string; isActive: boolean; style?: React.CSSProperties };

export default function ActivePartyButton({ partyId, isActive, style }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/parties/${partyId}/activate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !isActive }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="btn sm"
      style={{
        border: `1px solid ${isActive ? 'var(--sb)' : 'var(--mb-soft)'}`,
        color: isActive ? 'var(--sb)' : 'var(--mb)',
        background: isActive ? '#E8FBF0' : 'var(--mb-tint)',
        opacity: loading ? 0.5 : 1,
        fontWeight: 700,
        ...style,
      }}
    >
      {isActive ? '✓ 利用中' : '利用中にする'}
    </button>
  );
}
