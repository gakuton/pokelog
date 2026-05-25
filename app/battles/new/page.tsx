'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Party, PokemonMember, PokemonMasterEntry } from '@/lib/types';
import PokemonCombobox from '@/components/battles/PokemonCombobox';

type SelSlot = { memberId: string | null; name: string; mega: boolean };
type OppSlot = { name: string; mega: boolean };

const EMPTY_SEL: SelSlot = { memberId: null, name: '', mega: false };
const EMPTY_OPP: OppSlot = { name: '', mega: false };

const sectionStyle = {
  background: 'var(--card)',
  borderColor: 'var(--line)',
  boxShadow: '0 4px 14px rgba(45,30,15,0.04)',
};

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

  const RESULT_OPTS: { v: 'win' | 'lose' | 'draw'; label: string; activeBg: string; activeShadow: string }[] = [
    { v: 'win',  label: '勝ち',    activeBg: 'var(--sb)', activeShadow: '0 8px 18px rgba(37,99,217,0.35)' },
    { v: 'lose', label: '負け',    activeBg: 'var(--pb)', activeShadow: '0 8px 18px rgba(230,57,70,0.35)' },
    { v: 'draw', label: '引き分け', activeBg: 'var(--ink-sub)', activeShadow: 'none' },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 pb-10 pt-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
          ←
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>対戦記録</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* パーティ選択 */}
        {parties.length > 0 && (
          <Card title="使用パーティ">
            <select value={partyId}
              onChange={(e) => { setPartyId(e.target.value); setMySlots([EMPTY_SEL, EMPTY_SEL, EMPTY_SEL]); }}
              className="w-full rounded-xl border px-3.5 py-3 text-sm"
              style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)', fontSize: 16 }}>
              {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Card>
        )}

        {/* 自分の選出 */}
        <Card title="自分の選出（3体選択）">
          <div className="flex flex-col gap-2">
            {partyMembers.filter((m) => m.pokemon_name).map((m) => {
              const slotIdx = mySlots.findIndex((s) => s.memberId === m.id);
              const selected = slotIdx !== -1;
              const targetIdx = selected ? slotIdx : mySlots.findIndex((s) => !s.memberId);
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => targetIdx !== -1 && toggleMyMember(targetIdx, m)}
                    className="flex-1 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-colors"
                    style={{
                      background: selected ? 'var(--mb-soft)' : 'var(--card)',
                      borderColor: selected ? 'var(--mb)' : 'var(--line)',
                      color: selected ? 'var(--mb-deep)' : 'var(--ink)',
                    }}>
                    {selected && <span className="mr-1 font-black">{slotIdx + 1}.</span>}
                    {m.pokemon_name}
                    {m.has_mega_item && (
                      <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-black"
                        style={{ background: 'var(--hb-soft)', color: '#7B5310' }}>メガ可</span>
                    )}
                  </button>
                  {selected && (
                    <label className="flex shrink-0 items-center gap-1 text-xs font-bold"
                      style={{ color: 'var(--ink-sub)' }}>
                      <input type="checkbox" checked={mySlots[slotIdx].mega}
                        onChange={(e) => setMyMega(slotIdx, e.target.checked)} />
                      メガ
                    </label>
                  )}
                </div>
              );
            })}
            {partyMembers.filter((m) => m.pokemon_name).length === 0 && (
              <p className="text-sm" style={{ color: 'var(--ink-mute)' }}>パーティにポケモンが登録されていません</p>
            )}
          </div>
        </Card>

        {/* 相手のパーティ（任意） */}
        <Card title="相手のパーティ（任意・6体）">
          <div className="grid grid-cols-2 gap-2">
            {oppParty.map((v, i) => (
              <PokemonCombobox key={i} value={v}
                onChange={(val) => setOppParty((prev) => prev.map((x, j) => (j === i ? val : x)))}
                master={master} placeholder={`${i + 1}体目`} />
            ))}
          </div>
        </Card>

        {/* 相手の選出（必須） */}
        <Card title="相手の選出（必須・3体）">
          <div className="flex flex-col gap-2">
            {oppSlots.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                  style={{ background: 'var(--mb-soft)', color: 'var(--mb-deep)' }}>
                  {i + 1}
                </span>
                <PokemonCombobox value={s.name} onChange={(val) => setOppSlotName(i, val)}
                  master={master} className="flex-1" />
                <label className="flex shrink-0 items-center gap-1 text-xs font-bold"
                  style={{ color: 'var(--ink-sub)' }}>
                  <input type="checkbox" checked={s.mega}
                    onChange={(e) => setOppMega(i, e.target.checked)} />
                  メガ
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* 選出意図 */}
        <Card title="選出意図（任意）">
          <textarea value={intent} onChange={(e) => setIntent(e.target.value)}
            rows={3} maxLength={500}
            placeholder="ガブに対してアシレーヌを後出しする想定で..."
            className="w-full rounded-xl border px-3.5 py-3 text-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)',
                     fontSize: 16, resize: 'vertical' }} />
        </Card>

        {/* 対戦結果 */}
        <Card title="対戦結果">
          <div className="flex gap-2">
            {RESULT_OPTS.map(({ v, label, activeBg, activeShadow }) => (
              <button key={v} type="button" onClick={() => setResult(v)}
                className="flex-1 rounded-2xl py-3.5 text-sm font-black transition-all"
                style={result === v
                  ? { background: activeBg, color: '#fff', boxShadow: activeShadow, border: '2px solid transparent' }
                  : { background: 'var(--card)', color: 'var(--ink-sub)', border: '2px solid var(--line)' }}>
                {label}
              </button>
            ))}
          </div>
        </Card>

        {/* 振り返り */}
        <Card title="振り返り（任意）">
          <textarea value={reflection} onChange={(e) => setReflection(e.target.value)}
            rows={4} maxLength={1000}
            placeholder="ターン1の選択が..."
            className="w-full rounded-xl border px-3.5 py-3 text-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)',
                     fontSize: 16, resize: 'vertical' }} />
        </Card>

        {/* レート */}
        <Card title="対戦後レート（任意）">
          <input type="number" value={ratingAfter}
            onChange={(e) => setRatingAfter(e.target.value)}
            placeholder="1500"
            className="w-full rounded-xl border px-3.5 py-3 text-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)',
                     fontSize: 16 }} />
        </Card>

        {error && (
          <p className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: 'var(--pb-soft)', color: 'var(--pb)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={saving}
          className="flex h-14 w-full items-center justify-center rounded-2xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'var(--mb)', boxShadow: '0 6px 18px rgba(91,47,176,0.35)' }}>
          {saving ? '記録中...' : '対戦を記録する'}
        </button>
      </form>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border p-5"
      style={{ background: 'var(--card)', borderColor: 'var(--line)',
               boxShadow: '0 4px 14px rgba(45,30,15,0.04)' }}>
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.08em]"
        style={{ color: 'var(--ink-sub)' }}>{title}</p>
      {children}
    </div>
  );
}
