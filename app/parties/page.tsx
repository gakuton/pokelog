import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { Party } from '@/lib/types';
import EmptyState from '@/components/common/EmptyState';

async function getParties(): Promise<Party[]> {
  const sb = createClient();
  const { data } = await sb
    .from('parties')
    .select('*, pokemon_members(*)')
    .order('created_at', { ascending: false });
  return (data ?? []) as Party[];
}

export default async function PartiesPage() {
  const parties = await getParties();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">パーティ管理</h1>
        <Link
          href="/parties/new"
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          ＋ 新規
        </Link>
      </div>

      {parties.length === 0 ? (
        <EmptyState
          icon="🎮"
          title="パーティがありません"
          description="最初のパーティを作成しましょう"
          actionHref="/parties/new"
          actionLabel="パーティを作成"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {parties.map((party) => {
            const members = party.pokemon_members ?? [];
            const filled = members.filter((m) => m.pokemon_name);
            return (
              <li key={party.id}>
                <Link
                  href={`/parties/${party.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="mb-2 font-semibold text-gray-800">{party.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 6 }, (_, i) => {
                      const m = members.find((x) => x.slot === i + 1);
                      return (
                        <span
                          key={i}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            m?.pokemon_name
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {m?.pokemon_name || `スロット${i + 1}`}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {filled.length}/6 匹登録済み
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
