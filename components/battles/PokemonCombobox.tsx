'use client';

import { useRef, useState } from 'react';
import type { PokemonMasterEntry } from '@/lib/types';

type Props = {
  value: string;
  onChange: (v: string) => void;
  master: PokemonMasterEntry[];
  placeholder?: string;
  className?: string;
};

export default function PokemonCombobox({ value, onChange, master, placeholder, className }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = query.length >= 1
    ? master.filter((p) => p.name.includes(query)).slice(0, 8)
    : [];

  function handleBlur(e: React.FocusEvent) {
    if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
  }

  return (
    <div ref={ref} className={`relative ${className ?? ''}`} onBlur={handleBlur}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'ポケモン名'}
        className="w-full rounded-xl border px-3 py-2.5 text-sm transition-colors"
        style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--ink)',
                 fontSize: 16 }}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1.5 max-h-48 w-full overflow-y-auto overflow-x-hidden rounded-[14px] border"
          style={{ background: 'var(--card)', borderColor: 'var(--line)',
                   boxShadow: '0 10px 30px rgba(43,28,75,0.12)' }}>
          {suggestions.map((p) => (
            <li key={p.name} className="border-b last:border-0"
              style={{ borderColor: 'var(--line-soft)' }}>
              <button type="button" tabIndex={0}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm"
                style={{ color: 'var(--ink)' }}
                onMouseDown={() => { setQuery(p.name); onChange(p.name); setOpen(false); }}>
                <span className="font-bold">{p.name}</span>
                <span className="text-xs" style={{ color: 'var(--ink-sub)' }}>{p.types.join('/')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
