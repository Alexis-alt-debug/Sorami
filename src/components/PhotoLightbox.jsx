import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Full-screen photo lightbox.
 *
 * Props:
 *   photos  – string[]        – array of base64/url photo strings
 *   index   – number          – which photo is currently open
 *   onClose – () => void
 *   onPrev  – () => void
 *   onNext  – () => void
 *   onJump  – (i) => void     – jump to photo at index i
 */
export default function PhotoLightbox({ photos, index, onClose, onPrev, onNext, onJump }) {
  const total = photos.length;

  // Keyboard navigation
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape')       onClose();
    if (e.key === 'ArrowLeft')    onPrev();
    if (e.key === 'ArrowRight')   onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!photos[index]) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.12)', border: 'none',
          borderRadius: '50%', width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', zIndex: 10,
        }}
      >
        <X size={20} />
      </button>

      {/* Counter */}
      {total > 1 && (
        <div
          style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.5)', color: '#cbd5e1',
            fontSize: 12, fontWeight: 600, padding: '4px 12px',
            borderRadius: 20, zIndex: 10,
          }}
        >
          {index + 1} / {total}
        </div>
      )}

      {/* Image */}
      <img
        src={photos[index]}
        alt=""
        onClick={e => e.stopPropagation()} // don't close when clicking the image
        style={{
          maxWidth: '92vw', maxHeight: '82vh',
          objectFit: 'contain',
          borderRadius: 12,
          boxShadow: '0 8px 60px rgba(0,0,0,0.8)',
          userSelect: 'none',
        }}
      />

      {/* Prev / Next arrows */}
      {total > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onPrev(); }}
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: '50%', width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNext(); }}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: '50%', width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Thumbnail strip (for multiple photos) */}
      {total > 1 && (
        <div
          style={{
            position: 'absolute', bottom: 20,
            display: 'flex', gap: 8, alignItems: 'center',
          }}
          onClick={e => e.stopPropagation()}
        >
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                onJump?.(i);
              }}
              style={{
                width: 48, height: 48, padding: 0,
                border: i === index ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.2)',
                borderRadius: 8, overflow: 'hidden',
                cursor: 'pointer', flexShrink: 0,
                opacity: i === index ? 1 : 0.6,
                transition: 'all 0.15s',
              }}
            >
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
