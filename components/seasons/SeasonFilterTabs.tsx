'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Season } from '@/lib/types';

interface Props {
  seasons: Season[];
}

export default function SeasonFilterTabs({ seasons }: Props) {
  const searchParams = useSearchParams();
  const current = searchParams.get('season_id');

  const tabs = [
    { label: 'すべて', value: null },
    ...seasons.map((s) => ({ label: s.name, value: s.id })),
    { label: '未割当', value: 'null' },
  ];

  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
      WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
    }}>
      {tabs.map((tab) => {
        const isActive = tab.value === current || (tab.value === null && current === null);
        const href = tab.value === null ? '/parties' : `/parties?season_id=${tab.value}`;
        return (
          <Link
            key={tab.value ?? '__all__'}
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
