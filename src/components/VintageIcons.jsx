/**
 * VintageIcons.jsx
 * All app icons in a consistent pen-and-ink / travel-journal style.
 * Each icon is a pure SVG — no external dependencies.
 * Default size 22, default color #a89070 (parchment text3).
 */

const R = { strokeLinecap: 'round', strokeLinejoin: 'round' };

// ── Navigation & UI ───────────────────────────────────────────────────────────

export function IcoArrowLeft({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M19 12H5" />
      <path d="M5 12l6-6" />
      <path d="M5 12l6 6" />
      {/* small serif flourish at tail */}
      <line x1="19" y1="10.5" x2="19" y2="13.5" strokeWidth="1.3" />
    </svg>
  );
}

export function IcoChevronLeft({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" {...R}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IcoChevronRight({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" {...R}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function IcoX({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" {...R}>
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  );
}

export function IcoCheck({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" {...R}>
      <path d="M4 12l5 5L20 7" />
    </svg>
  );
}

export function IcoPlus({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" {...R}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5"  y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IcoSend({ color = '#a89070', size = 22 }) {
  // Vintage paper airplane
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

export function IcoLogOut({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Door frame */}
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      {/* Arrow out */}
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Search ────────────────────────────────────────────────────────────────────

export function IcoSearch({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Lens circle */}
      <circle cx="10.5" cy="10.5" r="6.5" />
      {/* Handle with slight curve */}
      <path d="M15.5 15.5L21 21" strokeWidth="2.5" />
      {/* Inner lens glare dot */}
      <circle cx="8.5" cy="8.5" r="1" fill={color} stroke="none" />
    </svg>
  );
}

// ── Location ──────────────────────────────────────────────────────────────────

export function IcoMapPin({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Teardrop */}
      <path d="M12 21S4 13.5 4 8.5a8 8 0 0116 0C20 13.5 12 21 12 21z" />
      {/* Inner circle */}
      <circle cx="12" cy="8.5" r="2.5" />
      {/* Small shadow dot at bottom */}
      <circle cx="12" cy="22" r="0.8" fill={color} stroke="none" />
    </svg>
  );
}

// ── Camera ────────────────────────────────────────────────────────────────────

export function IcoCamera({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Body */}
      <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="2" />
      {/* Lens */}
      <circle cx="12" cy="14" r="4" />
      <circle cx="12" cy="14" r="1.5" fill={color} stroke="none" />
      {/* Viewfinder hump */}
      <path d="M8 7V5.5a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0116 5.5V7" />
      {/* Flash dot */}
      <circle cx="18.5" cy="10.5" r="1" fill={color} stroke="none" />
    </svg>
  );
}

// ── Calendar / Date ───────────────────────────────────────────────────────────

export function IcoCalendar({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Body */}
      <rect x="3" y="4" width="18" height="18" rx="2" />
      {/* Header band */}
      <line x1="3" y1="9" x2="21" y2="9" />
      {/* Ring posts */}
      <line x1="8"  y1="2" x2="8"  y2="6" strokeWidth="2.2" />
      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2.2" />
      {/* Date dots grid */}
      <circle cx="8"  cy="13" r="1.1" fill={color} stroke="none" />
      <circle cx="12" cy="13" r="1.1" fill={color} stroke="none" />
      <circle cx="16" cy="13" r="1.1" fill={color} stroke="none" />
      <circle cx="8"  cy="17" r="1.1" fill={color} stroke="none" />
      <circle cx="12" cy="17" r="1.1" fill={color} stroke="none" />
    </svg>
  );
}

// ── Star / Rating ─────────────────────────────────────────────────────────────

export function IcoStar({ color = '#a89070', size = 22, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" {...R}>
      <polygon points="12,2.5 14.6,9 21.8,9 16.1,13.4 18.3,20.5 12,16.5 5.7,20.5 7.9,13.4 2.2,9 9.4,9" />
      {!filled && <circle cx="12" cy="12" r="1.3" fill={color} stroke="none" />}
    </svg>
  );
}

// ── Book / Diary ──────────────────────────────────────────────────────────────

export function IcoBook({ color = '#a89070', size = 22 }) {
  // Open book (two pages with ruled lines)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M12 5.5C10 4.2 7 4 4 5v14c3-1 6-.8 8 .5" />
      <path d="M12 5.5c2-1.3 5-1.5 8 0v14c-3-1-6-.8-8 .5" />
      <line x1="12" y1="5.5" x2="12" y2="20" />
      <line x1="5.5"  y1="9.5"  x2="10.5" y2="9.5"  strokeWidth="1.3" />
      <line x1="5.5"  y1="12.5" x2="10.5" y2="12.5" strokeWidth="1.3" />
      <line x1="5.5"  y1="15.5" x2="10.5" y2="15.5" strokeWidth="1.3" />
      <line x1="13.5" y1="9.5"  x2="18.5" y2="9.5"  strokeWidth="1.3" />
      <line x1="13.5" y1="12.5" x2="18.5" y2="12.5" strokeWidth="1.3" />
      <line x1="13.5" y1="15.5" x2="18.5" y2="15.5" strokeWidth="1.3" />
      <path d="M18 4v6l-1.8-1.5L14.5 10V4" strokeWidth="1.3" />
    </svg>
  );
}

// ── Cloud / Weather ───────────────────────────────────────────────────────────

export function IcoCloud({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M18 10h-1.3A6 6 0 006 10.3 4 4 0 007 18h11a4 4 0 000-8z" />
      {/* Small rain dots */}
      <line x1="8"  y1="21" x2="8"  y2="22.5" strokeWidth="1.5" />
      <line x1="12" y1="21" x2="12" y2="22.5" strokeWidth="1.5" />
      <line x1="16" y1="21" x2="16" y2="22.5" strokeWidth="1.5" />
    </svg>
  );
}

// ── Users / People ────────────────────────────────────────────────────────────

export function IcoUsers({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <circle cx="12" cy="7"   r="3" />
      <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <circle cx="5"  cy="8.5" r="2.2" strokeWidth="1.5" />
      <path d="M1 21v-1.5a3 3 0 013-3h2"    strokeWidth="1.5" />
      <circle cx="19" cy="8.5" r="2.2" strokeWidth="1.5" />
      <path d="M23 21v-1.5a3 3 0 00-3-3h-2" strokeWidth="1.5" />
    </svg>
  );
}

// ── Trash / Delete ────────────────────────────────────────────────────────────

export function IcoTrash({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Lid */}
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      {/* Bin body */}
      <path d="M5 6l1 14h12l1-14" />
      {/* Inner lines */}
      <line x1="10" y1="11" x2="10" y2="17" strokeWidth="1.4" />
      <line x1="14" y1="11" x2="14" y2="17" strokeWidth="1.4" />
    </svg>
  );
}

