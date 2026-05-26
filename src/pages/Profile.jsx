import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useTravel, DEFAULT_STATUS_COLORS } from '../context/TravelContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, Edit2, Check, X, Palette } from 'lucide-react';

const STATUS_LABELS = {
  visited:    'Visited',
  bucketList: 'Bucket List',
  current:    'Traveling',
};

export default function Profile() {
  const { user } = useAuth();
  const { profile, updateProfile, stats, countryStatuses, statusColors } = useTravel();

  const [editingInfo,  setEditingInfo]  = useState(false);
  const [showColors,   setShowColors]   = useState(false);
  const [saving,       setSaving]       = useState(false);

  const [form, setForm] = useState({
    displayName:       '',
    bio:               '',
    birthday:          '',
    favoriteCountries: '',
  });

  const [customColors, setCustomColors] = useState({ ...DEFAULT_STATUS_COLORS });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName:       profile.displayName       || '',
        bio:               profile.bio               || '',
        birthday:          profile.birthday          || '',
        favoriteCountries: (profile.favoriteCountries || []).join(', '),
      });
      if (profile.statusColors) {
        setCustomColors({ ...DEFAULT_STATUS_COLORS, ...profile.statusColors });
      }
    }
  }, [profile]);

  const handleSaveInfo = async () => {
    await updateProfile({
      displayName:       form.displayName,
      bio:               form.bio,
      birthday:          form.birthday,
      favoriteCountries: form.favoriteCountries.split(',').map(s => s.trim()).filter(Boolean),
    });
    setEditingInfo(false);
  };

  const handleSaveColors = async () => {
    setSaving(true);
    try {
      await updateProfile({ statusColors: customColors });
      setShowColors(false);
    } catch (err) {
      console.error('Colors save failed:', err);
      alert('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const visitedCount = Object.values(countryStatuses).filter(s => s.status === 'visited').length;
  const bucketCount  = Object.values(countryStatuses).filter(s => s.status === 'bucketList').length;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-violet-500/15 to-transparent p-5 pt-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-0.5">
              {profile?.displayName || user?.email?.split('@')[0] || 'Traveler'}
            </h1>
            <p className="text-slate-400 text-xs">{user?.email}</p>
          </div>

          <div className="flex gap-2">
            {editingInfo ? (
              <>
                <button
                  onClick={handleSaveInfo}
                  className="w-9 h-9 bg-green-500/20 border border-green-500/40 rounded-xl flex items-center justify-center text-green-400"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingInfo(false)}
                  className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingInfo(true)}
                className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {editingInfo && (
          <input
            type="text"
            value={form.displayName}
            onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
            placeholder="Display name"
            className="text-xl font-bold text-white bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 w-full focus:outline-none focus:border-violet-500 mb-1"
          />
        )}
      </div>

      <div className="px-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 border rounded-2xl p-3 text-center" style={{ borderColor: statusColors.visited + '40' }}>
            <div className="text-xl font-bold" style={{ color: statusColors.visited }}>{visitedCount}</div>
            <div className="text-[11px] text-slate-400">Countries</div>
          </div>
          <div className="bg-slate-800 border rounded-2xl p-3 text-center" style={{ borderColor: statusColors.bucketList + '40' }}>
            <div className="text-xl font-bold" style={{ color: statusColors.bucketList }}>{bucketCount}</div>
            <div className="text-[11px] text-slate-400">Bucket List</div>
          </div>
          <div className="bg-slate-800 border rounded-2xl p-3 text-center" style={{ borderColor: statusColors.current + '40' }}>
            <div className="text-xl font-bold" style={{ color: statusColors.current }}>{stats.current}</div>
            <div className="text-[11px] text-slate-400">Traveling</div>
          </div>
        </div>

        {/* Bio */}
        <Section title="About Me">
          {editingInfo ? (
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Write a short bio..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed">
              {profile?.bio || <span className="text-slate-500 italic">No bio yet. Tap ✏️ to add one.</span>}
            </p>
          )}
        </Section>

        {/* Birthday */}
        <Section title="Birthday">
          {editingInfo ? (
            <input
              type="date"
              value={form.birthday}
              onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
            />
          ) : (
            <p className="text-slate-300 text-sm">
              {profile?.birthday || <span className="text-slate-500 italic">Not set</span>}
            </p>
          )}
        </Section>

        {/* Favourite countries */}
        <Section title="Favourite Countries">
          {editingInfo ? (
            <input
              type="text"
              value={form.favoriteCountries}
              onChange={e => setForm(p => ({ ...p, favoriteCountries: e.target.value }))}
              placeholder="Japan, Iceland, Switzerland"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          ) : profile?.favoriteCountries?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.favoriteCountries.map(c => (
                <span key={c} className="bg-slate-700 text-slate-200 text-xs px-3 py-1 rounded-full border border-slate-600">{c}</span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">No favourites set</p>
          )}
        </Section>

        {/* Colour customization */}
        <button
          onClick={() => setShowColors(true)}
          className="w-full bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-4 flex items-center gap-3 transition-colors"
        >
          <div className="w-9 h-9 bg-violet-500/15 border border-violet-500/30 rounded-xl flex items-center justify-center">
            <Palette className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-medium">Map Colour Customization</p>
            <p className="text-slate-400 text-xs">Change colours for Visited, Bucket List, etc.</p>
          </div>
          <span className="ml-auto text-slate-500">→</span>
        </button>

        {/* Sign out */}
        <button
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 hover:border-red-500/40 hover:text-red-400 text-slate-400 py-3 rounded-2xl text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Colour Customization Modal */}
      {showColors && (
        <Modal title="Map Colors" onClose={() => setShowColors(false)} onSave={handleSaveColors} saving={saving}>
          <p className="text-slate-400 text-xs mb-4">Tap any colour swatch to change it. Changes apply to the globe.</p>
          <div className="space-y-4">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-white/20" style={{ background: customColors[key] }} />
                  <span className="text-white text-sm">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-mono">{customColors[key]}</span>
                  <input
                    type="color"
                    value={customColors[key]}
                    onChange={e => setCustomColors(c => ({ ...c, [key]: e.target.value }))}
                    className="w-10 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCustomColors({ ...DEFAULT_STATUS_COLORS })}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline"
          >
            Reset to defaults
          </button>
        </Modal>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">{title}</p>
      {children}
    </div>
  );
}

function Modal({ title, onClose, onSave, saving, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative', width: '100%', maxWidth: '430px',
        background: '#0f172a', borderTop: '1px solid #334155',
        borderRadius: '24px 24px 0 0',
        maxHeight: 'min(92svh, 92vh)', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10, background: '#0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #1e293b',
        }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '16px 20px 0' }}>{children}</div>
        <div style={{ padding: '20px 20px 120px' }}>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              width: '100%', padding: '18px',
              background: saving ? '#0e7490' : '#8b5cf6',
              color: '#fff', border: 'none', borderRadius: '16px',
              fontSize: '16px', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
