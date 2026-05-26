import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0a1e 0%, #1a0a2e 50%, #0d0a1e 100%)' }}
    >
      {/* Ambient glow orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%',
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div className="mb-6 text-center relative z-10">
        <div className="mx-auto mb-3" style={{ width: 200, height: 200, position: 'relative' }}>
          {/* Soft glow behind the logo */}
          <div style={{
            position: 'absolute', inset: -16,
            background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
          <img
            src="/logo.png"
            alt="Sorami"
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.45))' }}
          />
        </div>
        <p className="text-slate-400 text-xs tracking-widest uppercase">Your journey, your story</p>
      </div>

      {/* Feature pills */}
      <div className="flex gap-3 mb-8 text-xs text-slate-400 relative z-10 flex-wrap justify-center">
        {['🌍 3D Globe', '📖 Travel Diary', '⭐ Bucket List'].map(f => (
          <span key={f} className="px-3 py-1 rounded-full"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
            {f}
          </span>
        ))}
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm relative z-10"
        style={{ background: 'rgba(15,10,30,0.7)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, padding: 24, backdropFilter: 'blur(12px)' }}
      >
        {/* Sign In / Sign Up toggle */}
        <div className="flex rounded-xl p-1 mb-6"
          style={{ background: 'rgba(139,92,246,0.1)' }}
        >
          {['Sign In', 'Sign Up'].map((label, i) => (
            <button
              key={label}
              onClick={() => setIsLogin(i === 0)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={isLogin === (i === 0)
                ? { background: 'rgba(139,92,246,0.35)', color: '#e9d5ff', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }
                : { color: '#64748b' }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.25)'}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.25)'}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              boxShadow: '0 0 20px rgba(139,92,246,0.35)',
            }}
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-slate-600 text-xs mt-6 text-center relative z-10">
        By continuing, you agree to our Terms of Service
      </p>
    </div>
  );
}