// ── Pencil / Edit ─────────────────────────────────────────────────────────────

export function IcoPencil({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Pencil body */}
      <path d="M17 3a2.8 2.8 0 014 4L7.5 20.5 3 21l.5-4.5L17 3z" />
      {/* Wood grain lines */}
      <line x1="15" y1="5"  x2="19" y2="9"  strokeWidth="1.3" />
      {/* Eraser band */}
      <line x1="6.5" y1="17.5" x2="3.5" y2="20.5" strokeWidth="1.3" />
    </svg>
  );
}

// ── Globe / World ─────────────────────────────────────────────────────────────

export function IcoGlobe({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.6" />
      <line x1="4.5"  y1="7.5"  x2="19.5" y2="7.5"  strokeWidth="1" strokeDasharray="2 1.8" />
      <line x1="4.5"  y1="16.5" x2="19.5" y2="16.5" strokeWidth="1" strokeDasharray="2 1.8" />
      <path d="M12 3c-3.8 4.5-3.8 13.5 0 18" strokeWidth="1.5" />
      <path d="M12 3c3.8 4.5 3.8 13.5 0 18"  strokeWidth="1.5" />
    </svg>
  );
}

// ── Coin / Money / Budget ─────────────────────────────────────────────────────

export function IcoCoin({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Coin stack */}
      <ellipse cx="12" cy="8"  rx="8" ry="3" />
      <ellipse cx="12" cy="11" rx="8" ry="3" />
      <line x1="4"  y1="8"  x2="4"  y2="11" />
      <line x1="20" y1="8"  x2="20" y2="11" />
      {/* Top coin detail */}
      <line x1="9"  y1="7.2" x2="11" y2="7.2" strokeWidth="1.3" />
      <line x1="13" y1="7.2" x2="15" y2="7.2" strokeWidth="1.3" />
      {/* Shadow stack bottom */}
      <path d="M4 14c0 1.7 3.6 3 8 3s8-1.3 8-3" strokeWidth="1.5" />
      <line x1="4"  y1="11" x2="4"  y2="14" strokeWidth="1.5" />
      <line x1="20" y1="11" x2="20" y2="14" strokeWidth="1.5" />
    </svg>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────

export function IcoTag({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Tag shape */}
      <path d="M20.6 11.4l-9-9A2 2 0 0010.2 2H4a2 2 0 00-2 2v6.2a2 2 0 00.6 1.4l9 9a2 2 0 002.8 0l6.2-6.2a2 2 0 000-2.8z" />
      {/* Hole */}
      <circle cx="7" cy="7" r="1.4" fill={color} stroke="none" />
      {/* Stitch line */}
      <line x1="11" y1="11" x2="17" y2="17" strokeWidth="1.3" strokeDasharray="2 1.5" />
    </svg>
  );
}

