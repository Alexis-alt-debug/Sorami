import { useRef, useState, useEffect } from 'react';
import { getFlagEmoji } from '../data/countryNames';
import { formatBudget } from './CurrencyBudgetField';
import { format, parseISO } from 'date-fns';

const W = 1200;
const H = 750;

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

// Returns array of wrapped lines (up to maxLines)
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

// ── Postcard generator ────────────────────────────────────────────────────────

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
    // Gradient fallback
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0c1827');
    bg.addColorStop(1, '#0f2d4a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath(); ctx.arc(900, 150, 300, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(200, 600, 220, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── Dark gradient overlay ───────────────────────────────────────────────────
  const ov = ctx.createLinearGradient(0, 0, 0, H);
  ov.addColorStop(0,    'rgba(0,0,0,0.05)');
  ov.addColorStop(0.38, 'rgba(0,0,0,0.08)');
  ov.addColorStop(0.62, 'rgba(0,0,0,0.52)');
  ov.addColorStop(1,    'rgba(0,0,0,0.91)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, W, H);

  // ── Top watermark ───────────────────────────────────────────────────────────
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '500 17px -apple-system, system-ui, sans-serif';
  ctx.fillText('✈  WanderLog', W - 32, 44);

  // ── Build bottom text stack (bottom-up) ─────────────────────────────────────
  const PADDING_X = 52;
  const MAX_TEXT_W = W - PADDING_X * 2;
  let y = H - 26;

  // Bottom branding line
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(100,116,139,0.75)';
  ctx.font = '14px -apple-system, system-ui, sans-serif';
  ctx.fillText('Made with ✈  WanderLog', W - PADDING_X, y);
  y -= 44;

  // Diary excerpt (up to 3 lines)
  if (memory.diary?.trim()) {
    ctx.textAlign = 'left';
    ctx.font = 'italic 20px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(203,213,225,0.82)';
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
    ctx.font = '19px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.88)';
    ctx.fillText('💰  ' + formatBudget(memory.budget, memory.budgetCurrency), PADDING_X, y);
    y -= 38;
  }

  // Star rating
  if (memory.rating > 0) {
    ctx.textAlign = 'left';
    ctx.font = '28px system-ui, -apple-system';
    ctx.fillStyle = '#facc15';
    ctx.fillText('★'.repeat(memory.rating) + '☆'.repeat(5 - memory.rating), PADDING_X, y);
    y -= 42;
  }

  // City + date
  const cityDate = [memory.region, formatDateRange(memory.date, memory.dateTo)]
    .filter(Boolean).join('   ·   ');
  if (cityDate) {
    ctx.textAlign = 'left';
    ctx.font = '22px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.fillText(truncateText(ctx, cityDate, MAX_TEXT_W), PADDING_X, y);
    y -= 44;
  }

  // Flag + Country name
  const flag        = getFlagEmoji(memory.countryAlpha2 || '');
  const countryName = memory.countryName || '';

  ctx.textAlign = 'left';
  // Flag (emoji)
  ctx.font = '58px system-ui, -apple-system';
  ctx.fillStyle = '#ffffff';
  const flagText = flag ? flag + '  ' : '';
  ctx.fillText(flagText, PADDING_X, y);
  const flagW = flag ? ctx.measureText(flagText).width : 0;

  // Country name
  ctx.font = 'bold 54px -apple-system, system-ui, sans-serif';
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

  // Lock scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Generate on mount
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
    a.download = `wanderlog-${(memory.countryName || 'memory').toLowerCase().replace(/\s+/g, '-')}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'wanderlog-memory.jpg', { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${memory.countryName} – WanderLog`,
        });
      } else {
        // Fallback to download when Web Share isn't available
        await handleDownload();
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  const flag        = getFlagEmoji(memory.countryAlpha2 || '');
  const canShare    = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.75)',
    }}>

      {/* Backdrop tap → close */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      {/* Sheet */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 430,
        background: '#1e293b',
        borderRadius: '20px 20px 0 0',
        border: '1px solid #334155',
        borderBottom: 'none',
        display: 'flex', flexDirection: 'column',
        maxHeight: '92vh',
      }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#475569' }} />
        </div>

        {/* Header */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 16px 12px', borderBottom: '1px solid #334155',
        }}>
          <div>
            <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 15 }}>
              {flag} Travel Postcard
            </p>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 12 }}>
              {memory.countryName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
          >✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>

          {/* Preview area */}
          <div style={{
            margin: 16,
            borderRadius: 14,
            overflow: 'hidden',
            background: '#0f172a',
            border: '1px solid #334155',
            aspectRatio: '8/5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {generating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '3px solid #334155', borderTopColor: '#8b5cf6',
                  animation: 'pc-spin 0.8s linear infinite',
                }} />
                <span style={{ color: '#475569', fontSize: 12 }}>Generating postcard…</span>
              </div>
            )}
            {genError && !generating && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>Failed to generate postcard</p>
                <p style={{ color: '#475569', fontSize: 12, margin: '6px 0 0' }}>Try closing and reopening</p>
              </div>
            )}
            {preview && !generating && (
              <img
                src={preview}
                alt="Postcard preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>

          {/* Info chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 16px 4px' }}>
            {[
              memory.region && `📍 ${memory.region}`,
              memory.rating > 0 && `${'★'.repeat(memory.rating)} ${memory.rating}/5`,
              memory.budget > 0 && `💰 ${formatBudget(memory.budget, memory.budgetCurrency)}`,
              memory.weather && `🌤 ${memory.weather}`,
            ].filter(Boolean).map((chip, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11, background: 'rgba(6,182,212,0.08)',
                  border: '1px solid rgba(6,182,212,0.18)',
                  color: '#94a3b8', borderRadius: 20, padding: '4px 10px',
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: canShare ? '1fr 1fr' : '1fr', gap: 10 }}>
            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={generating || genError}
              style={{
                padding: '14px', borderRadius: 12,
                background: generating || genError ? '#1e293b' : '#0f172a',
                border: '1px solid #334155',
                color: generating || genError ? '#475569' : '#e2e8f0',
                fontSize: 14, fontWeight: 600, cursor: generating || genError ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>⬇️</span> Download
            </button>

            {/* Share (only when Web Share API is available) */}
            {canShare && (
              <button
                onClick={handleShare}
                disabled={generating || genError || sharing}
                style={{
                  padding: '14px', borderRadius: 12,
                  background: generating || genError ? '#164e63' : '#8b5cf6',
                  border: 'none',
                  color: '#fff',
                  fontSize: 14, fontWeight: 700,
                  cursor: generating || genError ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: generating || genError ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {sharing ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'pc-spin 0.7s linear infinite' }} />
                    Sharing…
                  </>
                ) : (
                  <><span style={{ fontSize: 18 }}>📤</span> Share</>
                )}
              </button>
            )}
          </div>

          {/* Tip */}
          <p style={{ margin: '0 16px 20px', fontSize: 11, color: '#475569', textAlign: 'center', lineHeight: 1.5 }}>
            Your postcard is {W}×{H}px — perfect for Instagram & social media
          </p>

        </div>
      </div>

      {/* Keyframe + hidden canvas */}
      <style>{`@keyframes pc-spin { to { transform: rotate(360deg); } }`}</style>
      <canvas ref={canvasRef} width={W} height={H} style={{ display: 'none' }} />
    </div>
  );
}
