import { useRef, useState, useEffect } from 'react';
import { getFlagEmoji } from '../data/countryNames';
import { formatBudget } from './CurrencyBudgetField';
import { format, parseISO } from 'date-fns';

const W = 1200;
const H = 750;

// ── Parchment design tokens ───────────────────────────────────────────────────
const T = {
  bg:     '#f0e8d8',
  card:   '#faf6ef',
  border: '#d4c4a8',
  text:   '#2c1a0e',
  text2:  '#7a6048',
  text3:  '#a89070',
  purple: '#7b6eb0',
  gold:   '#c4922a',
  rose:   '#c4809a',
  font:   "'Crimson Text', Georgia, serif",
};

// ── Canvas helpers ─────────────────────────────────────────────────────────────
function drawImageCover(ctx, img) {
  const iA = img.width / img.height;
  const cA = W / H;
  let sx, sy, sw, sh;
  if (iA > cA) {
    sh = img.height; sw = sh * cA;
    sx = (img.width - sw) / 2; sy = 0;
  } else {
    sw = img.width; sh = sw / cA;
    sx = 0; sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
}

function truncateText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 0 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
  return text + '…';
}

function wrapTextLines(ctx, text, maxW, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      if (lines.length >= maxLines) return lines;
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < maxLines) {
    lines.push(truncateText(ctx, cur, maxW));
  } else if (lines.length === maxLines && cur) {
    lines[maxLines - 1] = truncateText(ctx, lines[maxLines - 1] + ' ' + cur, maxW);
  }
  return lines;
}