// ── Bot / AI ──────────────────────────────────────────────────────────────────

export function IcoBot({ color = '#a89070', size = 22 }) {
  // Vintage telescope — represents discovery & guidance
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Main barrel */}
      <path d="M3 8l16-4 2 4-16 4-2-4z" />
      {/* Eyepiece end */}
      <path d="M3 8l-1 4h3l1-4" strokeWidth="1.5" />
      {/* Lens end lens ring */}
      <line x1="19" y1="4" x2="21" y2="12" strokeWidth="1.5" />
      {/* Tripod */}
      <line x1="10" y1="12" x2="8"  y2="21" strokeWidth="2" />
      <line x1="10" y1="12" x2="12" y2="21" strokeWidth="2" />
      <line x1="8"  y1="21" x2="12" y2="21" strokeWidth="1.5" />
      {/* Star in view */}
      <circle cx="20" cy="5" r="1" fill={color} stroke="none" />
    </svg>
  );
}

// ── Cute vintage pen-and-ink fox face ────────────────────────────────────────
export function IcoFox({ color = '#c4922a', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" {...R}>
      {/* Head */}
      <circle cx="12" cy="14" r="7.5" />
      {/* Left ear outer */}
      <path d="M5 9.5L8 2.5L11.5 7.5" />
      {/* Right ear outer */}
      <path d="M19 9.5L16 2.5L12.5 7.5" />
      {/* Inner ear detail */}
      <path d="M7 8.5L8.5 5L10.5 8" strokeWidth="1.1" />
      <path d="M17 8.5L15.5 5L13.5 8" strokeWidth="1.1" />
      {/* Eyes */}
      <circle cx="9.5" cy="13.5" r="1.4" />
      <circle cx="14.5" cy="13.5" r="1.4" />
      {/* Eye-shine dots */}
      <circle cx="10.1" cy="13" r="0.45" fill={color} stroke="none" />
      <circle cx="15.1" cy="13" r="0.45" fill={color} stroke="none" />
      {/* Nose */}
      <ellipse cx="12" cy="16.5" rx="1.1" ry="0.75" fill={color} stroke="none" />
      {/* Smile */}
      <path d="M10.5 17.5Q12 19 13.5 17.5" strokeWidth="1.3" />
      {/* Cheek tufts */}
      <path d="M5.2 15C5.8 14.5 6.5 15 6.8 15.8" strokeWidth="1" />
      <path d="M18.8 15C18.2 14.5 17.5 15 17.2 15.8" strokeWidth="1" />
    </svg>
  );
}

