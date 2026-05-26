import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useTravel, DEFAULT_STATUS_COLORS } from '../context/TravelContext';
import { useAuth } from '../context/AuthContext';
import { IcoLogOut, IcoEdit, IcoCheck, IcoX, IcoPalette } from '../components/VintageIcons';

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
  navy:   '#6b7cb5',
  green:  '#5a8a5a',
  font:   "'Crimson Text', Georgia, serif",
  head:   "'Playfair Display', Georgia, serif",
};

const STATUS_LABELS = {
  visited:    'Visited',
  bucketList: 'Bucket List',
  current:    'Traveling',
};

export default function Profile() {
  const { user } = useAuth();
  const { profile, updateProfile, stats, countryStatuses, statusColors } = useTravel();

  const [editingInfo, setEditingInfo] = useState(false);
  const [showColors,  setShowColors]  = useState(false);
  const [saving,      setSaving]      = useState(false);

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
    } finally {
      setSaving(false);
    }
  };

  const visitedCount = Object.values(countryStatuses).filter(s => s.status === 'visited').length;
  const bucketCount  = Object.values(countryStatuses).filter(s => s.status === 'bucketList').length;
  const displayName  = profile?.displayName || user?.email?.split('@')[0] || 'Traveler';

  // ── Inline input style ───────────────────────────────────────────────────────
  const fieldInput = {
    width: '100%', boxSizing: 'border-box',
    background: T.bg, border: `1.5px solid ${T.border}`,
    borderRadius: 10, padding: '9px 12px',
    color: T.text, fontSize: 13, outline: 'none',
    transition: 'border-color 0.15s', fontFamily: T.font,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 32 }}>

      {/* ── Header ── */}
      <div style={{ background: T.card, borderBottom: `2px solid ${T.border}`, padding: '20px 16px 16px', boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: editingInfo ? 12 : 0 }}>
          <div>
            <h1 style={{ color: T.text, fontWeight: 700, fontSize: 20, margin: '0 0 3px', fontFamily: T.head }}>
              {displayName}
            </h1>
            <p style={{ color: T.text3, fontSize: 12, margin: 0, fontFamily: T.font }}>{user?.email}</p>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {editingInfo ? (
              <>
                <button
                  onClick={handleSaveInfo}
                  style={{ width: 34, height: 34, background: `${T.green}18`, border: `1.5px solid ${T.green}50`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.green }}
                >
                  <IcoCheck size={15} color={T.green} />
                </button>
                <button
                  onClick={() => setEditingInfo(false)}
                  style={{ width: 34, height: 34, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.text3 }}
                >
                  <IcoX size={15} color={T.text3} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingInfo(true)}
                style={{ width: 34, height: 34, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.text3 }}
              >
                <IcoEdit size={15} color={T.text3} />
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
            style={{ ...fieldInput, fontSize: 15, fontWeight: 600, fontFamily: T.head }}
            onFocus={e => e.target.style.borderColor = T.purple}
            onBlur={e  => e.target.style.borderColor = T.border}
          />
        )}
      </div>

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { count: visitedCount,    label: 'Countries',   color: statusColors.visited    || T.rose },
            { count: bucketCount,     label: 'Bucket List', color: statusColors.bucketList || T.navy },
            { count: stats.current,   label: 'Traveling',   color: statusColors.current    || T.gold },
          ].map(({ count, label, color }) => (
            <div key={label} style={{ background: T.card, border: `2px dashed ${color}60`, borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
              <p style={{ color, fontWeight: 700, fontSize: 22, margin: '0 0 2px', fontFamily: T.head }}>{count}</p>
              <p style={{ color: T.text3, fontSize: 10, margin: 0, fontFamily: T.font }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── About Me ── */}
        <Section title="About Me">
          {editingInfo ? (
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Write a short bio…"
              rows={3}
              style={{ ...fieldInput, resize: 'none' }}
              onFocus={e => e.target.style.borderColor = T.purple}
              onBlur={e  => e.target.style.borderColor = T.border}
            />
          ) : (
            <p style={{ color: form.bio ? T.text2 : T.text3, fontSize: 13, margin: 0, lineHeight: 1.6, fontStyle: form.bio ? 'normal' : 'italic', fontFamily: T.font }}>
              {profile?.bio || 'No bio yet. Tap ✏️ to add one.'}
            </p>
          )}
        </Section>

        {/* ── Birthday ── */}
        <Section title="Birthday">
          {editingInfo ? (
            <input
              type="date"
              value={form.birthday}
              onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
              style={{ ...fieldInput, width: 'auto' }}
              onFocus={e => e.target.style.borderColor = T.purple}
              onBlur={e  => e.target.style.borderColor = T.border}
            />
          ) : (
            <p style={{ color: profile?.birthday ? T.text2 : T.text3, fontSize: 13, margin: 0, fontStyle: profile?.birthday ? 'normal' : 'italic', fontFamily: T.font }}>
              {profile?.birthday || 'Not set'}
            </p>
          )}
        </Section>

        {/* ── Favourite Countries ── */}
        <Section title="Favourite Countries">
          {editingInfo ? (
            <input
              type="text"
              value={form.favoriteCountries}
              onChange={e => setForm(p => ({ ...p, favoriteCountries: e.target.value }))}
              placeholder="Japan, Iceland, Switzerland"
              style={fieldInput}
              onFocus={e => e.target.style.borderColor = T.purple}
              onBlur={e  => e.target.style.borderColor = T.border}
            />
          ) : profile?.favoriteCountries?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.favoriteCountries.map(c => (
                <span key={c} style={{ fontSize: 12, background: `${T.navy}12`, border: `1px solid ${T.navy}30`, color: T.navy, padding: '4px 10px', borderRadius: 20, fontFamily: T.font }}>
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: T.text3, fontSize: 13, margin: 0, fontStyle: 'italic', fontFamily: T.font }}>No favourites set</p>
          )}
        </Section>

        {/* ── Map Colour Customization ── */}
        <button
          onClick={() => setShowColors(true)}
          style={{ width: '100%', background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
        >
          <div style={{ width: 36, height: 36, background: `${T.purple}14`, border: `1.5px solid ${T.purple}40`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcoPalette size={16} color={T.purple} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: '0 0 2px', fontFamily: T.head }}>Map Colour Customization</p>
            <p style={{ color: T.text3, fontSize: 11, margin: 0, fontFamily: T.font }}>Change colours for Visited, Bucket List, etc.</p>
          </div>
          <span style={{ color: T.text3, fontSize: 16 }}>→</span>
        </button>

        {/* ── Sign Out ── */}
        <button
          onClick={() => signOut(auth)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: T.card, border: `1.5px solid ${T.border}`, color: T.text3, padding: '12px', borderRadius: 14, fontSize: 13, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.rose}60`; e.currentTarget.style.color = T.rose; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}
        >
          <IcoLogOut size={15} color={T.text3} /> Sign Out
        </button>
      </div>

      {/* ── Map Colours Modal ── */}
      {showColors && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.45)' }} onClick={() => setShowColors(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: T.card, border: `1.5px solid ${T.border}`, borderTop: 'none', borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 -4px 24px rgba(44,26,14,0.1)' }}>

            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
            </div>

            {/* Modal header */}
            <div style={{ position: 'sticky', top: 0, background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px', borderBottom: `1px solid ${T.border}`, zIndex: 2 }}>
              <h2 style={{ margin: 0, color: T.text, fontSize: 17, fontWeight: 700, fontFamily: T.head }}>Map Colors</h2>
              <button onClick={() => setShowColors(false)} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <IcoX size={18} color={T.text3} />
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <p style={{ color: T.text3, fontSize: 12, marginBottom: 16, fontFamily: T.font }}>Tap any colour swatch to change it. Changes apply to the globe.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: customColors[key], border: `1.5px solid ${T.border}`, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ color: T.text, fontSize: 13, fontFamily: T.font }}>{label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: T.text3, fontSize: 11, fontFamily: 'monospace' }}>{customColors[key]}</span>
                      <input
                        type="color"
                        value={customColors[key]}
                        onChange={e => setCustomColors(c => ({ ...c, [key]: e.target.value }))}
                        style={{ width: 36, height: 30, borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${T.border}`, background: 'transparent', padding: 2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCustomColors({ ...DEFAULT_STATUS_COLORS })}
                style={{ marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: T.text3, textDecoration: 'underline', fontFamily: T.font, padding: 0 }}
              >
                Reset to defaults
              </button>
            </div>

            <div style={{ padding: '8px 20px 32px' }}>
              <button
                onClick={handleSaveColors}
                disabled={saving}
                style={{ width: '100%', padding: 14, background: saving ? `${T.purple}60` : T.purple, color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: T.head }}
              >
                {saving ? 'Saving…' : 'Save Colors'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#faf6ef', border: '1.5px solid #d4c4a8', borderRadius: 14, padding: 14 }}>
      <p style={{ color: '#a89070', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 10px', fontFamily: "'Crimson Text', Georgia, serif" }}>
        {title}
      </p>
      {children}
    </div>
  );
}
