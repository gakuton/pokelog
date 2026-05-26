'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PokemonMember, PokemonMasterEntry } from '@/lib/types';
import { NATURES, STAT_LABELS } from '@/lib/const';
import { calcAllStats } from '@/lib/calc';

type Props = { partyId: string; slot: number; member: PokemonMember };

const EV_KEYS = ['ev_h', 'ev_a', 'ev_b', 'ev_c', 'ev_d', 'ev_s'] as const;
const STAT_KEYS = ['h', 'a', 'b', 'c', 'd', 's'] as const;

export default function MemberEditForm({ partyId, slot, member }: Props) {
  const router = useRouter();
  const [master, setMaster] = useState<PokemonMasterEntry[]>([]);
  const [form, setForm] = useState({
    pokemon_name: member.pokemon_name ?? '',
    move1: member.move1 ?? '', move2: member.move2 ?? '',
    move3: member.move3 ?? '', move4: member.move4 ?? '',
    nature: member.nature ?? '',
    held_item: member.held_item ?? '',
    ev_h: member.ev_h, ev_a: member.ev_a, ev_b: member.ev_b,
    ev_c: member.ev_c, ev_d: member.ev_d, ev_s: member.ev_s,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nameQuery, setNameQuery] = useState(member.pokemon_name ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/pokemon-master').then((r) => r.json()).then(setMaster);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (nameRef.current && !nameRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const suggestions = nameQuery.length >= 1
    ? master.filter((p) => p.name.includes(nameQuery)).slice(0, 8) : [];

  const currentPokemon = master.find((p) => p.name === form.pokemon_name);
  const evSum = EV_KEYS.reduce((s, k) => s + (form[k] ?? 0), 0);
  const evRemaining = 66 - evSum;

  const calcStats = currentPokemon
    ? calcAllStats(
        currentPokemon.base,
        { h: form.ev_h, a: form.ev_a, b: form.ev_b, c: form.ev_c, d: form.ev_d, s: form.ev_s },
        (form.nature as never) || null,
      )
    : null;

  function setEv(key: typeof EV_KEYS[number], val: number) {
    const clamped = Math.max(0, Math.min(32, val));
    const newSum = evSum - (form[key] ?? 0) + clamped;
    if (newSum > 66) return;
    setForm((f) => ({ ...f, [key]: clamped }));
  }

  async function handleSave() {
    if (!form.pokemon_name.trim()) {
      setError('ポケモン名を入力してください');
      return;
    }
    setSaving(true);
    setError('');
    const has_mega_item = form.held_item.endsWith('ナイト');
    const payload = {
      ...form,
      nature: form.nature || null,
      held_item: form.held_item || null,
      move1: form.move1 || null, move2: form.move2 || null,
      move3: form.move3 || null, move4: form.move4 || null,
      has_mega_item,
    };
    const res = await fetch(`/api/parties/${partyId}/members/${slot}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json();
      const msg = j?.error?.fieldErrors
        ? Object.values(j.error.fieldErrors).flat().join('、')
        : (j?.error ?? '保存に失敗しました');
      setError(String(msg));
      setSaving(false);
      return;
    }
    router.push(`/parties/${partyId}`);
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center',
                   background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>スロット {slot}</h1>
      </div>

      {/* ポケモン名 */}
      <div className="card" style={{ padding: 14 }}>
        <div className="section-label" style={{ margin: '0 0 8px' }}>
          ポケモン名<span style={{ color: 'var(--pb)', marginLeft: 4 }}>*</span>
        </div>
        <div ref={nameRef} style={{ position: 'relative' }}>
          <input type="text" value={nameQuery}
            onChange={(e) => {
              setNameQuery(e.target.value);
              setForm((f) => ({ ...f, pokemon_name: e.target.value }));
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="ガブリアス"
            className="input" />
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
                          background: 'var(--card)', border: '1px solid var(--line)',
                          borderRadius: 14, overflow: 'hidden',
                          boxShadow: '0 10px 30px rgba(43,28,75,0.12)' }}>
              {suggestions.map((p) => (
                <button key={p.name} type="button"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                           padding: '10px 14px', borderBottom: '1px solid var(--line-soft)',
                           textAlign: 'left' }}
                  onMouseDown={() => {
                    setForm((f) => ({ ...f, pokemon_name: p.name }));
                    setNameQuery(p.name);
                    setShowSuggestions(false);
                  }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-sub)' }}>{p.types.join('/')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 技 */}
      <div className="card" style={{ padding: 14 }}>
        <div className="section-label" style={{ margin: '0 0 10px' }}>技 1〜4</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['move1', 'move2', 'move3', 'move4'] as const).map((k, i) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--mb-soft)',
                            color: 'var(--mb-deep)', display: 'grid', placeItems: 'center',
                            fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <input type="text" value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                placeholder={`技 ${i + 1}`} className="input" style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </div>

      {/* 性格・持ち物 */}
      <div className="card" style={{ padding: 14 }}>
        <div className="section-label" style={{ margin: '0 0 10px' }}>性格・持ち物</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">性格</div>
            <select value={form.nature}
              onChange={(e) => setForm((f) => ({ ...f, nature: e.target.value }))}
              className="select" style={{ fontSize: 16 }}>
              <option value="">未設定</option>
              {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">持ち物</div>
            <input type="text" value={form.held_item}
              onChange={(e) => setForm((f) => ({ ...f, held_item: e.target.value }))}
              className="input" style={{ fontSize: 16 }} />
          </div>
        </div>
        {form.held_item.endsWith('ナイト') && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--hb-soft)', borderRadius: 10, padding: '8px 12px',
                        fontSize: 12, fontWeight: 700, color: '#7B5310' }}>
            メガストーンを検出 — メガシンカ可
          </div>
        )}
      </div>

      {/* 努力値 */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-label" style={{ margin: 0 }}>努力値</div>
          <span style={{ fontSize: 12, fontWeight: 800,
                         color: evRemaining < 0 ? 'var(--pb)' : 'var(--ink-sub)' }}>
            {evSum} / 66 {evRemaining < 0 && '⚠ 超過'}
          </span>
        </div>
        <div className="ev-grid">
          {EV_KEYS.map((k, i) => {
            const statKey = STAT_KEYS[i];
            const statVal = calcStats?.[statKey];
            const pct = Math.min(100, ((form[k] ?? 0) / 32) * 100);
            return (
              <div key={k} className="ev-cell">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
                  <span className="ev-label">{STAT_LABELS[statKey]}</span>
                  {statVal && <span className="ev-stat">{statVal}</span>}
                </div>
                <input type="number" min={0} max={32} value={form[k]}
                  onChange={(e) => setEv(k, Number(e.target.value))} />
                <div className="ev-bar"><span style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--pb-soft)', border: '1px solid var(--pb)', borderRadius: 12,
                      padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--pb)' }}>
          {error}
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="btn primary block"
        style={{ height: 56, fontSize: 16 }}>
        {saving ? '保存中...' : '保存する'}
      </button>
    </div>
  );
}