export function IcoSparkles({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" {...R}>
      {/* Large star */}
      <path d="M12 2l1.8 5.5H19l-4.4 3.2 1.7 5.3L12 13l-4.3 3 1.7-5.3L5 7.5h5.2z" />
      {/* Small stars */}
      <path d="M19 14l.9 2.6H22l-1.8 1.3.7 2.1-1.9-1.3-1.9 1.3.7-2.1-1.7-1.3h2z" strokeWidth="1.3" />
      <path d="M5 14l.9 2.6H8l-1.7 1.3.7 2.1-1.9-1.3-1.9 1.3.7-2.1-1.7-1.3h2z" strokeWidth="1.3" />
    </svg>
  );
}

// ── Compass / Navigate ────────────────────────────────────────────────────────

export function IcoCompass({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <circle cx="12" cy="12" r="9.5" />
      {/* N-S needle */}
      <path d="M12 5l2.5 6H9.5L12 5z" fill={color} stroke="none" />
      <path d="M12 19l-2.5-6h5L12 19z" fill="none" strokeWidth="1.5" />
      {/* E-W tick marks */}
      <line x1="3"  y1="12" x2="4.5" y2="12" strokeWidth="1.5" />
      <line x1="19.5" y1="12" x2="21" y2="12" strokeWidth="1.5" />
      <line x1="12" y1="2.5"  x2="12" y2="4"   strokeWidth="1.5" />
      <line x1="12" y1="20"  x2="12" y2="21.5" strokeWidth="1.5" />
      {/* Centre dot */}
      <circle cx="12" cy="12" r="1.2" fill={color} stroke="none" />
    </svg>
  );
}

// ── Palette ───────────────────────────────────────────────────────────────────

export function IcoPalette({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10 1.4 0 2.5-1.1 2.5-2.5 0-.6-.2-1.2-.6-1.6-.4-.4-.6-.9-.6-1.4 0-1.4 1.1-2.5 2.5-2.5H18c2.8 0 5-2.2 5-5C23 6.7 18 2 12 2z" />
      <circle cx="7"  cy="12"  r="1.3" fill={color} stroke="none" />
      <circle cx="9"  cy="7.5" r="1.3" fill={color} stroke="none" />
      <circle cx="13" cy="6"   r="1.3" fill={color} stroke="none" />
      <circle cx="17" cy="9"   r="1.3" fill={color} stroke="none" />
    </svg>
  );
}

// ── Edit (small pencil) ───────────────────────────────────────────────────────

