import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { IcoUser, IcoCamera, IcoEdit, IcoCheck, IcoX, IcoRefresh, IcoPlus, IcoTrash, IcoLogOut, IcoStar, IcoPlane, IcoChat } from '../components/VintageIcons';

// ── Vintage pen-and-ink SVG icons ─────────────────────────────────────────────
function IcoHome({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11L12 3l9 8" strokeWidth="2.1" />
      <path d="M15.5 5V8" strokeWidth="2.1" />
      <path d="M5 9.5V20h4.5v-5.5h5V20H19V9.5" strokeWidth="2" />
      <rect x="9.2" y="9.5" width="3" height="2.8" rx="0.4" strokeWidth="1.4" />
      <line x1="10.7" y1="9.5" x2="10.7" y2="12.3" strokeWidth="0.9" />
      <line x1="9.2"  y1="11"  x2="12.2" y2="11"   strokeWidth="0.9" />
      <path d="M10.5 20v-4.5a1.5 1.5 0 013 0V20" strokeWidth="1.4" />
    </svg>
  );
}
function IcoGlobe({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.6" />
      <line x1="4.5"  y1="7.5"  x2="19.5" y2="7.5"  strokeWidth="1" strokeDasharray="2 1.8" />
      <line x1="4.5"  y1="16.5" x2="19.5" y2="16.5" strokeWidth="1" strokeDasharray="2 1.8" />
      <path d="M12 3c-3.8 4.5-3.8 13.5 0 18" strokeWidth="1.5" />
      <path d="M12 3c3.8 4.5 3.8 13.5 0 18"  strokeWidth="1.5" />
    </svg>
  );
}
function IcoDiary({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5C10 4.2 7 4 4 5v14c3-1 6-0.8 8 0.5" strokeWidth="2" />
      <path d="M12 5.5c2-1.3 5-1.5 8 0v14c-3-1-6-0.8-8 0.5" strokeWidth="2" />
      <line x1="12" y1="5.5" x2="12" y2="20" strokeWidth="2" />
      <line x1="5.5"  y1="9.5"  x2="10.5" y2="9.5"  strokeWidth="1.3" />
      <line x1="5.5"  y1="12.5" x2="10.5" y2="12.5" strokeWidth="1.3" />
      <line x1="5.5"  y1="15.5" x2="10.5" y2="15.5" strokeWidth="1.3" />
      <line x1="13.5" y1="9.5"  x2="18.5" y2="9.5"  strokeWidth="1.3" />
      <line x1="13.5" y1="12.5" x2="18.5" y2="12.5" strokeWidth="1.3" />
      <line x1="13.5" y1="15.5" x2="18.5" y2="15.5" strokeWidth="1.3" />
      <path d="M18 4v6l-1.8-1.5L14.5 10V4" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function IcoStats({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="20" x2="21" y2="20" strokeWidth="2" />
      <rect x="4.5"  y="13" width="3.5" height="7" rx="0.5" strokeWidth="1.8" />
      <rect x="10"   y="8"  width="3.5" height="12" rx="0.5" strokeWidth="1.8" />
      <rect x="15.5" y="4"  width="3.5" height="16" rx="0.5" strokeWidth="1.8" />
      <circle cx="6.25"  cy="11.8" r="0.9" fill={color} stroke="none" />
      <circle cx="11.75" cy="6.8"  r="0.9" fill={color} stroke="none" />
      <circle cx="17.25" cy="2.8"  r="0.9" fill={color} stroke="none" />
    </svg>
  );
}
function IcoQuill({ color = '#a89070', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 3c-6 1-11 6-12 13" strokeWidth="2" />
      <path d="M20 3c1 6-4 11-12 13" strokeWidth="2" />
      <path d="M8 16l-2.5 5.5" strokeWidth="2" />
      <path d="M6.5 19.5 Q7.5 19 8.5 19.5" strokeWidth="1.3" fill="none" />
      <line x1="15.5" y1="6"  x2="11" y2="10.5" strokeWidth="1.4" />
      <line x1="12.5" y1="9"  x2="9"  y2="12.5" strokeWidth="1.4" />
    </svg>
  );
}
function IcoGroups({ color = '#a89070', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7"   r="3"   strokeWidth="2" />
      <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeWidth="2" />
      <circle cx="5"  cy="8.5" r="2.2" strokeWidth="1.5" />
      <path d="M1 21v-1.5a3 3 0 013-3h2"   strokeWidth="1.5" />
      <circle cx="19" cy="8.5" r="2.2" strokeWidth="1.5" />
      <path d="M23 21v-1.5a3 3 0 00-3-3h-2" strokeWidth="1.5" />
    </svg>
  );
}
function IcoPalette({ color = '#a89070', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10 1.4 0 2.5-1.1 2.5-2.5 0-.6-.2-1.2-.6-1.6-.4-.4-.6-.9-.6-1.4 0-1.4 1.1-2.5 2.5-2.5H18c2.8 0 5-2.2 5-5C23 6.7 18 2 12 2z" strokeWidth="2" />
      <circle cx="7"  cy="12" r="1.3" fill={color} stroke="none" />
      <circle cx="9"  cy="7.5" r="1.3" fill={color} stroke="none" />
      <circle cx="13" cy="6"  r="1.3" fill={color} stroke="none" />
      <circle cx="17" cy="9"  r="1.3" fill={color} stroke="none" />
    </svg>
  );
}
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useTravel, DEFAULT_STATUS_COLORS } from '../context/TravelContext';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_NAMES } from '../data/countryNames';
import FlagImg from '../components/FlagImg';

