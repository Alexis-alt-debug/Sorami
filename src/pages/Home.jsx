import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe, BookOpen, BarChart2, MessageCircle,
  Star, CheckCircle, Plane,
  Camera, Edit2, Check, X, Palette, RotateCcw, User, Users, Plus, Trash2, LogOut, Home as HomeIcon, ChevronDown,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useTravel, DEFAULT_STATUS_COLORS } from '../context/TravelContext';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_NAMES, getFlagEmoji } from '../data/countryNames';

const STATUS_LABELS = {
  visited:    'Visited',
  bucketList: 'Bucket List',
  current:    'Traveling',
};

const DEFAULT_HOME_COLOR = '#ff6b6b';

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

  // Adding a new group
  const [addingGroup,    setAddingGroup]    = useState(false);
  const [newGroupName,   setNewGroupName]   = useState('');
  const [newGroupEmoji,  setNewGroupEmoji]  = useState('👥');
  // Adding a member to a specific group
  const [addingMemberTo, setAddingMemberTo] = useState(null); // groupId
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

  // Populate form + colors when profile loads
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
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {profile?.photoURL ? (
        <img src={profile.photoURL} alt="Profile" className="rounded-full object-cover border-2 border-slate-700" style={{ width: size, height: size }} />
      ) : (
        <div className="rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center" style={{ width: size, height: size }}>
          <User className="text-slate-500" style={{ width: size * 0.45, height: size * 0.45 }} />
        </div>
      )}
      <button
        onClick={() => photoFileRef.current?.click()}
        disabled={photoUploading}
        className="absolute bottom-0 right-0 w-7 h-7 bg-violet-500 hover:bg-violet-400 rounded-full flex items-center justify-center border-2 border-slate-900 transition-colors disabled:opacity-60"
      >
        {photoUploading
          ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
          : <Camera className="w-3.5 h-3.5 text-white" />}
      </button>
      <input ref={photoFileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between pt-3">
        <div>
          <p className="text-slate-400 text-xs mb-0.5">Welcome back</p>
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
        </div>
        <Link to="/chat" className="w-11 h-11 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center hover:bg-violet-500/30 transition-colors">
          <MessageCircle className="w-5 h-5 text-violet-400" />
        </Link>
      </div>

      {/* Stats — use the user's custom status colours */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Visited"     value={stats.visited}    icon={<CheckCircle className="w-4 h-4" />} color={statusColors.visited}    />
        <StatCard label="Bucket List" value={stats.bucketList} icon={<Star className="w-4 h-4" />}        color={statusColors.bucketList} />
        <StatCard label="Traveling"   value={stats.current}    icon={<Plane className="w-4 h-4" />}       color={statusColors.current}   />
      </div>

      {/* ══════════ PROFILE SECTION ══════════ */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700/60">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Profile</p>
          {editingProfile ? (
            <div className="flex gap-2">
              <button onClick={handleSaveProfile} disabled={savingProfile}
                className="flex items-center gap-1.5 text-xs bg-violet-500/20 text-violet-400 border border-violet-500/40 px-3 py-1.5 rounded-xl hover:bg-violet-500/30 disabled:opacity-50 transition-colors">
                <Check className="w-3.5 h-3.5" /> {savingProfile ? 'Saving…' : 'Save'}
              </button>
              <button onClick={handleCancelProfile}
                className="flex items-center gap-1.5 text-xs text-slate-400 border border-slate-600 px-3 py-1.5 rounded-xl hover:border-slate-500 transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-600 px-3 py-1.5 rounded-xl hover:border-slate-500 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <AvatarDisplay size={68} />
            <div className="flex-1 min-w-0">
              {editingProfile ? (
                <input type="text" value={form.displayName}
                  onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="Display name"
                  className="w-full text-white font-bold text-base bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500 mb-1"
                />
              ) : (
                <p className="text-white font-bold text-base truncate">{profile?.displayName || user?.email?.split('@')[0] || 'Traveler'}</p>
              )}
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>

          {/* Bio */}
          {editingProfile ? (
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Bio</label>
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Write something about yourself as a traveler…" rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none" />
            </div>
          ) : profile?.bio ? (
            <p className="text-slate-300 text-sm leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-slate-600 text-sm italic">No bio yet — tap Edit to add one.</p>
          )}

          {/* Birthday (edit only) */}
          {editingProfile && (
            <div className="pt-1 border-t border-slate-700/60">
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Birthday</label>
              <input type="date" value={form.birthday} onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
                className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
            </div>
          )}

          {/* Birthday display */}
          {!editingProfile && profile?.birthday && (
            <p className="text-slate-500 text-xs">🎂 {profile.birthday}</p>
          )}
        </div>
      </div>

      {/* ══════════ HOME COUNTRY SECTION ══════════ */}
      {/* No overflow-hidden here — the search dropdown must be able to overflow the card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl">
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-slate-700/60">
          <div className="w-7 h-7 bg-rose-500/15 border border-rose-500/30 rounded-lg flex items-center justify-center">
            <HomeIcon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Home Country</p>
            <p className="text-slate-500 text-[11px]">Highlighted on your globe</p>
          </div>
        </div>

        <div className="p-4">
          {profile?.homeCountry ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getFlagEmoji(profile.homeCountry.alpha2)}</span>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: profile?.homeCountryColor || DEFAULT_HOME_COLOR }}>
                  {profile.homeCountry.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/10 flex-shrink-0"
                    style={{ background: profile?.homeCountryColor || DEFAULT_HOME_COLOR }}
                  />
                  <p className="text-slate-500 text-xs">Highlighted on your map</p>
                </div>
              </div>
              <button onClick={handleClearHomeCountry}
                className="text-slate-500 hover:text-red-400 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Search your home country…"
                value={homeCountrySearch}
                onChange={e => { setHomeCountrySearch(e.target.value); setHomeCountryOpen(true); }}
                onFocus={() => setHomeCountryOpen(true)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              {homeCountryOpen && homeCountryResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-50">
                  {homeCountryResults.map(c => (
                    <button key={c.id} onClick={() => handleSelectHomeCountry(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0">
                      <span className="text-xl">{getFlagEmoji(c.alpha2)}</span>
                      <span className="text-white text-sm">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ TRAVEL GROUPS SECTION ══════════ */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-violet-500/15 border border-violet-500/30 rounded-lg flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Travel Partners</p>
              <p className="text-slate-500 text-[11px]">Groups of people you travel with</p>
            </div>
          </div>
          <button
            onClick={() => { setAddingGroup(true); setNewGroupName(''); setNewGroupEmoji('👥'); }}
            className="flex items-center gap-1 text-xs text-violet-400 border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 rounded-xl hover:bg-violet-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Group
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Add group form */}
          {addingGroup && (
            <div className="bg-slate-700/40 border border-slate-600/60 rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Group emoji (e.g. 👨‍👩‍👧)"
                  value={newGroupEmoji}
                  onChange={e => setNewGroupEmoji(e.target.value)}
                  className="w-20 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 text-center"
                />
                <input
                  type="text"
                  placeholder="Group name (e.g. Family, College Friends…)"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                  autoFocus
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddingGroup(false)}
                  className="flex-1 py-2 rounded-xl text-xs text-slate-400 border border-slate-600 hover:border-slate-500 transition-colors">
                  Cancel
                </button>
                <button onClick={handleAddGroup} disabled={!newGroupName.trim()}
                  className="flex-[2] py-2 rounded-xl text-xs font-bold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Create Group
                </button>
              </div>
            </div>
          )}

          {/* Groups list */}
          {savedGroups.length === 0 && !addingGroup && (
            <p className="text-slate-600 text-sm italic">No groups yet — tap "New Group" to create one.</p>
          )}

          {savedGroups.map(group => (
            <div key={group.id} className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-3">
              {/* Group header */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-semibold">
                  {group.emoji} {group.name}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setAddingMemberTo(group.id); setNewMemberName(''); }}
                    className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                  <button onClick={() => handleDeleteGroup(group.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="flex flex-wrap gap-1.5">
                {group.members.map(name => (
                  <div key={name} className="flex items-center gap-1.5 bg-slate-700 border border-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-full">
                    <span>{name}</span>
                    <button onClick={() => handleRemoveMember(group.id, name)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {group.members.length === 0 && (
                  <span className="text-slate-600 text-xs italic">No members yet</span>
                )}
              </div>

              {/* Add member form */}
              {addingMemberTo === group.id && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-600/40">
                  <input
                    type="text"
                    placeholder="Person's name…"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddMember(group.id)}
                    autoFocus
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button onClick={() => { setAddingMemberTo(null); setNewMemberName(''); }}
                    className="px-3 py-2 rounded-lg text-xs text-slate-400 border border-slate-600 hover:border-slate-500 transition-colors">
                    ✕
                  </button>
                  <button onClick={() => handleAddMember(group.id)} disabled={!newMemberName.trim()}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 transition-colors">
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ MAP COLOURS SECTION ══════════ */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-slate-700/60">
          <div className="w-7 h-7 bg-violet-500/15 border border-violet-500/30 rounded-lg flex items-center justify-center">
            <Palette className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold leading-tight">Map Colours</p>
            <p className="text-slate-500 text-[11px]">Customise status + home country colours</p>
          </div>
          {colorsSavedMsg && (
            <span className="text-green-400 text-xs font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Status colours */}
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10" style={{ background: customColors[key] }} />
              <span className="text-slate-200 text-sm flex-1">{label}</span>
              <span className="text-slate-500 text-xs font-mono">{customColors[key]}</span>
              <input type="color" value={customColors[key] || '#ffffff'}
                onChange={e => setCustomColors(c => ({ ...c, [key]: e.target.value }))}
                className="w-9 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                title={`Change ${label} colour`} />
            </div>
          ))}

          {/* Home country colour */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
            <span className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10" style={{ background: customColors.homeCountry }} />
            <span className="text-slate-200 text-sm flex-1">Home Country</span>
            <span className="text-slate-500 text-xs font-mono">{customColors.homeCountry}</span>
            <input type="color" value={customColors.homeCountry || DEFAULT_HOME_COLOR}
              onChange={e => setCustomColors(c => ({ ...c, homeCountry: e.target.value }))}
              className="w-9 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              title="Change home country highlight colour" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
            <button onClick={handleResetColors}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset defaults
            </button>
            <button onClick={handleSaveColors} disabled={savingColors}
              className="flex items-center gap-1.5 text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-xl hover:bg-violet-500/30 disabled:opacity-50 transition-colors font-medium">
              {savingColors ? 'Saving…' : 'Save Colours'}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════ EXPLORE SECTION ══════════ */}
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Explore</p>
        <div className="grid grid-cols-2 gap-3">
          <NavCard to="/map"   icon={<Globe className="w-7 h-7" />}          label="World Map"    desc="Explore your globe"  gradient="from-violet-500/20 to-purple-700/20"    border="border-violet-500/25"    iconColor="text-violet-400" />
          <NavCard to="/diary" icon={<BookOpen className="w-7 h-7" />}       label="Travel Diary" desc="Your memories"       gradient="from-violet-500/20 to-purple-600/20" border="border-violet-500/25"  iconColor="text-violet-400" />
          <NavCard to="/stats" icon={<BarChart2 className="w-7 h-7" />}      label="Statistics"   desc="Your travel story"   gradient="from-pink-500/20 to-rose-600/20"    border="border-pink-500/25"    iconColor="text-pink-400" />
          <NavCard to="/chat"  icon={<MessageCircle className="w-7 h-7" />}  label="AI Assistant" desc="Plan & budget trips"  gradient="from-emerald-500/20 to-teal-600/20" border="border-emerald-500/25"  iconColor="text-emerald-400" />
        </div>
      </div>

      {/* Tip banner */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4">
        <p className="text-violet-300 text-sm font-semibold mb-1">Get started</p>
        <p className="text-slate-400 text-xs leading-relaxed">
          Open the Map and tap any country to mark it as visited, add it to your bucket list, or write a travel memory.
        </p>
      </div>

      {/* Sign out */}
      <button onClick={() => signOut(auth)}
        className="w-full flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700 hover:border-red-500/40 hover:text-red-400 text-slate-500 py-3 rounded-2xl text-sm transition-colors">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div
      className="border rounded-2xl p-3 text-center"
      style={{ background: color + '1a', borderColor: color + '33' }}
    >
      <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-slate-400 leading-tight">{label}</div>
    </div>
  );
}

function NavCard({ to, icon, label, desc, gradient, border, iconColor }) {
  return (
    <Link to={to} className={`bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-4 flex flex-col gap-2.5 active:scale-95 transition-transform`}>
      <div className={iconColor}>{icon}</div>
      <div>
        <div className="text-white font-semibold text-sm">{label}</div>
        <div className="text-slate-400 text-xs">{desc}</div>
      </div>
    </Link>
  );
}
