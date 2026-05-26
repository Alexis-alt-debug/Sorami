/**
 * FlagImg — shows a real flag image instead of a flag emoji.
 * Uses flagcdn.com (free, no auth needed, works offline via cache).
 * Falls back to 🌍 when alpha2 is missing/invalid.
 *
 * Props:
 *   alpha2  – 2-letter ISO country code (e.g. "JP")
 *   size    – desired height in px (width is auto, flags are ~3:2 ratio)
 *   style   – optional extra styles on the <img>
 */
export default function FlagImg({ alpha2, size = 20, style = {} }) {
  if (!alpha2 || alpha2.length !== 2) {
    return <span style={{ fontSize: size, lineHeight: 1, flexShrink: 0 }}>🌍</span>;
  }
  return (
    <img
      src={`https://flagcdn.com/w40/${alpha2.toLowerCase()}.png`}
      alt={alpha2.toUpperCase()}
      style={{
        height: size,
        width: 'auto',
        borderRadius: 2,
        display: 'inline-block',
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}
