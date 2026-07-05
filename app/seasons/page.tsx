'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Season } from '@/lib/types';

type FormState = { name: string; start_date: string; end_date: string };
const emptyForm: FormState = { name: '', start_date: '', end_date: '' };

export default function SeasonsPage() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeasons = useCallback(async () => {
    const res = await fetch('/api/seasons');
    const data = await res.json();
    setSeasons(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSeasons(); }, [fetchSeasons]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(s: Season) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      start_date: s.start_date ?? '',
      end_date: s.end_date ?? '',
    });
    setError(null);
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function save() {
    if (!form.name.trim()) { setError('シーズン名を入力してください'); return; }
    setSaving(true);
    setError(null);
    const body = {
      name: form.name.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    const res = editingId
      ? await fetch(`/api/seasons/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/seasons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? '保存に失敗しました');
      setSaving(false);
      return;
    }
    await fetchSeasons();
    cancel();
    setSaving(false);
  }

  async function deleteSeason(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    const res = await fetch(`/api/seasons/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error ?? '削除に失敗しました');
      return;
    }
    await fetchSeasons();
  }

  const inputStyle = {
    width: '100%', height: 48, borderRadius: 'var(--r-md)',
    border: '1px solid var(--line)', padding: '0 14px',
    fontSize: 16, background: 'var(--card)', color: 'var(--ink)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center',
            background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)', flexShrink: 0,
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>シーズン管理</h1>
      </div>

      {/* 追加フォーム */}
      {showForm ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
            {editingId ? 'シーズンを編集' : '新しいシーズンを追加'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-sub)' }}>シーズン名 *</label>
            <input
              style={inputStyle}
              placeholder="例：MA-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-sub)' }}>開始日（任意）</label>
              <input
                type="date"
                style={inputStyle}
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-sub)' }}>終了日（任意）</label>
              <input
                type="date"
                style={inputStyle}
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--pb)', fontWeight: 600 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                flex: 1, height: 48, borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: 15,
                background: 'var(--mb)', color: '#fff', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? '保存中…' : '保存'}
            </button>
            <button
              onClick={cancel}
              style={{
                flex: 1, height: 48, borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: 15,
                background: 'var(--card)', color: 'var(--ink-sub)', border: '1px solid var(--line)',
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            height: 52, borderRadius: 'var(--r-lg)',
            border: '2px dashed var(--mb-soft)', background: 'var(--mb-tint)',
            color: 'var(--mb)', fontWeight: 700, fontSize: 15,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>
          シーズンを追加
        </button>
      )}

      {/* シーズン一覧 */}
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--ink-mute)', textAlign: 'center', padding: 24 }}>読み込み中…</p>
      ) : seasons.length === 0 ? (
        <div className="empty">
          <p className="empty-title">シーズンがありません</p>
          <p className="empty-msg">最初のシーズンを追加しましょう</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {seasons.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{s.name}</p>
                {(s.start_date || s.end_date) && (
                  <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
                    {s.start_date ?? '?'} 〜 {s.end_date ?? '?'}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(s)}
                  style={{
                    height: 34, padding: '0 12px', borderRadius: 10,
                    border: '1px solid var(--line)', fontSize: 13, fontWeight: 600,
                    color: 'var(--ink-sub)', background: 'var(--card)',
                  }}
                >
                  編集
                </button>
                <button
                  onClick={() => deleteSeason(s.id, s.name)}
                  style={{
                    height: 34, padding: '0 12px', borderRadius: 10,
                    border: '1px solid var(--pb-soft)', fontSize: 13, fontWeight: 600,
                    color: 'var(--pb)', background: 'var(--pb-soft)',
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
