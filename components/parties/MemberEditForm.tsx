'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PokemonMember, PokemonMasterEntry } from '@/lib/types';
import { NATURES, STAT_LABELS } from '@/lib/const';
import { calcAllStats } from '@/lib/calc';

type Props = { partyId: string; slot: number; member: PokemonMember };

const EV_KEYS = ['ev_h', 'ev_a', 'ev_b', 'ev_c', 'ev_d', 'ev_s'] as const;
const STAT_KEYS = ['h', 'a', 'b', 'c', 'd', 's'] as const;

const inputCls = 'w-full rounded-xl border px-3.5 py-3 text-sm transition-colors';
const inputStyle = { background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)', fontSize: 16 };

export default function MemberEditForm({ partyId, slot, member }: Props) {
  const router = useRouter();
  const [master, setMaster] = useState<PokemonMasterEntry[]>([]);
  const [form, setForm] = useState({
    pokemon_name: member.pokemon_name ?? '',
    move1: member.move1 ?? '',
    move2: member.move2 ?? '',
    move3: member.move3 ?? '',
    move4: member.move4 ?? '',
    nature: member.nature ?? '',
    held_item: member.held_item ?? '',
    ev_h: member.ev_h,
    ev_a: member.ev_a,
    ev_b: member.ev_b,
    ev_c: member.ev_c,
    ev_d: member.ev_d,
    ev_s: member.ev_s,
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
    ? master.filter((p) => p.name.includes(nameQuery)).slice(0, 8)
    : [];

  const currentPokemon = master.find((p) => p.name === form.pokemon_name);
  const evSum = EV_KEYS.reduce((s, k) => s + (form[k] ?? 0), 0);
  const evRemaining = 510 - evSum;

  const calcStats = currentPokemon
    ? calcAllStats(
        currentPokemon.base,
        { h: form.ev_h, a: form.ev_a, b: form.ev_b, c: form.ev_c, d: form.ev_d, s: form.ev_s },
        (form.nature as never) || null
      )
    : null;

  function setEv(key: typeof EV_KEYS[number], val: number) {
    const clamped = Math.max(0, Math.min(252, val));
    const newSum = evSum - (form[key] ?? 0) + clamped;
    if (newSum > 510) return;
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
      move1: form.move1 || null,
      move2: form.move2 || null,
      move3: form.move3 || null,
      move4: form.move4 || null,
      has_mega_item,
    };
    const res = await fetch(`/api/parties/${partyId}/members/${slot}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    <div className="flex flex-col gap-5 p-4 pt-5 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>スロット {slot}</h1>
        </div>
      </div>

      {/* ポケモン名 */}
      <div className="rounded-[18px] border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <label className="mb-1.5 block text-xs font-bold tracking-[0.04em]"
          style={{ color: 'var(--ink-sub)' }}>
          ポケモン名<span style={{ color: 'var(--pb)', marginLeft: 4 }}>*</span>
        </label>
        <div ref={nameRef} className="relative">
          <input
            type="text"
            value={nameQuery}
            onChange={(e) => {
              setNameQuery(e.target.value);
              setForm((f) => ({ ...f, pokemon_name: e.target.value }));
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="ガブリアス"
            className={inputCls}
            style={inputStyle}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-[14px] border"
              style={{ background: 'var(--card)', borderColor: 'var(--line)',
                       boxShadow: '0 10px 30px rgba(43,28,75,0.12)' }}>
              {suggestions.map((p) => (
                <li key={p.name} className="border-b last:border-0"
                  style={{ borderColor: 'var(--line-soft)' }}>
                  <button type="button"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm"
                    style={{ color: 'var(--ink)' }}
                    onMouseDown={() => {
                      setForm((f) => ({ ...f, pokemon_name: p.name }));
                      setNameQuery(p.name);
                      setShowSuggestions(false);
                    }}>
                    <span className="font-bold">{p.name}</span>
                    <span className="text-xs" style={{ color: 'var(--ink-sub)' }}>{p.types.join('/')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 技 */}
      <div className="rounded-[18px] border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <p className="mb-3 text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>技 1〜4</p>
        <div className="flex flex-col gap-2.5">
          {(['move1', 'move2', 'move3', 'move4'] as const).map((k, i) => (
            <div key={k} className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                style={{ background: 'var(--mb-soft)', color: 'var(--mb-deep)' }}>
                {i + 1}
              </div>
              <input type="text" value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                placeholder={`技 ${i + 1}`}
                className={inputCls} style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      {/* 性格・持ち物 */}
      <div className="rounded-[18px] border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <p className="mb-3 text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>性格・持ち物</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--ink-sub)' }}>性格</label>
            <select value={form.nature}
              onChange={(e) => setForm((f) => ({ ...f, nature: e.target.value }))}
              className={inputCls} style={inputStyle}>
              <option value="">未設定</option>
              {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold" style={{ color: 'var(--ink-sub)' }}>持ち物</label>
            <input type="text" value={form.held_item}
              onChange={(e) => setForm((f) => ({ ...f, held_item: e.target.value }))}
              className={inputCls} style={inputStyle} />
          </div>
        </div>
        {form.held_item.endsWith('ナイト') && (
          <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold"
            style={{ background: 'var(--hb-soft)', color: '#7B5310' }}>
            メガストーンを検出 — メガシンカ可
          </div>
        )}
      </div>

      {/* 努力値 */}
      <div className="rounded-[18px] border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>努力値</p>
          <span className="text-xs font-black"
            style={{ color: evRemaining < 0 ? 'var(--pb)' : 'var(--ink-sub)' }}>
            合計 {evSum} / 510 {evRemaining < 0 && '⚠ 超過'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {EV_KEYS.map((k, i) => {
            const statKey = STAT_KEYS[i];
            const statVal = calcStats?.[statKey];
            const pct = Math.min(100, ((form[k] ?? 0) / 252) * 100);
            return (
              <div key={k} className="rounded-[10px] border p-2"
                style={{ background: 'var(--card-soft)', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black tracking-wider"
                    style={{ color: 'var(--ink-sub)' }}>
                    {STAT_LABELS[statKey]}
                  </span>
                  {statVal && (
                    <span className="text-[11px] font-black" style={{ color: 'var(--mb-deep)' }}>
                      {statVal}
                    </span>
                  )}
                </div>
                <input type="number" min={0} max={252} value={form[k]}
                  onChange={(e) => setEv(k, Number(e.target.value))}
                  className="w-full border-none bg-transparent text-center font-bold text-sm"
                  style={{ color: 'var(--ink)', fontSize: 15, outline: 'none' }} />
                <div className="mt-1 h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'var(--bg-warm)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: 'var(--mb)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{ background: 'var(--pb-soft)', color: 'var(--pb)' }}>
          {error}
        </p>
      )}

      <button onClick={handleSave} disabled={saving}
        className="flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-white disabled:opacity-50"
        style={{ background: 'var(--mb)', boxShadow: '0 6px 18px rgba(91,47,176,0.35)' }}>
        {saving ? '保存中...' : '保存する'}
      </button>
    </div>
  );
}
