const TINTS = ['#F4ECD9', '#ECE2FB', '#E0EAFC', '#FBEED3', '#FDE6E8', '#E8E8E2'];

type Props = {
  name: string;
  size?: 'xs' | 'md' | 'lg';
  mega?: boolean;
  style?: React.CSSProperties;
};

export default function PokeAvatar({ name, size = 'md', mega, style }: Props) {
  const idx = (name?.codePointAt(0) ?? 0) % TINTS.length;
  return (
    <div className={`poke-avatar ${size}`} style={{ background: TINTS[idx], ...style }}>
      <span className="initial">{(name || '?').charAt(0)}</span>
      {mega && <span className="mega-mark">M</span>}
    </div>
  );
}