export function IcoEdit({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// ── Navbar icons (exported for Navbar.jsx too) ────────────────────────────────

export function IcoHome({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" {...R}>
      <path d="M3 11L12 3l9 8" />
      <path d="M15.5 5V8" />
      <path d="M5 9.5V20h4.5v-5.5h5V20H19V9.5" strokeWidth="2" />
      <rect x="9.2" y="9.5" width="3" height="2.8" rx="0.4" strokeWidth="1.4" />
      <line x1="10.7" y1="9.5" x2="10.7" y2="12.3" strokeWidth="0.9" />
      <line x1="9.2"  y1="11"  x2="12.2" y2="11"   strokeWidth="0.9" />
      <path d="M10.5 20v-4.5a1.5 1.5 0 013 0V20" strokeWidth="1.4" />
    </svg>
  );
}

export function IcoNavGlobe({ color = '#a89070', size = 22 }) {
  return <IcoGlobe color={color} size={size} />;
}

export function IcoNavDiary({ color = '#a89070', size = 22 }) {
  return <IcoBook color={color} size={size} />;
}

export function IcoNavStar({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <polygon points="12,2.5 14.6,9 21.8,9 16.1,13.4 18.3,20.5 12,16.5 5.7,20.5 7.9,13.4 2.2,9 9.4,9" />
      <circle cx="12" cy="12" r="1.4" fill={color} stroke="none" />
      <line x1="12"   y1="0.5"  x2="12"   y2="1.5"  strokeWidth="1.3" />
      <line x1="22.8" y1="8.3"  x2="22"   y2="8.7"  strokeWidth="1.3" />
      <line x1="19.5" y1="21.5" x2="18.9" y2="20.7" strokeWidth="1.3" />
      <line x1="4.5"  y1="21.5" x2="5.1"  y2="20.7" strokeWidth="1.3" />
      <line x1="1.2"  y1="8.3"  x2="2"    y2="8.7"  strokeWidth="1.3" />
    </svg>
  );
}

export function IcoNavQuill({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M20 3c-6 1-11 6-12 13" />
      <path d="M20 3c1 6-4 11-12 13" />
      <path d="M8 16l-2.5 5.5" />
      <path d="M6.5 19.5 Q7.5 19 8.5 19.5" strokeWidth="1.3" fill="none" />
      <line x1="15.5" y1="6"   x2="11" y2="10.5" strokeWidth="1.4" />
      <line x1="12.5" y1="9"   x2="9"  y2="12.5" strokeWidth="1.4" />
    </svg>
  );
}

export function IcoStats({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <line x1="3" y1="20" x2="21" y2="20" />
      <rect x="4.5"  y="13" width="3.5" height="7" rx="0.5" strokeWidth="1.8" />
      <rect x="10"   y="8"  width="3.5" height="12" rx="0.5" strokeWidth="1.8" />
      <rect x="15.5" y="4"  width="3.5" height="16" rx="0.5" strokeWidth="1.8" />
      <circle cx="6.25"  cy="11.8" r="0.9" fill={color} stroke="none" />
      <circle cx="11.75" cy="6.8"  r="0.9" fill={color} stroke="none" />
      <circle cx="17.25" cy="2.8"  r="0.9" fill={color} stroke="none" />
    </svg>
  );
}

// ── User (avatar placeholder) ─────────────────────────────────────────────────
export function IcoUser({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20v-1a7 7 0 0114 0v1" />
      {/* collar detail */}
      <path d="M10 13.5l2 2.5 2-2.5" strokeWidth="1.2" />
    </svg>
  );
}

// ── Plane (vintage biplane silhouette) ────────────────────────────────────────
export function IcoPlane({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M21 16l-7-3.5V5a2 2 0 00-4 0v7.5L3 16l1 2 7-2v3l-2 1.5V22l3-1 3 1v-1.5L13 19v-3l7 2z" strokeWidth="1.8" />
    </svg>
  );
}

// ── Refresh / reset (circular arrow) ─────────────────────────────────────────
export function IcoRefresh({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M3 12a9 9 0 009 9 9 9 0 006.9-3.2" />
      <path d="M21 12a9 9 0 00-9-9 9 9 0 00-6.9 3.2" />
      <polyline points="21 3 21 9 15 9" strokeWidth="2" />
    </svg>
  );
}

// ── Season icons ─────────────────────────────────────────────────────────────

export function IcoFlower({ color = '#a89070', size = 22 }) {
  // Spring — 8-petal daisy + filled centre
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" {...R}>
      <ellipse cx="12" cy="6.8"  rx="2"   ry="3.3" />
      <ellipse cx="12" cy="17.2" rx="2"   ry="3.3" />
      <ellipse cx="6.8"  cy="12" rx="3.3" ry="2"   />
      <ellipse cx="17.2" cy="12" rx="3.3" ry="2"   />
      <ellipse cx="8.3"  cy="8.3"  rx="2" ry="3.3" transform="rotate(-45 8.3 8.3)"   />
      <ellipse cx="15.7" cy="8.3"  rx="2" ry="3.3" transform="rotate(45 15.7 8.3)"   />
      <ellipse cx="8.3"  cy="15.7" rx="2" ry="3.3" transform="rotate(45 8.3 15.7)"   />
      <ellipse cx="15.7" cy="15.7" rx="2" ry="3.3" transform="rotate(-45 15.7 15.7)" />
      <circle cx="12" cy="12" r="3.2" fill={color} stroke="none" />
    </svg>
  );
}

export function IcoSun({ color = '#a89070', size = 22 }) {
  // Summer — circle + 8 rays + ink-dot centre
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" {...R}>
      <circle cx="12" cy="12" r="4.2" />
      <line x1="12" y1="2"    x2="12" y2="5"    />
      <line x1="12" y1="19"   x2="12" y2="22"   />
      <line x1="2"    y1="12" x2="5"    y2="12" />
      <line x1="19"   y1="12" x2="22"   y2="12" />
      <line x1="5.5"  y1="5.5"  x2="7.6"  y2="7.6"  />
      <line x1="16.4" y1="16.4" x2="18.5" y2="18.5" />
      <line x1="18.5" y1="5.5"  x2="16.4" y2="7.6"  />
      <line x1="7.6"  y1="16.4" x2="5.5"  y2="18.5" />
      <circle cx="12" cy="12" r="1.4" fill={color} stroke="none" />
    </svg>
  );
}

