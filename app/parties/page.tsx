import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { Party } from '@/lib/types';

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
    <div className="flex flex-col gap-4 p-4 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>パーティ管理</h1>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-2.5 rounded-[18px] border p-4"
        style={{ background: 'var(--mb-tint)', borderColor: 'var(--mb-soft)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5"
          style={{ color: 'var(--mb)' }}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M12 8v5M12 16v0.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="text-xs leading-[1.6]" style={{ color: 'var(--ink)' }}>
          複数のパーティを管理できます。対戦記録は<b>記録時に選んだパーティ</b>に紐づき、レポートはパーティ毎に集計されます。
        </p>
      </div>

      {/* Section header */}
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>パーティ一覧</h2>
        <span className="text-xs" style={{ color: 'var(--ink-sub)' }}>{parties.length} 件</span>
      </div>

      {/* Party cards */}
      <div className="flex flex-col gap-3">
        {parties.map((party) => {
          const members = party.pokemon_members ?? [];
          const filled = members.filter((m) => m.pokemon_name);
          return (
            <Link key={party.id} href={`/parties/${party.id}`}
              className="rounded-[18px] border p-4"
              style={{ background: 'var(--card)', borderColor: 'var(--line)',
                       boxShadow: '0 4px 14px rgba(45,30,15,0.04)' }}>
              <div className="mb-3 font-extrabold text-base" style={{ color: 'var(--ink)' }}>
                {party.name}
              </div>
              <div className="grid grid-cols-6 gap-1.5 mb-2">
                {Array.from({ length: 6 }, (_, i) => {
                  const m = members.find((x) => x.slot === i + 1);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: m?.pokemon_name ? 'var(--mb-soft)' : 'var(--bg-warm)',
                          borderStyle: m?.pokemon_name ? 'solid' : 'dashed',
                          borderWidth: 1,
                          borderColor: m?.pokemon_name ? 'var(--mb-soft)' : 'var(--line)',
                          color: m?.pokemon_name ? 'var(--mb-deep)' : 'var(--ink-mute)',
                        }}>
                        {m?.pokemon_name ? m.pokemon_name[0] : '＋'}
                      </div>
                      <span className="w-full truncate text-center text-[9px] font-bold leading-tight"
                        style={{ color: m?.pokemon_name ? 'var(--ink)' : 'var(--ink-mute)' }}>
                        {m?.pokemon_name || `No.${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--ink-mute)' }}>
                {filled.length}/6 匹登録済み
              </div>
            </Link>
          );
        })}
      </div>

      {/* New party button */}
      <Link href="/parties/new"
        className="flex items-center justify-center gap-2 rounded-[18px] border-[1.5px] p-5 font-extrabold text-sm"
        style={{
          borderStyle: 'dashed',
          borderColor: 'var(--mb)',
          color: 'var(--mb)',
          background: 'transparent',
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
        新しいパーティを作る
      </Link>
    </div>
  );
}