function formatDateRange(date, dateTo) {
  if (!date) return '';
  try {
    const from = parseISO(date);
    if (!dateTo) return format(from, 'MMM d, yyyy');
    const to = parseISO(dateTo);
    const sameYear = format(from, 'yyyy') === format(to, 'yyyy');
    if (sameYear) return `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`;
    return `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;
  } catch { return ''; }
}

// ── Postcard canvas renderer ──────────────────────────────────────────────────
async function renderPostcard(canvas, memory) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // ── Background ──────────────────────────────────────────────────────────────
  if (memory.photos?.length > 0) {
    const img = new Image();
    img.src = memory.photos[0];
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    drawImageCover(ctx, img);
  } else {
    // Parchment gradient fallback
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#e8dcc8');
    bg.addColorStop(1, '#d4c4a8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle decorative circles
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#7b6eb0';
    ctx.beginPath(); ctx.arc(900, 150, 300, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(200, 600, 220, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── Dark gradient overlay for readability ──────────────────────────────────
  const ov = ctx.createLinearGradient(0, 0, 0, H);
  ov.addColorStop(0,    'rgba(0,0,0,0.04)');
  ov.addColorStop(0.38, 'rgba(0,0,0,0.08)');
  ov.addColorStop(0.62, 'rgba(0,0,0,0.50)');
  ov.addColorStop(1,    'rgba(0,0,0,0.88)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, W, H);

  // ── Top watermark ────────────────────────────────────────────────────────────
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '500 17px Georgia, serif';
  ctx.fillText('✈  Sorami', W - 32, 44);

  // ── Build bottom text stack (bottom-up) ─────────────────────────────────────
  const PADDING_X = 52;
  const MAX_TEXT_W = W - PADDING_X * 2;
  let y = H - 26;

  // Bottom branding line
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(168,144,112,0.8)';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Made with ✈  Sorami', W - PADDING_X, y);
  y -= 44;

  // Diary excerpt (up to 3 lines)
  if (memory.diary?.trim()) {
    ctx.textAlign = 'left';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = 'rgba(240,232,216,0.85)';
    const diaryLines = wrapTextLines(ctx, '"' + memory.diary.trim() + '"', MAX_TEXT_W, 3);
    for (let i = diaryLines.length - 1; i >= 0; i--) {
      ctx.fillText(diaryLines[i], PADDING_X, y);
      y -= 32;
    }
    y -= 10;
  }

  // Budget
  if (memory.budget > 0) {
    ctx.textAlign = 'left';
    ctx.font = '19px Georgia, serif';
    ctx.fillStyle = 'rgba(196,144,42,0.9)';
    ctx.fillText('💰  ' + formatBudget(memory.budget, memory.budgetCurrency), PADDING_X, y);
    y -= 38;
  }

  // Star rating
  if (memory.rating > 0) {
    ctx.textAlign = 'left';
    ctx.font = '28px system-ui, -apple-system';
    ctx.fillStyle = '#c4922a';
    ctx.fillText('★'.repeat(memory.rating) + '☆'.repeat(5 - memory.rating), PADDING_X, y);
    y -= 42;
  }

  // City + date
  const cityDate = [memory.region, formatDateRange(memory.date, memory.dateTo)]
    .filter(Boolean).join('   ·   ');
  if (cityDate) {
    ctx.textAlign = 'left';
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = 'rgba(212,196,168,0.9)';
    ctx.fillText(truncateText(ctx, cityDate, MAX_TEXT_W), PADDING_X, y);
    y -= 44;
  }

  // Flag + Country name
  const flag        = getFlagEmoji(memory.countryAlpha2 || '');
  const countryName = memory.countryName || '';
  ctx.textAlign = 'left';
  ctx.font = '58px system-ui, -apple-system';
  ctx.fillStyle = '#ffffff';
  const flagText = flag ? flag + '  ' : '';
  ctx.fillText(flagText, PADDING_X, y);
  const flagW = flag ? ctx.measureText(flagText).width : 0;

  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(truncateText(ctx, countryName, MAX_TEXT_W - flagW), PADDING_X + flagW, y);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PostcardModal({ memory, onClose }) {
  const canvasRef = useRef();
  const [preview,    setPreview]    = useState(null);
  const [generating, setGenerating] = useState(true);
  const [genError,   setGenError]   = useState(false);
  const [sharing,    setSharing]    = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    setGenerating(true);
    setGenError(false);
    (async () => {
      try {
        await renderPostcard(canvasRef.current, memory);
        setPreview(canvasRef.current.toDataURL('image/jpeg', 0.93));
      } catch (err) {
        console.error('Postcard render failed:', err);
        setGenError(true);
      } finally {
        setGenerating(false);
      }
    })();
  }, [memory]);

  const getBlob = () =>
    new Promise(res => canvasRef.current.toBlob(res, 'image/jpeg', 0.93));

  const handleDownload = async () => {
    const blob = await getBlob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `sorami-${(memory.countryName || 'memory').toLowerCase().replace(/\s+/g, '-')}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'sorami-memory.jpg', { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${memory.countryName} – Sorami` });
      } else {
        await handleDownload();
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  const flag     = getFlagEmoji(memory.countryAlpha2 || '');
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const disabled = generating || genError;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end',
      background: 'rgba(44,26,14,0.55)',
    }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      {/* Sheet */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 430,
        background: T.card,
        borderRadius: '20px 20px 0 0',
        border: `1.5px solid ${T.border}`,
        borderBottom: 'none',
        display: 'flex', flexDirection: 'column',
        maxHeight: '92vh',
        boxShadow: '0 -4px 24px rgba(44,26,14,0.12)',
      }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>

        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 12px', borderBottom: `1px solid ${T.border}` }}>
          <div>
            <p style={{ margin: 0, color: T.text, fontWeight: 700, fontSize: 15, fontFamily: "'Playfair Display', Georgia, serif" }}>
              {flag} Travel Postcard
            </p>
            <p style={{ margin: '2px 0 0', color: T.text3, fontSize: 12, fontFamily: T.font }}>
              {memory.countryName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
          >✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>

          {/* Preview */}
          <div style={{
            margin: 16, borderRadius: 14, overflow: 'hidden',
            background: T.bg, border: `1.5px solid ${T.border}`,
            aspectRatio: '8/5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {generating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid ${T.border}`, borderTopColor: T.purple, animation: 'pc-spin 0.8s linear infinite' }} />
                <span style={{ color: T.text3, fontSize: 12, fontFamily: T.font }}>Generating postcard…</span>
              </div>
            )}
            {genError && !generating && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ color: T.rose, fontSize: 13, margin: 0, fontFamily: T.font }}>Failed to generate postcard</p>
                <p style={{ color: T.text3, fontSize: 12, margin: '6px 0 0', fontFamily: T.font }}>Try closing and reopening</p>
              </div>
            )}
            {preview && !generating && (
              <img src={preview} alt="Postcard preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
          </div>

          {/* Info chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 16px 4px' }}>
            {[
              memory.region   && `📍 ${memory.region}`,
              memory.rating > 0 && `${'★'.repeat(memory.rating)} ${memory.rating}/5`,
              memory.budget > 0 && `💰 ${formatBudget(memory.budget, memory.budgetCurrency)}`,
              memory.weather  && `🌤 ${memory.weather}`,
            ].filter(Boolean).map((chip, i) => (
              <span key={i} style={{ fontSize: 11, background: `${T.navy}10`, border: `1px solid ${T.border}`, color: T.text3, borderRadius: 20, padding: '4px 10px', fontFamily: T.font }}>
                {chip}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: canShare ? '1fr 1fr' : '1fr', gap: 10 }}>
            <button
              onClick={handleDownload}
              disabled={disabled}
              style={{
                padding: 14, borderRadius: 12,
                background: T.bg, border: `1.5px solid ${T.border}`,
                color: disabled ? T.text3 : T.text2,
                fontSize: 14, fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
                fontFamily: T.font,
              }}
            >
              <span style={{ fontSize: 18 }}>⬇️</span> Download
            </button>

            {canShare && (
              <button
                onClick={handleShare}
                disabled={disabled || sharing}
                style={{
                  padding: 14, borderRadius: 12,
                  background: disabled ? `${T.purple}30` : T.purple,
                  border: 'none',
                  color: '#fff',
                  fontSize: 14, fontWeight: 700,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
                  fontFamily: T.font,
                }}
              >
                {sharing ? (
                  <>
                    <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'pc-spin 0.7s linear infinite' }} />
                    Sharing…
                  </>
                ) : (
                  <><span style={{ fontSize: 18 }}>📤</span> Share</>
                )}
              </button>
            )}
          </div>

          <p style={{ margin: '0 16px 20px', fontSize: 11, color: T.text3, textAlign: 'center', lineHeight: 1.5, fontFamily: T.font }}>
            Your postcard is {W}×{H}px — perfect for Instagram &amp; social media
          </p>
        </div>
      </div>

      <style>{`@keyframes pc-spin { to { transform: rotate(360deg); } }`}</style>
      <canvas ref={canvasRef} width={W} height={H} style={{ display: 'none' }} />
    </div>
  );
}
