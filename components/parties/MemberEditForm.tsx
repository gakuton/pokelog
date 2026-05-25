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
      setError(JSON.stringify(j.error));
      setSaving(false);
      return;
    }
    router.push(`/parties/${partyId}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <h1 className="text-xl font-bold text-gray-800">スロット {slot} 編集</h1>
      </div>

      {/* ポケモン名 */}
      <div ref={nameRef} className="relative">
        <label className="mb-1 block text-sm font-medium text-gray-700">ポケモン名</label>
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
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
            {suggestions.map((p) => (
              <li key={p.name}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onMouseDown={() => {
                    setForm((f) => ({ ...f, pokemon_name: p.name }));
                    setNameQuery(p.name);
                    setShowSuggestions(false);
                  }}
                >
                  <span>{p.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{p.types.join('/')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 技 */}
      <div className="grid grid-cols-2 gap-2">
        {(['move1', 'move2', 'move3', 'move4'] as const).map((k, i) => (
          <div key={k}>
            <label className="mb-1 block text-xs text-gray-500">技 {i + 1}</label>
            <input
              type="text"
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
        ))}
      </div>

      {/* 性格・持ち物 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">性格</label>
          <select
            value={form.nature}
            onChange={(e) => setForm((f) => ({ ...f, nature: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="">未設定</option>
            {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">持ち物</label>
          <input
            type="text"
            value={form.held_item}
            onChange={(e) => setForm((f) => ({ ...f, held_item: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 努力値 */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">努力値</label>
          <span className={`text-xs ${evRemaining < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            残り {evRemaining}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {EV_KEYS.map((k, i) => (
            <div key={k}>
              <label className="mb-0.5 block text-xs text-gray-500">
                {STAT_LABELS[STAT_KEYS[i]]}
                {calcStats && (
                  <span className="ml-1 text-red-600">
                    {calcStats[STAT_KEYS[i]]}
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0}
                max={252}
                value={form[k]}
                onChange={(e) => setEv(k, Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? '保存中...' : '保存する'}
      </button>
    </div>
  );
}
