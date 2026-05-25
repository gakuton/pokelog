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

const RESULT_LABEL: Record<string, { label: string; cls: string }> = {
  win: { label: '勝ち', cls: 'bg-blue-100 text-blue-700' },
  lose: { label: '負け', cls: 'bg-red-100 text-red-700' },
  draw: { label: '引き分け', cls: 'bg-gray-100 text-gray-600' },
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
    <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-gray-800">{name}</span>
      {mega && <span className="text-xs font-bold text-purple-600">M</span>}
      {item && <span className="ml-auto text-xs text-gray-400">{item}</span>}
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

  const badge = RESULT_LABEL[battle.result] ?? RESULT_LABEL.draw;
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

  return (
    <div className="flex flex-col gap-5 p-4 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/history" className="text-gray-500">←</Link>
          <h1 className="text-xl font-bold text-gray-800">対戦詳細</h1>
        </div>
        <DeleteBattleButton battleId={battle.id} />
      </div>

      {/* 結果・日時 */}
      <div className="flex items-center gap-3">
        <span className={`rounded-xl px-4 py-1.5 text-sm font-bold ${badge.cls}`}>
          {badge.label}
        </span>
        <span className="text-sm text-gray-500">{date}</span>
        {battle.rating_after && (
          <span className="ml-auto text-sm font-semibold text-gray-700">
            レート {battle.rating_after}
          </span>
        )}
      </div>

      {/* 自分の選出 */}
      <Section title="自分の選出">
        <div className="flex flex-col gap-2">
          {mySlots.map(({ member, mega }, i) => (
            <NameTag
              key={i}
              name={member!.pokemon_name}
              mega={mega}
              item={member!.held_item}
            />
          ))}
          {mySlots.length === 0 && <p className="text-sm text-gray-400">未記録</p>}
        </div>
      </Section>

      {/* 相手の選出 */}
      <Section title="相手の選出">
        <div className="flex flex-col gap-2">
          {oppSlots.map(({ name, mega }, i) => (
            <NameTag key={i} name={name} mega={mega} />
          ))}
        </div>
      </Section>

      {/* 相手のパーティ */}
      {battle.opp_party_json && battle.opp_party_json.length > 0 && (
        <Section title="相手のパーティ">
          <div className="flex flex-wrap gap-2">
            {battle.opp_party_json.map((name, i) => (
              <span key={i} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-700">
                {name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* 選出意図 */}
      {battle.selection_intent && (
        <Section title="選出意図">
          <p className="whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-gray-700 shadow-sm">
            {battle.selection_intent}
          </p>
        </Section>
      )}

      {/* 振り返り */}
      {battle.reflection && (
        <Section title="振り返り">
          <p className="whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-gray-700 shadow-sm">
            {battle.reflection}
          </p>
        </Section>
      )}
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
