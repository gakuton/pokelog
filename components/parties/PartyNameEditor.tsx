'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PartyNameEditor({ partyId, initialName }: { partyId: string; initialName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) { setEditing(false); setName(initialName); return; }
    setSaving(true);
    await fetch(`/api/parties/${partyId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setName(initialName); } }}
          style={{
            fontSize: 18, fontWeight: 700, color: 'var(--ink)',
            border: '1.5px solid var(--mb)', borderRadius: 8,
            padding: '4px 8px', background: 'var(--card)', width: 160,
          }}
        />
        <button onClick={save} disabled={saving}
          style={{ height: 32, padding: '0 12px', borderRadius: 8, background: 'var(--mb)',
                   color: '#fff', fontWeight: 700, fontSize: 13 }}>
          {saving ? '…' : '保存'}
        </button>
        <button onClick={() => { setEditing(false); setName(initialName); }}
          style={{ height: 32, padding: '0 10px', borderRadius: 8, background: 'var(--card)',
                   border: '1px solid var(--line)', color: 'var(--ink-sub)', fontWeight: 700, fontSize: 13 }}>
          ✕
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{initialName}</h1>
      <button onClick={() => setEditing(true)}
        style={{ width: 28, height: 28, borderRadius: 14, display: 'grid', placeItems: 'center',
                 background: 'var(--mb-tint)', border: '1px solid var(--mb-soft)', color: 'var(--mb)' }}
        aria-label="パーティ名を編集">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