const STATUS_LABELS = {
  visited:    'Visited',
  bucketList: 'Bucket List',
  current:    'Traveling',
};

const DEFAULT_HOME_COLOR = '#ff6b6b';

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:     '#f0e8d8',
  card:   '#faf6ef',
  border: '#d4c4a8',
  text:   '#2c1a0e',
  text2:  '#7a6048',
  text3:  '#a89070',
  rose:   '#c4809a',
  navy:   '#6b7cb5',
  gold:   '#c4922a',
  purple: '#7b6eb0',
};

// Crop + compress profile photo to 300×300
function compressProfilePhoto(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 300;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(new File([blob], 'profile.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.75);
    };
    img.src = url;
  });
}

export default function Home() {
  const { stats, profile, updateProfile, statusColors } = useTravel();
  const { user } = useAuth();
  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Traveler';
  const photoFileRef = useRef();

  // ── Profile edit ─────────────────────────────────────────────────────────────
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile,  setSavingProfile]  = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [form, setForm] = useState({ displayName: '', bio: '', birthday: '' });

  // ── Home country ─────────────────────────────────────────────────────────────
  const [homeCountrySearch, setHomeCountrySearch] = useState('');
  const [homeCountryOpen,   setHomeCountryOpen]   = useState(false);
  const homeCountryResults = useMemo(() => {
    if (!homeCountrySearch.trim()) return [];
    const q = homeCountrySearch.toLowerCase();
    return Object.entries(COUNTRY_NAMES)
      .filter(([, v]) => v.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map(([id, v]) => ({ id, ...v }));
  }, [homeCountrySearch]);

  // ── Travel groups ────────────────────────────────────────────────────────────
  const savedGroups = profile?.travelGroups || [];

  const [addingGroup,    setAddingGroup]    = useState(false);
  const [newGroupName,   setNewGroupName]   = useState('');
  const [newGroupEmoji,  setNewGroupEmoji]  = useState('👥');
  const [addingMemberTo, setAddingMemberTo] = useState(null);
  const [newMemberName,  setNewMemberName]  = useState('');

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    const newGroup = { id: Date.now().toString(), name: newGroupName.trim(), emoji: newGroupEmoji || '👥', members: [] };
    await updateProfile({ travelGroups: [...savedGroups, newGroup] });
    setNewGroupName(''); setNewGroupEmoji('👥'); setAddingGroup(false);
  };

  const handleDeleteGroup = async (groupId) => {
    await updateProfile({ travelGroups: savedGroups.filter(g => g.id !== groupId) });
  };

  const handleAddMember = async (groupId) => {
    const name = newMemberName.trim();
    if (!name) return;
    const updated = savedGroups.map(g =>
      g.id === groupId ? { ...g, members: [...g.members, name] } : g
    );
    await updateProfile({ travelGroups: updated });
    setNewMemberName(''); setAddingMemberTo(null);
  };

  const handleRemoveMember = async (groupId, memberName) => {
    const updated = savedGroups.map(g =>
      g.id === groupId ? { ...g, members: g.members.filter(m => m !== memberName) } : g
    );
    await updateProfile({ travelGroups: updated });
  };

  // ── Color customization ───────────────────────────────────────────────────────
  const [customColors,   setCustomColors]   = useState({ ...DEFAULT_STATUS_COLORS, homeCountry: DEFAULT_HOME_COLOR });
  const [savingColors,   setSavingColors]   = useState(false);
  const [colorsSavedMsg, setColorsSavedMsg] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        bio:         profile.bio         || '',
        birthday:    profile.birthday    || '',
      });
      setCustomColors({
        ...DEFAULT_STATUS_COLORS,
        homeCountry: DEFAULT_HOME_COLOR,
        ...(profile.statusColors || {}),
        homeCountry: profile.homeCountryColor || DEFAULT_HOME_COLOR,
      });
    }
  }, [profile]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPhotoUploading(true);
    try {
      const compressed = await compressProfilePhoto(file);
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = ev => res(ev.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(compressed);
      });
      await updateProfile({ photoURL: base64 });
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ displayName: form.displayName, bio: form.bio, birthday: form.birthday });
      setEditingProfile(false);
    } catch (err) {
      console.error('Profile save failed:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setForm({ displayName: profile?.displayName || '', bio: profile?.bio || '', birthday: profile?.birthday || '' });
    setEditingProfile(false);
  };

  const handleSaveColors = async () => {
    setSavingColors(true);
    try {
      const { homeCountry: hcColor, ...statusClrs } = customColors;
      await updateProfile({ statusColors: statusClrs, homeCountryColor: hcColor });
      setColorsSavedMsg(true);
      setTimeout(() => setColorsSavedMsg(false), 2000);
    } catch (err) {
      console.error('Colors save failed:', err);
    } finally {
      setSavingColors(false);
    }
  };

  const handleResetColors = () => setCustomColors({ ...DEFAULT_STATUS_COLORS, homeCountry: DEFAULT_HOME_COLOR });

  const handleSelectHomeCountry = async (country) => {
    await updateProfile({ homeCountry: { code: country.id, name: country.name, alpha2: country.alpha2 } });
    setHomeCountrySearch('');
    setHomeCountryOpen(false);
  };

  const handleClearHomeCountry = async () => {
    await updateProfile({ homeCountry: null });
  };

  // ── Avatar ───────────────────────────────────────────────────────────────────
  const AvatarDisplay = ({ size = 72 }) => (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {profile?.photoURL ? (
        <img src={profile.photoURL} alt="Profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${T.border}` }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: '50%', background: `${T.border}40`, border: `2px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IcoUser size={size * 0.45} color={T.text3} />
        </div>
      )}
      <button
        onClick={() => photoFileRef.current?.click()}
        disabled={photoUploading}
        style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: T.purple, borderRadius: '50%', border: `2px solid ${T.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: photoUploading ? 0.6 : 1 }}
      >
        {photoUploading
          ? <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          : <IcoCamera size={12} color="#fff" />}
      </button>
      <input ref={photoFileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, background: T.bg, minHeight: '100vh' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
        <div>
          <p style={{ color: T.text3, fontSize: 11, margin: '0 0 2px', fontFamily: "'Crimson Text', Georgia, serif", fontStyle: 'italic', letterSpacing: '0.04em' }}>
            Welcome back
          </p>
          <h1 style={{ color: T.text, fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {displayName}
          </h1>
        </div>
        <Link to="/chat" style={{
          width: 42, height: 42, borderRadius: '50%',
          background: `${T.purple}15`,
          border: `2px dashed ${T.purple}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.purple,
        }}>
          <IcoChat size={18} color={T.purple} />
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <StatCard label="Visited"     value={stats.visited}    icon={<IcoCheck size={16} color={T.rose} />}  color={T.rose}   accentColor={statusColors.visited}    />
        <StatCard label="Bucket List" value={stats.bucketList} icon={<IcoStar  size={16} color={T.navy} />}  color={T.navy}   accentColor={statusColors.bucketList} />
        <StatCard label="Traveling"   value={stats.current}    icon={<IcoPlane size={16} color={T.gold} />}  color={T.gold}   accentColor={statusColors.current}    />
      </div>

      {/* ══════════ PROFILE SECTION ══════════ */}
      <Card>
        <CardHeader
          title="Profile"
          action={editingProfile ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <ParchBtn variant="primary" onClick={handleSaveProfile} disabled={savingProfile}>
                <IcoCheck size={12} color="#fff" /> {savingProfile ? 'Saving…' : 'Save'}
              </ParchBtn>
              <ParchBtn variant="ghost" onClick={handleCancelProfile}>
                <IcoX size={12} color={T.text3} /> Cancel
              </ParchBtn>
            </div>
          ) : (
            <ParchBtn variant="ghost" onClick={() => setEditingProfile(true)}>
              <IcoEdit size={12} color={T.text3} /> Edit
            </ParchBtn>
          )}
        />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <AvatarDisplay size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingProfile ? (
                <input type="text" value={form.displayName}
                  onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="Display name"
                  style={{ ...sheetInput, width: '100%', marginBottom: 4 }}
                />
              ) : (
                <p style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0, fontFamily: "'Playfair Display', Georgia, serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.displayName || user?.email?.split('@')[0] || 'Traveler'}</p>
              )}
              <p style={{ color: T.text3, fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>

          {/* Bio */}
          {editingProfile ? (
            <div>
              <label style={sheetLabel}>Bio</label>
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Write something about yourself as a traveler…" rows={3}
                style={{ ...sheetInput, resize: 'none', width: '100%' }} />
            </div>
          ) : profile?.bio ? (
            <p style={{ color: T.text2, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{profile.bio}</p>
          ) : (
            <p style={{ color: T.text3, fontSize: 13, fontStyle: 'italic', margin: 0 }}>No bio yet — tap Edit to add one.</p>
          )}

          {/* Birthday (edit only) */}
          {editingProfile && (
            <div style={{ paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
              <label style={sheetLabel}>Birthday</label>
              <input type="date" value={form.birthday} onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
                style={sheetInput} />
            </div>
          )}

          {/* Birthday display */}
          {!editingProfile && profile?.birthday && (
            <p style={{ color: T.text3, fontSize: 11, margin: 0 }}>🎂 {profile.birthday}</p>
          )}
        </div>
      </Card>

      {/* ══════════ HOME COUNTRY SECTION ══════════ */}
      <Card noOverflow>
        <CardHeader
          icon={<IcoHome size={18} />}
          title="Home Country"
          subtitle="Highlighted on your globe"
        />
        <div style={{ padding: '14px 16px' }}>
          {profile?.homeCountry ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FlagImg alpha2={profile.homeCountry.alpha2} size={26} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: profile?.homeCountryColor || DEFAULT_HOME_COLOR, margin: 0 }}>
                  {profile.homeCountry.name}
                </p>
                <p style={{ color: T.text3, fontSize: 11, margin: '2px 0 0' }}>Highlighted on your map</p>
              </div>
              <button onClick={handleClearHomeCountry} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <IcoX size={16} color={T.text3} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search your home country…"
                value={homeCountrySearch}
                onChange={e => { setHomeCountrySearch(e.target.value); setHomeCountryOpen(true); }}
                onFocus={() => setHomeCountryOpen(true)}
                style={sheetInput}
              />
              {homeCountryOpen && homeCountryResults.length > 0 && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', zIndex: 50, boxShadow: '0 4px 16px rgba(44,26,14,0.12)' }}>
                  {homeCountryResults.map(c => (
                    <button key={c.id} onClick={() => handleSelectHomeCountry(c)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', color: T.text, fontSize: 13 }}>
                      <FlagImg alpha2={c.alpha2} size={18} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ══════════ TRAVEL GROUPS SECTION ══════════ */}
      <Card>
        <CardHeader
          icon={<IcoGroups size={18} />}
          title="Travel Partners"
          subtitle="Groups of people you travel with"
          action={
            <ParchBtn variant="primary" onClick={() => { setAddingGroup(true); setNewGroupName(''); setNewGroupEmoji('👥'); }}>
              <IcoPlus size={12} color="#fff" /> New Group
            </ParchBtn>
          }
        />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Add group form */}
          {addingGroup && (
            <div style={{ background: `${T.border}25`, border: `1.5px dashed ${T.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" placeholder="👥" value={newGroupEmoji} onChange={e => setNewGroupEmoji(e.target.value)}
                  style={{ ...sheetInput, width: 52, textAlign: 'center' }} />
                <input type="text" placeholder="Group name (e.g. Family, College Friends…)" value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                  autoFocus style={{ ...sheetInput, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setAddingGroup(false)} style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, color: T.text3, background: 'none', border: `1.5px solid ${T.border}`, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleAddGroup} disabled={!newGroupName.trim()} style={{ flex: 2, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: T.purple, color: '#fff', border: 'none', cursor: 'pointer', opacity: !newGroupName.trim() ? 0.5 : 1 }}>
                  Create Group
                </button>
              </div>
            </div>
          )}

          {savedGroups.length === 0 && !addingGroup && (
            <p style={{ color: T.text3, fontSize: 13, fontStyle: 'italic' }}>No groups yet — tap "New Group" to create one.</p>
          )}

          {savedGroups.map(group => (
            <div key={group.id} style={{ background: `${T.border}20`, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: 0 }}>{group.emoji} {group.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => { setAddingMemberTo(group.id); setNewMemberName(''); }}
                    style={{ fontSize: 11, color: T.purple, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <IcoPlus size={10} color={T.purple} /> Add
                  </button>
                  <button onClick={() => handleDeleteGroup(group.id)} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <IcoTrash size={13} color={T.text3} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {group.members.map(name => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.card, border: `1px solid ${T.border}`, color: T.text2, fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>
                    <span>{name}</span>
                    <button onClick={() => handleRemoveMember(group.id, name)} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                      <IcoX size={9} color={T.text3} />
                    </button>
                  </div>
                ))}
                {group.members.length === 0 && (
                  <span style={{ color: T.text3, fontSize: 11, fontStyle: 'italic' }}>No members yet</span>
                )}
              </div>

              {addingMemberTo === group.id && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                  <input type="text" placeholder="Person's name…" value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddMember(group.id)}
                    autoFocus style={{ ...sheetInput, flex: 1 }} />
                  <button onClick={() => { setAddingMemberTo(null); setNewMemberName(''); }}
                    style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, color: T.text3, background: 'none', border: `1.5px solid ${T.border}`, cursor: 'pointer' }}>✕</button>
                  <button onClick={() => handleAddMember(group.id)} disabled={!newMemberName.trim()}
                    style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: T.purple, color: '#fff', border: 'none', cursor: 'pointer', opacity: !newMemberName.trim() ? 0.5 : 1 }}>
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ══════════ MAP COLOURS SECTION ══════════ */}
      <Card>
        <CardHeader
          icon={<IcoPalette size={18} />}
          title="Map Colours"
          subtitle="Customise status + home country colours"
          action={colorsSavedMsg ? <span style={{ color: '#5a8a5a', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><IcoCheck size={11} color="#5a8a5a" /> Saved</span> : null}
        />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(44,26,14,0.15)', background: customColors[key] }} />
              <span style={{ color: T.text2, fontSize: 13, flex: 1 }}>{label}</span>
              <input type="color" value={customColors[key] || '#ffffff'}
                onChange={e => setCustomColors(c => ({ ...c, [key]: e.target.value }))}
                style={{ width: 34, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none', background: 'transparent' }}
                title={`Change ${label} colour`} />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(44,26,14,0.15)', background: customColors.homeCountry }} />
            <span style={{ color: T.text2, fontSize: 13, flex: 1 }}>Home Country</span>
            <input type="color" value={customColors.homeCountry || DEFAULT_HOME_COLOR}
              onChange={e => setCustomColors(c => ({ ...c, homeCountry: e.target.value }))}
              style={{ width: 34, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none', background: 'transparent' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
            <button onClick={handleResetColors} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.text3, background: 'none', border: 'none', cursor: 'pointer' }}>
              <IcoRefresh size={12} color={T.text3} /> Reset defaults
            </button>
            <ParchBtn variant="primary" onClick={handleSaveColors} disabled={savingColors}>
              {savingColors ? 'Saving…' : 'Save Colours'}
            </ParchBtn>
          </div>
        </div>
      </Card>

      {/* ══════════ EXPLORE SECTION ══════════ */}
      <div>
        <p style={{ color: T.text3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px', fontFamily: "'Crimson Text', Georgia, serif" }}>
          Explore
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NavCard to="/map"   icon={<IcoGlobe  color={T.navy}   size={28} />} label="World Map"    desc="Explore your globe"  color={T.navy}   />
          <NavCard to="/diary" icon={<IcoDiary  color={T.purple} size={28} />} label="Travel Diary" desc="Your memories"       color={T.purple} />
          <NavCard to="/stats" icon={<IcoStats  color={T.rose}   size={28} />} label="Statistics"   desc="Your travel story"   color={T.rose}   />
          <NavCard to="/chat"  icon={<IcoQuill  color={T.gold}   size={28} />} label="AI Assistant" desc="Plan & budget trips"  color={T.gold}   />
        </div>
      </div>

      {/* Sign out */}
      <button onClick={() => signOut(auth)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'none', border: `1.5px solid ${T.border}`, borderRadius: 14,
        color: T.text3, fontSize: 13, padding: '12px', cursor: 'pointer',
        fontFamily: "'Crimson Text', Georgia, serif",
      }}>
        <IcoLogOut size={14} color={T.text3} /> Sign Out
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, accentColor }) {
  return (
    <div style={{
      background: T.card,
      border: `2px dashed ${color}70`,
      borderRadius: 14, padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{ color, display: 'flex', justifyContent: 'center', marginBottom: 5 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: T.text3, marginTop: 3, lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}

function Card({ children, noOverflow }) {
  return (
    <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: noOverflow ? 'visible' : 'hidden' }}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, icon, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ display: 'flex', alignItems: 'center', color: T.text3 }}>{icon}</span>}
        <div>
          <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</p>
          {subtitle && <p style={{ color: T.text3, fontSize: 10, margin: '1px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function ParchBtn({ children, onClick, variant = 'ghost', disabled }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 600,
        padding: '5px 10px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        background: isPrimary ? `${T.purple}18` : 'none',
        color: isPrimary ? T.purple : T.text3,
        border: `1.5px solid ${isPrimary ? T.purple + '50' : T.border}`,
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s',
        fontFamily: "'Crimson Text', Georgia, serif",
      }}
    >
      {children}
    </button>
  );
}

function NavCard({ to, icon, label, desc, color }) {
  return (
    <Link to={to} style={{
      background: T.card,
      border: `2px dashed ${color}50`,
      borderRadius: 14, padding: 14,
      display: 'flex', flexDirection: 'column', gap: 8,
      textDecoration: 'none',
    }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      <div>
        <div style={{ color: T.text, fontWeight: 700, fontSize: 13, fontFamily: "'Playfair Display', Georgia, serif" }}>{label}</div>
        <div style={{ color: T.text3, fontSize: 11, marginTop: 1 }}>{desc}</div>
      </div>
    </Link>
  );
}

// Shared input / label styles (used inline)
const sheetInput = {
  background: `${T.bg}`,
  border: `1.5px solid ${T.border}`,
  borderRadius: 10,
  padding: '9px 12px',
  color: T.text,
  fontSize: 13,
  outline: 'none',
  fontFamily: "'Crimson Text', Georgia, serif",
  boxSizing: 'border-box',
};

const sheetLabel = {
  display: 'block',
  fontSize: 10,
  color: T.text3,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 700,
  marginBottom: 6,
  fontFamily: "'Crimson Text', Georgia, serif",
};
