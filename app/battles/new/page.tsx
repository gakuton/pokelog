'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Party, PokemonMember, PokemonMasterEntry } from '@/lib/types';
import PokemonCombobox from '@/components/battles/PokemonCombobox';

type SelSlot = { memberId: string | null; name: string; mega: boolean };
type OppSlot = { name: string; mega: boolean };

const EMPTY_SEL: SelSlot = { memberId: null, name: '', mega: false };
const EMPTY_OPP: OppSlot = { name: '', mega: false };

export default function NewBattlePage() {
  const router = useRouter();
  const [master, setMaster] = useState<PokemonMasterEntry[]>([]);
  const [parties, setParties] = useState<(Party & { pokemon_members: PokemonMember[] })[]>([]);
  const [partyId, setPartyId] = useState('');
  const [mySlots, setMySlots] = useState<SelSlot[]>([EMPTY_SEL, EMPTY_SEL, EMPTY_SEL]);
  const [oppParty, setOppParty] = useState<string[]>(Array(6).fill(''));
  const [oppSlots, setOppSlots] = useState<OppSlot[]>([EMPTY_OPP, EMPTY_OPP, EMPTY_OPP]);
  const [intent, setIntent] = useState('');
  const [result, setResult] = useState<'win' | 'lose' | 'draw'>('win');
  const [reflection, setReflection] = useState('');
  const [ratingAfter, setRatingAfter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/pokemon-master').then((r) => r.json()),
      fetch('/api/parties').then((r) => r.json()),
    ]).then(([m, p]) => {
      setMaster(m);
      setParties(p);
      if (p.length > 0) setPartyId(p[0].id);
    });
  }, []);

  const currentParty = parties.find((p) => p.id === partyId);
  const partyMembers: PokemonMember[] = currentParty?.pokemon_members
    ? [...currentParty.pokemon_members].sort((a, b) => a.slot - b.slot)
    : [];

  function toggleMyMember(idx: number, member: PokemonMember) {
    setMySlots((prev) => {
      const next = [...prev];
      const already = next.findIndex((s) => s.memberId === member.id);
      if (already !== -1) {
        next[already] = EMPTY_SEL;
      } else {
        next[idx] = { memberId: member.id, name: member.pokemon_name, mega: false };
      }
      return next;
    });
  }

  function setMyMega(idx: number, v: boolean) {
    setMySlots((prev) => prev.map((s, i) => (i === idx ? { ...s, mega: v } : s)));
  }

  function setOppSlotName(idx: number, name: string) {
    setOppSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, name } : s)));
  }

  function setOppMega(idx: number, v: boolean) {
    setOppSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, mega: v } : s)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (oppSlots.some((s) => !s.name)) {
      setError('相手の選出3体をすべて入力してください');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      party_id: partyId || null,
      my_sel1_id: mySlots[0].memberId,
      my_sel2_id: mySlots[1].memberId,
      my_sel3_id: mySlots[2].memberId,
      my_sel1_mega: mySlots[0].mega,
      my_sel2_mega: mySlots[1].mega,
      my_sel3_mega: mySlots[2].mega,
      opp_party_json: oppParty.filter(Boolean).length > 0 ? oppParty.filter(Boolean) : null,
      opp_sel1_name: oppSlots[0].name,
      opp_sel2_name: oppSlots[1].name,
      opp_sel3_name: oppSlots[2].name,
      opp_sel1_mega: oppSlots[0].mega,
      opp_sel2_mega: oppSlots[1].mega,
      opp_sel3_mega: oppSlots[2].mega,
      selection_intent: intent || null,
      result,
      reflection: reflection || null,
      rating_after: ratingAfter ? Number(ratingAfter) : null,
    };

    const res = await fetch('/api/battles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(JSON.stringify(j.error));
      setSaving(false);
      return;
    }
    const battle = await res.json();
    router.push(`/history/${battle.id}`);
    router.refresh();
  }

  const RESULT_OPTS: { v: 'win' | 'lose' | 'draw'; label: string; cls: string }[] = [
    { v: 'win', label: '勝ち', cls: 'bg-blue-600 text-white' },
    { v: 'lose', label: '負け', cls: 'bg-red-600 text-white' },
    { v: 'draw', label: '引き分け', cls: 'bg-gray-600 text-white' },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 pb-10">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <h1 className="text-xl font-bold text-gray-800">対戦記録</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* パーティ選択 */}
        {parties.length > 0 && (
          <Section title="使用パーティ">
            <select
              value={partyId}
              onChange={(e) => { setPartyId(e.target.value); setMySlots([EMPTY_SEL, EMPTY_SEL, EMPTY_SEL]); }}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
            >
              {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Section>
        )}

        {/* 自分の選出 */}
        <Section title="自分の選出（3体選択）">
          <div className="flex flex-col gap-2">
            {partyMembers.filter((m) => m.pokemon_name).map((m) => {
              const slotIdx = mySlots.findIndex((s) => s.memberId === m.id);
              const selected = slotIdx !== -1;
              const targetIdx = selected ? slotIdx : mySlots.findIndex((s) => !s.memberId);
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => targetIdx !== -1 && toggleMyMember(targetIdx, m)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm ${selected ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 text-gray-700'}`}
                  >
                    {selected && <span className="mr-1 font-bold">{slotIdx + 1}.</span>}
                    {m.pokemon_name}
                    {m.has_mega_item && <span className="ml-1 text-xs text-purple-600">M可</span>}
                  </button>
                  {selected && (
                    <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                      <input
                        type="checkbox"
                        checked={mySlots[slotIdx].mega}
                        onChange={(e) => setMyMega(slotIdx, e.target.checked)}
                      />
                      メガ
                    </label>
                  )}
                </div>
              );
            })}
            {partyMembers.filter((m) => m.pokemon_name).length === 0 && (
              <p className="text-sm text-gray-400">パーティにポケモンが登録されていません</p>
            )}
          </div>
        </Section>

        {/* 相手のパーティ（任意） */}
        <Section title="相手のパーティ（任意・6体）">
          <div className="grid grid-cols-2 gap-2">
            {oppParty.map((v, i) => (
              <PokemonCombobox
                key={i}
                value={v}
                onChange={(val) => setOppParty((prev) => prev.map((x, j) => (j === i ? val : x)))}
                master={master}
                placeholder={`${i + 1}体目`}
              />
            ))}
          </div>
        </Section>

        {/* 相手の選出（必須） */}
        <Section title="相手の選出（必須・3体）">
          <div className="flex flex-col gap-2">
            {oppSlots.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-xs text-gray-500">{i + 1}</span>
                <PokemonCombobox
                  value={s.name}
                  onChange={(val) => setOppSlotName(i, val)}
                  master={master}
                  className="flex-1"
                />
                <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                  <input
                    type="checkbox"
                    checked={s.mega}
                    onChange={(e) => setOppMega(i, e.target.checked)}
                  />
                  メガ
                </label>
              </div>
            ))}
          </div>
        </Section>

        {/* 選出意図 */}
        <Section title="選出意図（任意）">
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="ガブに対してアシレーヌを後出しする想定で..."
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
          />
        </Section>

        {/* 結果 */}
        <Section title="対戦結果">
          <div className="flex gap-2">
            {RESULT_OPTS.map(({ v, label, cls }) => (
              <button
                key={v}
                type="button"
                onClick={() => setResult(v)}
                className={`flex-1 rounded-xl py-3 text-sm font-bold transition-opacity ${result === v ? cls : 'border border-gray-300 bg-white text-gray-600 opacity-60'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* 振り返り */}
        <Section title="振り返り（任意）">
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="ターン1の選択が..."
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
          />
        </Section>

        {/* レート */}
        <Section title="対戦後レート（任意）">
          <input
            type="number"
            value={ratingAfter}
            onChange={(e) => setRatingAfter(e.target.value)}
            placeholder="1500"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
          />
        </Section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? '記録中...' : '対戦を記録する'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {children}
    </div>
  );
}
