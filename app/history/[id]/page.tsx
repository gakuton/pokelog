import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { Battle } from '@/lib/types';
import DeleteBattleButton from '@/components/battles/DeleteBattleButton';

type BattleDetail = Battle & {
  sel1: { pokemon_name: string; held_item: string | null } | null;
  sel2: { pokemon_name: string; held_item: string | null } | null;
  sel3: { pokemon_name: string; held_item: string | null } | null;
};

async function getBattle(id: string): Promise<BattleDetail | null> {
  const sb = createClient();
  const { data } = await sb
    .from('battles')
    .select(`*, sel1:my_sel1_id(pokemon_name, held_item), sel2:my_sel2_id(pokemon_name, held_item), sel3:my_sel3_id(pokemon_name, held_item)`)
    .eq('id', id)
    .single();
  return data as BattleDetail | null;
}

const RESULT_HERO: Record<string, { label: string; sub: string; gradient: string }> = {
  win:  { label: '勝利', sub: 'WIN',  gradient: 'linear-gradient(140deg, #1A56D4 0%, #2563D9 55%, #4D8AE8 100%)' },
  lose: { label: '敗北', sub: 'LOSE', gradient: 'linear-gradient(140deg, #B0212C 0%, #E63946 60%, #F06070 100%)' },
  draw: { label: '引き分け', sub: 'DRAW', gradient: 'linear-gradient(140deg, #5A5050 0%, #7A706A 100%)' },
};

export default async function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const battle = await getBattle(id);
  if (!battle) notFound();

  const hero = RESULT_HERO[battle.result] ?? RESULT_HERO.draw;
  const date = new Date(battle.created_at).toLocaleString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const mySlots = [
    { member: battle.sel1, mega: battle.my_sel1_mega },
    { member: battle.sel2, mega: battle.my_sel2_mega },
    { member: battle.sel3, mega: battle.my_sel3_mega },
  ].filter((s) => s.member);

  const oppSlots = [
    { name: battle.opp_sel1_name, mega: battle.opp_sel1_mega },
    { name: battle.opp_sel2_name, mega: battle.opp_sel2_mega },
    { name: battle.opp_sel3_name, mega: battle.opp_sel3_mega },
  ].filter((s) => s.name);

  const oppPartyNames: string[] = battle.opp_party_json ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 18px 110px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/history"
            style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center',
                     background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)',
                     textDecoration: 'none' }}>
            ←
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>対戦詳細</h1>
        </div>
        <DeleteBattleButton battleId={battle.id} />
      </div>

      {/* Result hero */}
      <div style={{ background: hero.gradient, borderRadius: 'var(--r-xl)', padding: 18,
                    color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -28, top: -28, width: 130, height: 130,
                      borderRadius: '50%', border: '30px solid rgba(255,255,255,0.15)', opacity: 0.6 }} />
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', opacity: 0.9 }}>{hero.sub}</div>
        <div style={{ fontFamily: 'var(--font-num)', fontSize: 32, fontWeight: 900, marginTop: 2 }}>{hero.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          {battle.rating_after && (
            <>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>対戦後レート</div>
                <div style={{ fontFamily: 'var(--font-num)', fontSize: 22, fontWeight: 800 }}>{battle.rating_after}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.3)', height: 32 }} />
            </>
          )}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>記録日時</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{date}</div>
          </div>
        </div>
      </div>

      {/* Selections */}
      <div className="card" style={{ padding: 16 }}>
        <div className="section-label" style={{ margin: '0 0 12px' }}>選出</div>
        {/* My side */}
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-sub)', letterSpacing: '0.06em', marginBottom: 8 }}>自分</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mySlots.map(({ member, mega }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                  background: 'var(--card-soft)', border: '1px solid var(--line)',
                                  borderRadius: 10, padding: '10px 12px' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>
                {member!.pokemon_name}
              </span>
              {mega && <span className="badge mega">メガ</span>}
              {member!.held_item && (
                <span style={{ fontSize: 12, color: 'var(--ink-sub)' }}>{member!.held_item}</span>
              )}
            </div>
          ))}
          {mySlots.length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-mute)' }}>未記録</p>}
        </div>

        {/* VS divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, fontWeight: 800,
                         letterSpacing: '0.1em', color: 'var(--ink-mute)' }}>VS</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        {/* Opp side */}
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-sub)', letterSpacing: '0.06em', marginBottom: 8 }}>相手</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {oppSlots.map(({ name, mega }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                  background: 'var(--card-soft)', border: '1px solid var(--line)',
                                  borderRadius: 10, padding: '10px 12px' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>{name}</span>
              {mega && <span className="badge mega">メガ</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Opp party */}
      {oppPartyNames.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <div className="section-label" style={{ margin: '0 0 12px' }}>相手のパーティ（事前情報）</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {oppPartyNames.map((name, i) => {
              const isSelected = oppSlots.some((s) => s.name === name);
              return (
                <div key={i} style={{
                  background: isSelected ? 'var(--mb-soft)' : 'var(--card-soft)',
                  border: `1px solid ${isSelected ? 'var(--mb)' : 'var(--line)'}`,
                  borderRadius: 10, padding: '8px 6px', textAlign: 'center', position: 'relative',
                }}>
                  {isSelected && (
                    <span style={{ position: 'absolute', top: -8, right: -4, fontSize: 9, fontWeight: 800,
                                   background: 'var(--mb)', color: '#fff', padding: '2px 6px', borderRadius: 8 }}>
                      選出
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Intent */}
      {battle.selection_intent && (
        <div className="card" style={{ background: 'var(--mb-tint)', borderColor: 'var(--mb-soft)' }}>
          <div className="section-label" style={{ margin: '0 0 10px', color: 'var(--mb-deep)' }}>選出意図</div>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
            {battle.selection_intent}
          </p>
        </div>
      )}

      {/* Reflection */}
      {battle.reflection && (
        <div className="card" style={{ background: '#FFF9EF', borderColor: 'var(--hb-soft)' }}>
          <div className="section-label" style={{ margin: '0 0 10px', color: '#946011' }}>振り返り</div>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
            {battle.reflection}
          </p>
        </div>
      )}
    </div>
  );
}
