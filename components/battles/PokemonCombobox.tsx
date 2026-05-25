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
    <div ref={ref} className={className} style={{ position: 'relative' }} onBlur={handleBlur}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'ポケモン名'}
        className="input"
      />
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
                      background: 'var(--card)', border: '1px solid var(--line)',
                      borderRadius: 14, overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(43,28,75,0.12)' }}>
          {suggestions.map((p) => (
            <button key={p.name} type="button" tabIndex={0}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                       padding: '10px 14px', borderBottom: '1px solid var(--line-soft)',
                       textAlign: 'left' }}
              onMouseDown={() => { setQuery(p.name); onChange(p.name); setOpen(false); }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-sub)' }}>{p.types.join('/')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
