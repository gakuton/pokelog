'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Season } from '@/lib/types';

interface Props {
  seasons: Season[];
}

interface TabsProps extends Props {
  activeSeasonId: string | null;
}

export default function SeasonFilterTabs({ seasons, activeSeasonId }: TabsProps) {
  const searchParams = useSearchParams();
  const rawCurrent = searchParams.get('season_id');
  // 未指定時は、利用中パーティのシーズンがデフォルト選択されている
  const current = rawCurrent ?? activeSeasonId;

  const tabs = [
    { label: 'すべて', value: 'all' },
    ...seasons.map((s) => ({ label: s.name, value: s.id })),
    { label: '未割当', value: 'null' },
  ];

  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
      WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
    }}>
      {tabs.map((tab) => {
        const isActive = tab.value === current;
        const href = `/parties?season_id=${tab.value}`;
        return (
          <Link
            key={tab.value}
            href={href}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              background: isActive ? 'var(--mb)' : 'var(--card)',
              color: isActive ? '#fff' : 'var(--ink-sub)',
              border: `1px solid ${isActive ? 'var(--mb)' : 'var(--line)'}`,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
