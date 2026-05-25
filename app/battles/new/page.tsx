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
      my_sel1_id: mySlots[0].memberId, my_sel2_id: mySlots[1].memberId, my_sel3_id: mySlots[2].memberId,
      my_sel1_mega: mySlots[0].mega, my_sel2_mega: mySlots[1].mega, my_sel3_mega: mySlots[2].mega,
      opp_party_json: oppParty.filter(Boolean).length > 0 ? oppParty.filter(Boolean) : null,
      opp_sel1_name: oppSlots[0].name, opp_sel2_name: oppSlots[1].name, opp_sel3_name: oppSlots[2].name,
      opp_sel1_mega: oppSlots[0].mega, opp_sel2_mega: oppSlots[1].mega, opp_sel3_mega: oppSlots[2].mega,
      selection_intent: intent || null,
      result,
      reflection: reflection || null,
      rating_after: ratingAfter ? Number(ratingAfter) : null,
    };
    const res = await fetch('/api/battles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center',
                   background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>対戦記録</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* パーティ選択 */}
        {parties.length > 0 && (
          <div className="card" style={{ padding: 14 }}>
            <div className="section-label" style={{ margin: '0 0 8px' }}>使用パーティ</div>
            <select value={partyId}
              onChange={(e) => { setPartyId(e.target.value); setMySlots([EMPTY_SEL, EMPTY_SEL, EMPTY_SEL]); }}
              className="select">
              {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {/* 自分の選出 */}
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: '0 0 10px' }}>自分の選出（3体選択）</div>
          {/* Slots preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {[0, 1, 2].map((i) => {
              const slot = mySlots[i];
              return (
                <div key={i} className={`slot ${slot.memberId ? 'filled' : ''}`}>
                  <div className="slot-no">{i + 1}</div>
                  {slot.memberId ? (
                    <>
                      <span className="slot-name">{slot.name}</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4,
                                      fontSize: 12, fontWeight: 700, color: 'var(--ink-sub)', flexShrink: 0 }}>
                        <input type="checkbox" checked={slot.mega}
                          onChange={(e) => setMyMega(i, e.target.checked)} />
                        メガ
                      </label>
                    </>
                  ) : (
                    <span className="placeholder">タップして選択</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Member list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {partyMembers.filter((m) => m.pokemon_name).map((m) => {
              const slotIdx = mySlots.findIndex((s) => s.memberId === m.id);
              const selected = slotIdx !== -1;
              const targetIdx = selected ? slotIdx : mySlots.findIndex((s) => !s.memberId);
              return (
                <button key={m.id} type="button"
                  onClick={() => targetIdx !== -1 && toggleMyMember(targetIdx, m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 12,
                    border: `1px solid ${selected ? 'var(--mb)' : 'var(--line)'}`,
                    background: selected ? 'var(--mb-soft)' : 'var(--card)',
                    textAlign: 'left',
                  }}>
                  {selected && (
                    <span style={{ width: 20, height: 20, borderRadius: 10, background: 'var(--mb)',
                                   color: '#fff', fontSize: 11, fontWeight: 900,
                                   display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {slotIdx + 1}
                    </span>
                  )}
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: selected ? 'var(--mb-deep)' : 'var(--ink)' }}>
                    {m.pokemon_name}
                  </span>
                  {m.has_mega_item && <span className="badge mega">メガ可</span>}
                </button>
              );
            })}
            {partyMembers.filter((m) => m.pokemon_name).length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--ink-mute)', textAlign: 'center', padding: '8px 0' }}>
                パーティにポケモンが登録されていません
              </p>
            )}
          </div>
        </div>

        {/* 相手のパーティ（任意） */}
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: '0 0 10px' }}>相手のパーティ（任意・6体）</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {oppParty.map((v, i) => (
              <PokemonCombobox key={i} value={v}
                onChange={(val) => setOppParty((prev) => prev.map((x, j) => (j === i ? val : x)))}
                master={master} placeholder={`${i + 1}体目`} />
            ))}
          </div>
        </div>

        {/* 相手の選出（必須） */}
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: '0 0 10px' }}>相手の選出（必須・3体）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {oppSlots.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--mb-soft)',
                               color: 'var(--mb-deep)', display: 'grid', placeItems: 'center',
                               fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <PokemonCombobox value={s.name} onChange={(val) => setOppSlotName(i, val)} master={master} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 12, fontWeight: 700, color: 'var(--ink-sub)', flexShrink: 0 }}>
                  <input type="checkbox" checked={s.mega} onChange={(e) => setOppMega(i, e.target.checked)} />
                  メガ
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 選出意図 */}
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: '0 0 8px' }}>選出意図（任意）</div>
          <textarea value={intent} onChange={(e) => setIntent(e.target.value)}
            rows={3} maxLength={500}
            placeholder="ガブに対してアシレーヌを後出しする想定で..."
            className="textarea" />
        </div>

        {/* 対戦結果 */}
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: '0 0 10px' }}>対戦結果</div>
          <div className="wl-toggle" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <button type="button" className={`win ${result === 'win' ? 'active' : ''}`}
              onClick={() => setResult('win')}>勝ち</button>
            <button type="button" className={`lose ${result === 'lose' ? 'active' : ''}`}
              onClick={() => setResult('lose')}>負け</button>
            <button type="button" className={`draw ${result === 'draw' ? 'active' : ''}`}
              onClick={() => setResult('draw')}>分け</button>
          </div>
        </div>

        {/* 振り返り */}
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: '0 0 8px' }}>振り返り（任意）</div>
          <textarea value={reflection} onChange={(e) => setReflection(e.target.value)}
            rows={4} maxLength={1000}
            placeholder="ターン1の選択が..."
            className="textarea" />
        </div>

        {/* レート */}
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: '0 0 8px' }}>対戦後レート（任意）</div>
          <input type="number" value={ratingAfter}
            onChange={(e) => setRatingAfter(e.target.value)}
            placeholder="1500" className="input" />
        </div>

        {error && (
          <div style={{ background: 'var(--pb-soft)', border: '1px solid var(--pb)', borderRadius: 12,
                        padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--pb)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={saving} className="btn primary block"
          style={{ height: 56, fontSize: 16 }}>
          {saving ? '記録中...' : '対戦を記録する'}
        </button>
      </form>
    </div>
  );
}
