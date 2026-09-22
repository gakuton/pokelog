'use client';

import { useState, useEffect } from 'react';
import type { PartyVersion, PokemonMember } from '@/lib/types';
import PokeAvatar from '@/components/common/PokeAvatar';

interface Props {
  partyId: string;
  currentVersionId: string;
}

type VersionDetail = PartyVersion & { members: PokemonMember[] };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function VersionHistory({ partyId, currentVersionId }: Props) {
  const [versions, setVersions] = useState<PartyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VersionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/parties/${partyId}/versions`)
      .then((r) => r.json())
      .then((data: PartyVersion[]) => setVersions(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [partyId]);

  async function toggle(versionId: string) {
    if (openId === versionId) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(versionId);
    setDetail(null);
    setDetailLoading(true);
    const res = await fetch(`/api/parties/${partyId}/versions/${versionId}`);
    const data = await res.json();
    setDetail(data);
    setDetailLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: 'var(--ink-sub)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        変更履歴
      </span>

      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--ink-mute)' }}>読み込み中...</p>
      ) : versions.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--ink-mute)' }}>履歴はありません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {versions.map((v, i) => {
            const isCurrent = v.id === currentVersionId;
            const isOpen = openId === v.id;
            return (
              <div key={v.id} style={{
                border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden',
              }}>
                <button type="button" onClick={() => toggle(v.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: isCurrent ? 'var(--mb-tint)' : 'var(--card)',
                    border: 'none', textAlign: 'left',
                  }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      Version {versions.length - i}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: 'var(--mb)',
                        background: 'var(--mb-soft)', borderRadius: 8, padding: '2px 6px',
                      }}>
                        現在
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-sub)' }}>{formatDate(v.created_at)}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '10px 12px', borderTop: '1px solid var(--line-soft)' }}>
                    {detailLoading ? (
                      <p style={{ fontSize: 12, color: 'var(--ink-mute)' }}>読み込み中...</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                        {[...(detail?.members ?? [])].sort((a, b) => a.slot - b.slot).map((m) => (
                          <div key={m.slot} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: 12, color: m.pokemon_name ? 'var(--ink)' : 'var(--ink-mute)',
                            padding: '4px 8px', background: 'var(--bg-warm)', borderRadius: 8,
                          }}>
                            {m.pokemon_name && <PokeAvatar name={m.pokemon_name} size="xs" style={{ width: 20, height: 20 }} />}
                            <span>{m.slot}. {m.pokemon_name || '未設定'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
