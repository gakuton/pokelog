import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Party, PokemonMember } from '@/lib/types';
import DeletePartyButton from '@/components/parties/DeletePartyButton';

async function getParty(id: string): Promise<Party & { pokemon_members: PokemonMember[] }> {
  const sb = createClient();
  const { data, error } = await sb
    .from('parties')
    .select('*, pokemon_members(*)')
    .eq('id', id)
    .single();
  if (error || !data) notFound();
  return data as Party & { pokemon_members: PokemonMember[] };
}

export default async function PartyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const party = await getParty(id);
  const members = [...(party.pokemon_members ?? [])].sort((a, b) => a.slot - b.slot);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/parties" className="text-gray-500">←</Link>
          <h1 className="text-xl font-bold text-gray-800">{party.name}</h1>
        </div>
        <DeletePartyButton partyId={id} />
      </div>

      <ul className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const m = members.find((x) => x.slot === i + 1);
          return (
            <li key={i}>
              <Link
                href={`/parties/${id}/members/${i + 1}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {m?.pokemon_name ? (
                    <>
                      <p className="font-medium text-gray-800">
                        {m.pokemon_name}
                        {m.has_mega_item && (
                          <span className="ml-1 text-xs text-purple-600">メガ</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[m.nature, m.held_item].filter(Boolean).join(' / ') || '未設定'}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">未設定</p>
                  )}
                </div>
                <span className="text-gray-400">›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
