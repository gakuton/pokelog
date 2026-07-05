'use client';

import { useState, useEffect } from 'react';
import type { Season } from '@/lib/types';

interface Props {
  partyId: string;
  initialSeasonId: string | null;
  initialSeasonName: string | null;
}

export default function SeasonSelector({ partyId, initialSeasonId, initialSeasonName }: Props) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialSeasonId ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = selectedId !== (initialSeasonId ?? '');

  useEffect(() => {
    fetch('/api/seasons').then((r) => r.json()).then(setSeasons);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch(`/api/parties/${partyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ season_id: selectedId || null }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? '保存に失敗しました');
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: 'var(--ink-sub)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        シーズン
      </span>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setSaved(false); setError(null); }}
          disabled={saving}
          style={{
            flex: 1, height: 44, borderRadius: 'var(--r-md)',
            border: `1px solid ${isDirty ? 'var(--mb)' : 'var(--line)'}`,
            padding: '0 12px', fontSize: 16,
            background: 'var(--card)', color: 'var(--ink)',
          }}
        >
          <option value="">未割当</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          style={{
            height: 44, padding: '0 16px', borderRadius: 'var(--r-md)',
            fontWeight: 700, fontSize: 14, flexShrink: 0,
            background: isDirty ? 'var(--mb)' : 'var(--bg-warm)',
            color: isDirty ? '#fff' : 'var(--ink-mute)',
            border: 'none',
            opacity: saving ? 0.6 : 1,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      {saved && (
        <p style={{ fontSize: 12, color: 'var(--sb)', fontWeight: 600 }}>✓ シーズンを更新しました</p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: 'var(--pb)', fontWeight: 600 }}>{error}</p>
      )}
      {seasons.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
          シーズンを追加するには <a href="/seasons" style={{ color: 'var(--mb)' }}>シーズン管理</a> へ
        </p>
      )}
    </div>
  );
}
