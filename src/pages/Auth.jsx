import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/config';

// ── Design tokens ─────────────────────────────────────────────────────────────
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
  green:  '#5a8a5a',
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(
        err.message
          .replace('Firebase: ', '')
          .replace(/\s*\(auth\/.*?\)\.?/, '')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetError('');
    if (!email.trim()) { setResetError('Enter your email address above first.'); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err) {
      setResetError(
        err.message
          .replace('Firebase: ', '')
          .replace(/\s*\(auth\/.*?\)\.?/, '')
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Decorative corner stamps ── */}
      <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 28, opacity: 0.12, pointerEvents: 'none', userSelect: 'none' }}>✈</div>
      <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 28, opacity: 0.12, pointerEvents: 'none', userSelect: 'none', transform: 'scaleX(-1)' }}>✈</div>
      <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 22, opacity: 0.10, pointerEvents: 'none', userSelect: 'none' }}>🗺️</div>
      <div style={{ position: 'absolute', bottom: 20, right: 20, fontSize: 22, opacity: 0.10, pointerEvents: 'none', userSelect: 'none' }}>📮</div>

      {/* ── Subtle postmark circle (decorative) ── */}
      <div style={{
        position: 'absolute', top: '8%', right: '5%',
        width: 90, height: 90, borderRadius: '50%',
        border: `2px dashed ${T.border}`,
        opacity: 0.35, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '12%', left: '4%',
        width: 60, height: 60, borderRadius: '50%',
        border: `2px dashed ${T.border}`,
        opacity: 0.25, pointerEvents: 'none',
      }} />

      {/* ── Logo ── */}
      <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 140, height: 140, margin: '0 auto 12px', position: 'relative' }}>
          {/* Stamp-style ring */}
          <div style={{
            position: 'absolute', inset: -10,
            borderRadius: '50%',
            border: `3px dashed ${T.border}`,
            opacity: 0.6,
            pointerEvents: 'none',
          }} />
          <img
            src="/logo.png"
            alt="Sorami"
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain', position: 'relative', zIndex: 1,
              filter: 'drop-shadow(0 2px 8px rgba(123,110,176,0.25))',
            }}
          />
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 30, fontWeight: 700, color: T.text,
          margin: '0 0 4px', letterSpacing: '0.02em',
        }}>
          Sorami
        </h1>
        <p style={{
          color: T.text3, fontSize: 12,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          fontFamily: "'Crimson Text', Georgia, serif",
          margin: 0,
        }}>
          Your journey, your story
        </p>
      </div>

      {/* ── Feature pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        {['🌍 3D Globe', '📖 Travel Diary', '⭐ Bucket List'].map(f => (
          <span key={f} style={{
            fontSize: 11, padding: '5px 12px', borderRadius: 20,
            background: `${T.purple}12`,
            border: `1.5px solid ${T.purple}30`,
            color: T.text2,
            fontFamily: "'Crimson Text', Georgia, serif",
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* ── Form card ── */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: T.card,
        border: `1.5px solid ${T.border}`,
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 4px 24px rgba(44,26,14,0.08)',
        position: 'relative', zIndex: 1,
      }}>

        {/* Postcard top stripe */}
        <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 3, background: `linear-gradient(90deg, ${T.rose}, ${T.purple}, ${T.gold})`, borderRadius: '0 0 3px 3px', opacity: 0.6 }} />

        {/* Sign In / Sign Up toggle */}
        <div style={{ display: 'flex', background: `${T.border}40`, borderRadius: 12, padding: 4, marginBottom: 22 }}>
          {['Sign In', 'Sign Up'].map((label, i) => (
            <button
              key={label}
              onClick={() => {
                setIsLogin(i === 0);
                setResetSent(false);
                setResetError('');
                setError('');
              }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 9,
                fontSize: 13, fontWeight: isLogin === (i === 0) ? 700 : 500,
                border: 'none', cursor: 'pointer',
                background: isLogin === (i === 0) ? T.card : 'transparent',
                color: isLogin === (i === 0) ? T.purple : T.text3,
                boxShadow: isLogin === (i === 0) ? '0 1px 6px rgba(44,26,14,0.1)' : 'none',
                transition: 'all 0.15s',
                fontFamily: "'Crimson Text', Georgia, serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6, fontFamily: "'Crimson Text', Georgia, serif" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setResetSent(false); setResetError(''); }}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: T.bg, border: `1.5px solid ${T.border}`,
                borderRadius: 10, padding: '10px 12px',
                color: T.text, fontSize: 13,
                outline: 'none', transition: 'border-color 0.15s',
                fontFamily: "'Crimson Text', Georgia, serif",
              }}
              onFocus={e  => e.target.style.borderColor = T.purple}
              onBlur={e   => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: "'Crimson Text', Georgia, serif" }}>
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: T.purple, fontFamily: "'Crimson Text', Georgia, serif",
                    opacity: resetLoading ? 0.5 : 1, padding: 0,
                  }}
                >
                  {resetLoading ? 'Sending…' : 'Forgot password?'}
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: T.bg, border: `1.5px solid ${T.border}`,
                borderRadius: 10, padding: '10px 12px',
                color: T.text, fontSize: 13,
                outline: 'none', transition: 'border-color 0.15s',
                fontFamily: "'Crimson Text', Georgia, serif",
              }}
              onFocus={e => e.target.style.borderColor = T.purple}
              onBlur={e  => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Reset sent confirmation */}
          {resetSent && (
            <div style={{ background: `${T.green}12`, border: `1.5px solid ${T.green}40`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 16, lineHeight: 1.2 }}>✉️</span>
              <p style={{ color: T.green, fontSize: 12, margin: 0, lineHeight: 1.55, fontFamily: "'Crimson Text', Georgia, serif" }}>
                Reset link sent to <strong>{email}</strong>. Check your inbox (and spam folder).
              </p>
            </div>
          )}

          {/* Reset error */}
          {resetError && (
            <p style={{ color: T.gold, fontSize: 12, background: `${T.gold}12`, border: `1.5px solid ${T.gold}35`, borderRadius: 10, padding: '8px 12px', margin: 0, fontFamily: "'Crimson Text', Georgia, serif" }}>
              {resetError}
            </p>
          )}

          {/* Sign in/up error */}
          {error && (
            <p style={{ color: T.rose, fontSize: 12, background: `${T.rose}12`, border: `1.5px solid ${T.rose}35`, borderRadius: 10, padding: '8px 12px', margin: 0, fontFamily: "'Crimson Text', Georgia, serif" }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0',
              borderRadius: 12, border: 'none',
              background: loading ? `${T.purple}70` : T.purple,
              color: '#fff',
              fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.15s',
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: '0.02em',
              boxShadow: loading ? 'none' : '0 2px 12px rgba(123,110,176,0.3)',
            }}
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* ── Footer note ── */}
      <p style={{ color: T.text3, fontSize: 11, marginTop: 20, textAlign: 'center', fontFamily: "'Crimson Text', Georgia, serif", position: 'relative', zIndex: 1 }}>
        By continuing, you agree to our Terms of Service
      </p>
    </div>
  );
}
