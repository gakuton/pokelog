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
        className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-red-500 focus:outline-none"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                tabIndex={0}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onMouseDown={() => { setQuery(p.name); onChange(p.name); setOpen(false); }}
              >
                {p.name}
                <span className="ml-2 text-xs text-gray-400">{p.types.join('/')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
