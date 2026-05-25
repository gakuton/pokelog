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
    .select(`
      *,
      sel1:my_sel1_id(pokemon_name, held_item),
      sel2:my_sel2_id(pokemon_name, held_item),
      sel3:my_sel3_id(pokemon_name, held_item)
    `)
    .eq('id', id)
    .single();
  return data as BattleDetail | null;
}

const RESULT_HERO: Record<string, { label: string; sub: string; gradient: string }> = {
  win:  {
    label: '勝利',
    sub: 'WIN',
    gradient: 'linear-gradient(140deg, #1A56D4 0%, #2563D9 55%, #4D8AE8 100%)',
  },
  lose: {
    label: '敗北',
    sub: 'LOSE',
    gradient: 'linear-gradient(140deg, #B0212C 0%, #E63946 60%, #F06070 100%)',
  },
  draw: {
    label: '引き分け',
    sub: 'DRAW',
    gradient: 'linear-gradient(140deg, #5A5050 0%, #7A706A 100%)',
  },
};

function NameTag({
  name,
  mega,
  item,
}: {
  name: string;
  mega?: boolean;
  item?: string | null;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
      style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
      <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{name}</span>
      {mega && (
        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-black"
          style={{ background: 'var(--hb-soft)', color: '#7B5310' }}>メガ</span>
      )}
      {item && (
        <span className="ml-auto text-xs" style={{ color: 'var(--ink-sub)' }}>{item}</span>
      )}
    </div>
  );
}

function Section({ title, children, tint }: {
  title: string;
  children: React.ReactNode;
  tint?: { bg: string; border: string };
}) {
  return (
    <div className="rounded-[18px] border p-5"
      style={{
        background: tint?.bg ?? 'var(--card)',
        borderColor: tint?.border ?? 'var(--line)',
        boxShadow: '0 4px 14px rgba(45,30,15,0.04)',
      }}>
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.08em]"
        style={{ color: 'var(--ink-sub)' }}>{title}</p>
      {children}
    </div>
  );
}

export default async function BattleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const battle = await getBattle(id);
  if (!battle) notFound();

  const hero = RESULT_HERO[battle.result] ?? RESULT_HERO.draw;
  const date = new Date(battle.created_at).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
    <div className="flex flex-col gap-4 p-4 pb-10 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/history"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
            ←
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>対戦詳細</h1>
        </div>
        <DeleteBattleButton battleId={battle.id} />
      </div>

      {/* Result hero card */}
      <div className="relative overflow-hidden rounded-[20px] p-5"
        style={{ background: hero.gradient }}>
        <div className="absolute right-[-28px] top-[-28px] opacity-[0.12] select-none"
          aria-hidden="true">
          <div className="h-[130px] w-[130px] rounded-full border-[18px] border-white" />
        </div>
        <div className="text-[11px] font-black tracking-[0.12em] uppercase opacity-90 text-white">
          {hero.sub}
        </div>
        <div className="mt-1 text-[32px] font-black text-white leading-none">
          {hero.label}
        </div>
        <div className="mt-4 flex items-center gap-6">
          {battle.rating_after && (
            <div>
              <div className="text-[10px] font-bold opacity-80 text-white">対戦後レート</div>
              <div className="text-[22px] font-black text-white leading-none mt-0.5">
                {battle.rating_after}
              </div>
            </div>
          )}
          <div className={battle.rating_after ? 'border-l border-white/30 pl-6' : ''}>
            <div className="text-[10px] font-bold opacity-80 text-white">記録日時</div>
            <div className="text-sm font-bold text-white mt-0.5">{date}</div>
          </div>
        </div>
      </div>

      {/* Versus section */}
      <Section title="選出">
        <div className="flex flex-col gap-3">
          {/* My side */}
          <div>
            <p className="mb-2 text-[10px] font-black tracking-wider"
              style={{ color: 'var(--ink-sub)' }}>自分</p>
            <div className="flex flex-col gap-1.5">
              {mySlots.map(({ member, mega }, i) => (
                <NameTag key={i} name={member!.pokemon_name} mega={mega} item={member!.held_item} />
              ))}
              {mySlots.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--ink-mute)' }}>未記録</p>
              )}
            </div>
          </div>
          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
            <span className="text-[11px] font-black tracking-[0.1em]"
              style={{ color: 'var(--ink-mute)' }}>VS</span>
            <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
          </div>
          {/* Opp side */}
          <div>
            <p className="mb-2 text-[10px] font-black tracking-wider"
              style={{ color: 'var(--ink-sub)' }}>相手</p>
            <div className="flex flex-col gap-1.5">
              {oppSlots.map(({ name, mega }, i) => (
                <NameTag key={i} name={name} mega={mega} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Opp party */}
      {oppPartyNames.length > 0 && (
        <Section title="相手のパーティ（事前情報）">
          <div className="grid grid-cols-3 gap-2">
            {oppPartyNames.map((name, i) => {
              const isSelected = oppSlots.some((s) => s.name === name);
              return (
                <div key={i}
                  className="relative rounded-[10px] border px-2 py-2 text-center"
                  style={{
                    background: isSelected ? 'var(--mb-soft)' : 'var(--card-soft)',
                    borderColor: isSelected ? 'var(--mb)' : 'var(--line)',
                  }}>
                  {isSelected && (
                    <span className="absolute -top-2 right-1 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white"
                      style={{ background: 'var(--mb)' }}>選出</span>
                  )}
                  <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{name}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Intent */}
      {battle.selection_intent && (
        <Section title="選出意図"
          tint={{ bg: 'var(--mb-tint)', border: 'var(--mb-soft)' }}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed"
            style={{ color: 'var(--ink)' }}>
            {battle.selection_intent}
          </p>
        </Section>
      )}

      {/* Reflection */}
      {battle.reflection && (
        <Section title="振り返り"
          tint={{ bg: '#FFF9EF', border: 'var(--hb-soft)' }}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed"
            style={{ color: 'var(--ink)' }}>
            {battle.reflection}
          </p>
        </Section>
      )}
    </div>
  );
}