export function IcoMapleLeaf({ color = '#a89070', size = 22 }) {
  // Autumn — stylised maple leaf + stem
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" {...R}>
      <path d="M12 2 L9.5 6 L5.5 5 L8.5 9 L3.5 10 L7 13.5 L5 17 L9.5 15.5 L10.5 19 L12 17 L13.5 19 L14.5 15.5 L19 17 L17 13.5 L20.5 10 L15.5 9 L18.5 5 L14.5 6 Z" />
      <line x1="12" y1="19" x2="12" y2="23" strokeWidth="1.5" />
    </svg>
  );
}

export function IcoSnowflake({ color = '#a89070', size = 22 }) {
  // Winter — 4-axis snowflake + perpendicular crossbars + centre dot
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" {...R}>
      <line x1="12" y1="2"   x2="12" y2="22"  />
      <line x1="2"  y1="12"  x2="22" y2="12"  />
      <line x1="5"  y1="5"   x2="19" y2="19"  />
      <line x1="19" y1="5"   x2="5"  y2="19"  />
      {/* Crossbars on vertical arm */}
      <line x1="9.5" y1="5.8"  x2="14.5" y2="5.8"  strokeWidth="1.2" />
      <line x1="9.5" y1="18.2" x2="14.5" y2="18.2" strokeWidth="1.2" />
      {/* Crossbars on horizontal arm */}
      <line x1="5.8"  y1="9.5" x2="5.8"  y2="14.5" strokeWidth="1.2" />
      <line x1="18.2" y1="9.5" x2="18.2" y2="14.5" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="1.6" fill={color} stroke="none" />
    </svg>
  );
}

// ── Info ──────────────────────────────────────────────────────────────────────
export function IcoInfo({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      {/* Outer circle */}
      <circle cx="12" cy="12" r="9.5" />
      {/* Ink dot */}
      <circle cx="12" cy="7.5" r="1.1" fill={color} stroke="none" />
      {/* Stem */}
      <line x1="12" y1="11" x2="12" y2="17" strokeWidth="2" />
      {/* Serif flourishes */}
      <line x1="9.8" y1="11"   x2="14.2" y2="11"   strokeWidth="1.3" />
      <line x1="9.8" y1="17"   x2="14.2" y2="17"   strokeWidth="1.3" />
    </svg>
  );
}

// ── Chat bubble (for AI assistant link) ──────────────────────────────────────
export function IcoChat({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...R}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      {/* ink dots for text */}
      <circle cx="9"  cy="11" r="0.8" fill={color} stroke="none" />
      <circle cx="12" cy="11" r="0.8" fill={color} stroke="none" />
      <circle cx="15" cy="11" r="0.8" fill={color} stroke="none" />
    </svg>
  );
}
