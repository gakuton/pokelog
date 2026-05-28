'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Battle, Party, PokemonMember, PokemonMasterEntry } from '@/lib/types';
import PokemonCombobox from '@/components/battles/PokemonCombobox';

type SelSlot = { memberId: string | null; name: string; mega: boolean };
type OppSlot = { name: string; mega: boolean };

const EMPTY_SEL: SelSlot = { memberId: null, name: '', mega: false };
const EMPTY_OPP: OppSlot = { name: '', mega: false };

export default function EditBattlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [master, setMaster] = useState<PokemonMasterEntry[]>([]);
  const [parties, setParties] = useState<(Party & { pokemon_members: PokemonMember[] })[]>([]);
  const [partyId, setPartyId] = useState('');
  const [mySlots, setMySlots] = useState<SelSlot[]>([EMPTY_SEL, EMPTY_SEL, EMPTY_SEL]);
  const [oppParty, setOppParty] = useState<string[]>(Array(6).fill(''));
  const [oppSlots, setOppSlots] = useState<OppSlot[]>([EMPTY_OPP, EMPTY_OPP, EMPTY_OPP]);
  const [intent, setIntent] = useState('');
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [reflection, setReflection] = useState('');
  const [ratingAfter, setRatingAfter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/battles/${id}`).then((r) => r.json()) as Promise<Battle>,
      fetch('/api/pokemon-master').then((r) => r.json()) as Promise<PokemonMasterEntry[]>,
      fetch('/api/parties').then((r) => r.json()) as Promise<(Party & { pokemon_members: PokemonMember[] })[]>,
    ]).then(([battle, m, ps]) => {
      setMaster(m);
      setParties(ps);
      setPartyId(battle.party_id ?? '');
      setIntent(battle.selection_intent ?? '');
      setResult(battle.result);
      setReflection(battle.reflection ?? '');
      setRatingAfter(battle.rating_after != null ? String(battle.rating_after) : '');

      const oppPartyArr = Array(6).fill('');
      (battle.opp_party_json ?? []).forEach((n, i) => { oppPartyArr[i] = n; });
      setOppParty(oppPartyArr);

      setOppSlots([
        { name: battle.opp_sel1_name ?? '', mega: battle.opp_sel1_mega },
        { name: battle.opp_sel2_name ?? '', mega: battle.opp_sel2_mega },
        { name: battle.opp_sel3_name ?? '', mega: battle.opp_sel3_mega },
      ]);

      // Resolve my selections from member IDs
      const allMembers = ps.flatMap((p) => p.pokemon_members ?? []);
      const ids = [battle.my_sel1_id, battle.my_sel2_id, battle.my_sel3_id];
      const megas = [battle.my_sel1_mega, battle.my_sel2_mega, battle.my_sel3_mega];
      setMySlots(ids.map((mid, i) => {
        const mem = allMembers.find((x) => x.id === mid);
        return mem ? { memberId: mem.id, name: mem.pokemon_name, mega: megas[i] } : EMPTY_SEL;
      }));

      setLoading(false);
    });
  }, [id]);

  const currentParty = parties.find((p) => p.id === partyId);
  const partyMembers: PokemonMember[] = currentParty?.pokemon_members
    ? [...currentParty.pokemon_members].sort((a, b) => a.slot - b.slot)
    : [];

  const mySelected = mySlots.filter((s) => s.memberId);
  const oppSelected = oppSlots.filter((s) => s.name);
  const canStep2 = mySelected.length === 3;
  const canSave = canStep2 && result !== null;

  function toggleMyMember(member: PokemonMember) {
    setMySlots((prev) => {
      const idx = prev.findIndex((s) => s.memberId === member.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = EMPTY_SEL;
        return next;
      }
      const emptyIdx = prev.findIndex((s) => !s.memberId);
      if (emptyIdx === -1) return prev;
      const next = [...prev];
      next[emptyIdx] = { memberId: member.id, name: member.pokemon_name, mega: false };
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

  async function handleSave() {
    if (!canSave) return;
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
    const res = await fetch(`/api/battles/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(JSON.stringify(j.error));
      setSaving(false);
      return;
    }
    router.push(`/history/${id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontSize: 13, color: 'var(--ink-mute)' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {step === 1 ? (
            <Link href={`/history/${id}`}
              style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center',
                       background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)',
                       textDecoration: 'none' }}>←</Link>
          ) : (
            <button onClick={() => setStep(1)}
              style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center',
                       background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>←</button>
          )}
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>対戦を編集</h1>
        </div>
        <Link href={`/history/${id}`}
          style={{ fontSize: 13, color: 'var(--ink-sub)', fontWeight: 700, textDecoration: 'none' }}>
          キャンセル
        </Link>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`} />
          <div className={`step ${step >= 2 ? 'active' : ''}`} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge tag">STEP {step} / 2</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
            {step === 1 ? '対戦前 ・ 選出を確認' : '対戦後 ・ 振り返り'}
          </span>
        </div>
      </div>

      {step === 1 ? (
        <>
          {/* ① パーティ選択 */}
          <div>
            <div className="section-head" style={{ margin: '4px 0 8px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--mb)', color: '#fff', fontSize: 11, fontWeight: 800,
                               padding: '2px 8px', borderRadius: 8 }}>①</span>
                使用パーティ
              </h2>
            </div>
            <div className="card" style={{ padding: 12 }}>
              {parties.length > 0 ? (
                <select value={partyId}
                  onChange={(e) => { setPartyId(e.target.value); setMySlots([EMPTY_SEL, EMPTY_SEL, EMPTY_SEL]); }}
                  className="select">
                  <option value="">未選択</option>
                  {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--ink-mute)', textAlign: 'center', padding: 8 }}>
                  パーティがありません
                </p>
              )}
            </div>
          </div>

          {/* ② 自分の選出 */}
          <div>
            <div className="section-head" style={{ margin: '4px 0 8px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--mb)', color: '#fff', fontSize: 11, fontWeight: 800,
                               padding: '2px 8px', borderRadius: 8 }}>②</span>
                自分の選出（3体）
              </h2>
              <span style={{ fontSize: 11, color: 'var(--ink-sub)', fontWeight: 700 }}>{mySelected.length} / 3</span>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                {[0, 1, 2].map((i) => {
                  const slot = mySlots[i];
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      minHeight: 80, padding: 10, borderRadius: 14,
                      border: `1.5px ${slot.memberId ? 'solid var(--mb)' : 'dashed var(--line)'}`,
                      background: slot.memberId ? 'var(--mb-tint)' : 'var(--card)',
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: 11,
                                    background: slot.memberId ? 'var(--mb)' : 'var(--mb-soft)',
                                    color: slot.memberId ? '#fff' : 'var(--mb-deep)',
                                    display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800 }}>
                        {i + 1}
                      </div>
                      {slot.memberId ? (
                        <>
                          <span style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', lineHeight: 1.2,
                                         color: 'var(--mb-deep)' }}>{slot.name}</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 3,
                                          fontSize: 9, fontWeight: 800, color: 'var(--ink-sub)' }}>
                            <input type="checkbox" checked={slot.mega}
                              onChange={(e) => setMyMega(i, e.target.checked)} />
                            メガ
                          </label>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 700 }}>タップで選択</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-sub)', marginBottom: 8 }}>
                パーティから選択
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {partyMembers.filter((m) => m.pokemon_name).map((m) => {
                  const slotIdx = mySlots.findIndex((s) => s.memberId === m.id);
                  const selected = slotIdx !== -1;
                  const full = !selected && mySelected.length >= 3;
                  return (
                    <button key={m.id} type="button"
                      onClick={() => !full && toggleMyMember(m)}
                      style={{
                        background: selected ? 'var(--mb-soft)' : 'var(--card)',
                        border: `1.5px solid ${selected ? 'var(--mb)' : 'var(--line)'}`,
                        borderRadius: 10, padding: '8px 4px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        opacity: full ? 0.4 : 1,
                      }}>
                      <span style={{ fontSize: 11, fontWeight: 700,
                                     color: selected ? 'var(--mb-deep)' : 'var(--ink)' }}>
                        {m.pokemon_name}
                      </span>
                      {selected && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--mb)' }}>
                          選出{slotIdx + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
                {partyMembers.filter((m) => m.pokemon_name).length === 0 && (
                  <p style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--ink-mute)',
                              textAlign: 'center', padding: 8 }}>
                    パーティにポケモンが登録されていません
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ③ 相手のパーティ */}
          <div>
            <div className="section-head" style={{ margin: '4px 0 8px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--mb)', color: '#fff', fontSize: 11, fontWeight: 800,
                               padding: '2px 8px', borderRadius: 8 }}>③</span>
                相手のパーティ
              </h2>
              <span style={{ fontSize: 11, color: 'var(--ink-sub)', fontWeight: 700 }}>
                {oppParty.filter(Boolean).length} / 6 匹
              </span>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {oppParty.map((v, i) => (
                  <PokemonCombobox key={i} value={v}
                    onChange={(val) => setOppParty((prev) => prev.map((x, j) => (j === i ? val : x)))}
                    master={master} placeholder={`${i + 1}体目`} />
                ))}
              </div>
            </div>
          </div>

          {/* ④ 相手の選出 */}
          <div>
            <div className="section-head" style={{ margin: '4px 0 8px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--mb)', color: '#fff', fontSize: 11, fontWeight: 800,
                               padding: '2px 8px', borderRadius: 8 }}>④</span>
                相手の選出（3体）
              </h2>
              <span style={{ fontSize: 11, color: 'var(--ink-sub)', fontWeight: 700 }}>{oppSelected.length} / 3</span>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {oppSlots.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 12,
                                   background: s.name ? 'var(--pb-soft)' : 'var(--mb-soft)',
                                   color: s.name ? 'var(--pb)' : 'var(--mb-deep)',
                                   display: 'grid', placeItems: 'center',
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
          </div>

          {/* ⑤ 選出意図 */}
          <div>
            <div className="section-head" style={{ margin: '4px 0 8px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--mb)', color: '#fff', fontSize: 11, fontWeight: 800,
                               padding: '2px 8px', borderRadius: 8 }}>⑤</span>
                選出意図
              </h2>
              <span style={{ fontSize: 11, color: 'var(--ink-sub)', fontWeight: 700 }}>任意</span>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <textarea value={intent} onChange={(e) => setIntent(e.target.value)}
                rows={3} maxLength={500}
                placeholder="ガブに対してアシレーヌを後出しする想定で..."
                className="textarea" />
            </div>
          </div>

          <button onClick={() => setStep(2)}
            className="btn primary block" style={{ height: 56, fontSize: 16 }}>
            次へ（振り返りを編集）
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      ) : (
        <>
          {/* ⑥ 勝敗 */}
          <div>
            <div className="section-head" style={{ margin: '4px 0 8px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--mb)', color: '#fff', fontSize: 11, fontWeight: 800,
                               padding: '2px 8px', borderRadius: 8 }}>⑥</span>
                勝敗
              </h2>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--pb)' }}>必須</span>
            </div>
            <div className="wl-toggle" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <button type="button" className={`win ${result === 'win' ? 'active' : ''}`}
                onClick={() => setResult('win')}>勝ち</button>
              <button type="button" className={`lose ${result === 'lose' ? 'active' : ''}`}
                onClick={() => setResult('lose')}>負け</button>
              <button type="button" className={`draw ${result === 'draw' ? 'active' : ''}`}
                onClick={() => setResult('draw')}>分け</button>
            </div>
          </div>

          {/* ⑦ 振り返り */}
          <div>
            <div className="section-head" style={{ margin: '4px 0 8px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--mb)', color: '#fff', fontSize: 11, fontWeight: 800,
                               padding: '2px 8px', borderRadius: 8 }}>⑦</span>
                振り返り
              </h2>
              <span style={{ fontSize: 11, color: 'var(--ink-sub)', fontWeight: 700 }}>任意</span>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <textarea value={reflection} onChange={(e) => setReflection(e.target.value)}
                rows={5} maxLength={1000}
                placeholder="ターン1の選択が... 次回への改善点を残しておこう"
                className="textarea" style={{ minHeight: 130 }} />
            </div>
          </div>

          {/* ⑧ 対戦後レート */}
          <div>
            <div className="section-head" style={{ margin: '4px 0 8px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--mb)', color: '#fff', fontSize: 11, fontWeight: 800,
                               padding: '2px 8px', borderRadius: 8 }}>⑧</span>
                対戦後レート
              </h2>
              <span style={{ fontSize: 11, color: 'var(--ink-sub)', fontWeight: 700 }}>任意</span>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <input type="number" value={ratingAfter}
                onChange={(e) => setRatingAfter(e.target.value)}
                placeholder="例：1762" className="input"
                style={{ fontFamily: 'var(--font-num)', fontSize: 18, fontWeight: 800 }} />
              <div style={{ fontSize: 11, color: 'var(--ink-sub)', marginTop: 8 }}>
                ※ ホーム画面と各種集計に反映されます
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--pb-soft)', border: '1px solid var(--pb)', borderRadius: 12,
                          padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--pb)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} className="btn ghost" style={{ flex: 1 }}>
              戻る
            </button>
            <button onClick={handleSave} disabled={!canSave || saving}
              className="btn primary" style={{ flex: 2, height: 56, fontSize: 16 }}>
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
