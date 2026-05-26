import { useState, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, X, Search, MapPin, Pencil } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo, getFlagEmoji, COUNTRY_NAMES } from '../data/countryNames';

const STATUS_LABELS = {
  visited:    'Visited',
  bucketList: 'Bucket List',
  current:    'Traveling',
};

export default function BucketList() {
  const navigate = useNavigate();
  const { countryStatuses, setCountryStatus, statusColors, updateCountryNote } = useTravel();

  const [showAdd, setShowAdd]       = useState(false);
  const [addSearch, setAddSearch]   = useState('');
  const [addCountry, setAddCountry] = useState(null);   // { id, name, alpha2 }
  const [addStatus, setAddStatus]   = useState('bucketList');

  // ── Dream Notes state ────────────────────────────────────────────────────────
  const [noteValues,  setNoteValues]  = useState({});   // code → local string
  const [noteSavedId, setNoteSavedId] = useState(null); // code that just saved
  const noteTimers = useRef({});
  const [expandedNotes, setExpandedNotes] = useState(new Set()); // codes with textarea open

  const toggleNote = useCallback((code) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }, []);

  const handleNoteChange = useCallback((code, val) => {
    setNoteValues(prev => ({ ...prev, [code]: val }));
    setNoteSavedId(null);
    if (noteTimers.current[code]) clearTimeout(noteTimers.current[code]);
    noteTimers.current[code] = setTimeout(async () => {
      await updateCountryNote(code, val);
      setNoteSavedId(code);
      setTimeout(() => setNoteSavedId(id => id === code ? null : id), 2000);
    }, 900);
  }, [updateCountryNote]);

  // ── Group all tracked countries by status ──────────────────────────────────
  const groups = useMemo(() => {
    const result = { visited: [], bucketList: [], current: [] };
    Object.entries(countryStatuses).forEach(([code, v]) => {
      if (result[v.status]) {
        const info = getCountryInfo(code);
        result[v.status].push({ code, ...info, note: v.note || '' });
      }
    });
    Object.values(result).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
    return result;
  }, [countryStatuses]);

  const totalTracked = Object.keys(countryStatuses).length;

  // ── Country search results inside Add sheet ────────────────────────────────
  const searchResults = useMemo(() => {
    if (!addSearch.trim() || addCountry) return [];
    const q = addSearch.toLowerCase();
    return Object.entries(COUNTRY_NAMES)
      .filter(([, v]) => v.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map(([id, v]) => ({ id, ...v }));
  }, [addSearch, addCountry]);

  const closeSheet = () => {
    setShowAdd(false);
    setAddSearch('');
    setAddCountry(null);
    setAddStatus('bucketList');
  };

  const handleSave = async () => {
    if (!addCountry) return;
    await setCountryStatus(addCountry.id, addStatus);
    closeSheet();
  };

  const handleRemove = async () => {
    if (!addCountry) return;
    await setCountryStatus(addCountry.id, null);
    closeSheet();
  };

  const openEditFor = (country, currentSt) => {
    setAddCountry(country);
    setAddSearch(country.name);
    setAddStatus(currentSt);
    setShowAdd(true);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-8">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">My Travel List</h1>
          <p className="text-slate-400 text-xs">{totalTracked} countr{totalTracked === 1 ? 'y' : 'ies'} tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-xl hover:border-slate-500 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" /> Map
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs bg-violet-500 hover:bg-violet-400 text-white font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* ── Summary tiles ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'visited',    emoji: '✅', label: 'Visited' },
            { key: 'bucketList', emoji: '⭐', label: 'Bucket List' },
            { key: 'current',    emoji: '✈️',  label: 'Traveling' },
          ].map(({ key, emoji, label }) => (
            <div
              key={key}
              className="rounded-2xl p-3 border text-center"
              style={{ background: statusColors[key] + '12', borderColor: statusColors[key] + '40' }}
            >
              <div className="text-xl mb-1">{emoji}</div>
              <div className="text-2xl font-bold text-white leading-none">{groups[key].length}</div>
              <div className="text-[11px] mt-1 font-medium" style={{ color: statusColors[key] }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Traveling ──────────────────────────────────────────────────────────── */}
        {groups.current.length > 0 && (
          <Section title="Traveling" color={statusColors.current} count={groups.current.length}>
            {groups.current.map(({ code, name, alpha2 }) => (
              <CountryRow
                key={code}
                code={code} name={name} alpha2={alpha2}
                currentStatus="current"
                statusColors={statusColors}
                onEdit={() => openEditFor({ id: code, name, alpha2 }, 'current')}
                onRemove={() => setCountryStatus(code, null)}
              />
            ))}
          </Section>
        )}

        {/* ── Bucket List (with Dream Notes) ─────────────────────────────────────── */}
        <Section
          title="Bucket List"
          color={statusColors.bucketList}
          count={groups.bucketList.length}
          emptyText="No countries yet — tap Add or mark countries on the Map."
        >
          {groups.bucketList.map(({ code, name, alpha2, note }) => {
            const localVal     = noteValues[code] !== undefined ? noteValues[code] : note;
            const hasNote      = !!localVal.trim();
            const isExpanded   = expandedNotes.has(code);
            const saved        = noteSavedId === code;
            const color        = statusColors.bucketList;
            return (
              <div
                key={code}
                className="rounded-2xl border px-4 py-3"
                style={{ background: color + '10', borderColor: color + '30' }}
              >
                {/* Country header row */}
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{getFlagEmoji(alpha2)}</span>
                  <button
                    className="flex-1 text-white text-sm font-medium text-left hover:text-violet-400 transition-colors truncate"
                    onClick={() => navigate(`/country/${code}`, { state: { name, alpha2 } })}
                  >
                    {name}
                  </button>
                  {saved && (
                    <span className="text-[11px] text-green-400 font-medium flex-shrink-0">✓ Saved</span>
                  )}
                  <button
                    onClick={() => openEditFor({ id: code, name, alpha2 }, 'bucketList')}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors flex-shrink-0"
                    title="Change status"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCountryStatus(code, null)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Dream note — shown when expanded */}
                {isExpanded ? (
                  <div className="mt-3">
                    <textarea
                      autoFocus={!hasNote}
                      placeholder={`Why visit ${name}? What to see, eat, do…`}
                      value={localVal}
                      onChange={e => handleNoteChange(code, e.target.value)}
                      rows={localVal ? Math.min(Math.max(localVal.split('\n').length, 2), 6) : 2}
                      className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm leading-relaxed resize-none focus:outline-none focus:border-yellow-500/50 placeholder-slate-600 transition-colors"
                    />
                    <button
                      onClick={() => toggleNote(code)}
                      className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <span className="text-sm leading-none">↑</span>
                      Hide note
                    </button>
                  </div>
                ) : hasNote ? (
                  <button
                    onClick={() => toggleNote(code)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-yellow-400 transition-colors"
                  >
                    <span className="text-sm leading-none">📖</span>
                    Show Dream Note
                  </button>
                ) : (
                  <button
                    onClick={() => toggleNote(code)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-yellow-400 transition-colors"
                  >
                    <span className="text-sm leading-none">✨</span>
                    Add Dream Note
                  </button>
                )}
              </div>
            );
          })}
        </Section>

        {/* ── Visited ──────────────────────────────────────────────────────────── */}
        {groups.visited.length > 0 && (
          <Section title="Visited" color={statusColors.visited} count={groups.visited.length}>
            <div className="grid grid-cols-2 gap-2">
              {groups.visited.map(({ code, name, alpha2 }) => (
                <div
                  key={code}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
                  style={{ background: statusColors.visited + '10', borderColor: statusColors.visited + '30' }}
                >
                  <Link
                    to={`/country/${code}`}
                    state={{ name, alpha2 }}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <span className="text-lg flex-shrink-0">{getFlagEmoji(alpha2)}</span>
                    <span className="text-white text-xs font-medium truncate">{name}</span>
                  </Link>
                  <button
                    onClick={() => openEditFor({ id: code, name, alpha2 }, 'visited')}
                    className="text-slate-600 hover:text-violet-400 transition-colors flex-shrink-0 ml-1"
                    title="Edit status"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Truly empty state ─────────────────────────────────────────────────── */}
        {totalTracked === 0 && (
          <div className="text-center pt-8">
            <p className="text-5xl mb-3">🗺️</p>
            <p className="text-white font-semibold mb-1">No countries tracked yet</p>
            <p className="text-slate-400 text-sm mb-5">
              Tap <strong className="text-violet-400">Add</strong> above to get started, or mark countries directly on the Map.
            </p>
            <button
              onClick={() => navigate('/map')}
              className="bg-violet-500 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-violet-400 transition-colors"
            >
              Open Map
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Add / Edit Country Bottom Sheet
      ═══════════════════════════════════════════════════════════════════════ */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', pointerEvents: 'all' }}
            onClick={closeSheet}
          />

          {/* Sheet */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '430px',
            background: '#1e293b',
            borderTop: '1px solid #334155',
            borderRadius: '20px 20px 0 0',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            pointerEvents: 'all',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#475569' }} />
            </div>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 14px' }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>
                {addCountry && countryStatuses[addCountry.id] ? 'Edit Country Status' : 'Add Country'}
              </p>
              <button onClick={closeSheet} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Country search */}
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: 16, height: 16, pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search for a country…"
                  value={addSearch}
                  onChange={e => { setAddSearch(e.target.value); setAddCountry(null); }}
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#0f172a', border: '1px solid #334155',
                    borderRadius: 12, padding: '11px 14px 11px 38px',
                    color: '#e2e8f0', fontSize: 14, outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>

              {/* Dropdown results */}
              {searchResults.length > 0 && (
                <div style={{
                  background: '#0f172a', border: '1px solid #334155',
                  borderRadius: 12, overflow: 'hidden',
                  maxHeight: 220, overflowY: 'auto',
                }}>
                  {searchResults.map(c => {
                    const existing = countryStatuses[c.id]?.status;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setAddCountry(c);
                          setAddSearch(c.name);
                          if (existing) setAddStatus(existing);
                        }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', background: 'none', border: 'none',
                          borderBottom: '1px solid #1e293b', cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{getFlagEmoji(c.alpha2)}</span>
                        <span style={{ color: '#e2e8f0', fontSize: 14, flex: 1 }}>{c.name}</span>
                        {existing && (
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 99, flexShrink: 0,
                            background: statusColors[existing] + '25', color: statusColors[existing], fontWeight: 600,
                          }}>
                            {STATUS_LABELS[existing]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected country chip */}
              {addCountry && (
                <div style={{
                  background: '#0f172a', border: '1px solid #334155',
                  borderRadius: 12, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{getFlagEmoji(addCountry.alpha2)}</span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 14, flex: 1 }}>{addCountry.name}</span>
                  <button
                    onClick={() => { setAddCountry(null); setAddSearch(''); }}
                    style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Status picker */}
              <div>
                <p style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, margin: '0 0 8px' }}>
                  Set Status
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => {
                    const active = addStatus === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setAddStatus(key)}
                        style={{
                          padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                          border: active ? `2px solid ${statusColors[key]}` : '2px solid #334155',
                          background: active ? statusColors[key] + '20' : '#0f172a',
                          color: active ? statusColors[key] : '#64748b',
                          fontSize: 12, fontWeight: active ? 700 : 500,
                          display: 'flex', alignItems: 'center', gap: 7,
                          transition: 'all 0.12s',
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[key], flexShrink: 0 }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                {addCountry && countryStatuses[addCountry.id] && (
                  <button
                    onClick={handleRemove}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12,
                      border: '1.5px dashed #475569', background: 'transparent',
                      color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 500,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!addCountry}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                    background: addCountry ? '#8b5cf6' : '#1e293b',
                    color: addCountry ? '#fff' : '#475569',
                    fontSize: 14, fontWeight: 700,
                    cursor: addCountry ? 'pointer' : 'not-allowed',
                    transition: 'background 0.12s',
                  }}
                >
                  {addCountry && countryStatuses[addCountry.id] ? 'Update Status' : 'Add to List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Country row for Traveling ────────────────────────────────────────────────
function CountryRow({ code, name, alpha2, currentStatus, statusColors, onEdit, onRemove }) {
  const navigate = useNavigate();
  const color = statusColors[currentStatus];

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-4 py-3"
      style={{ background: color + '10', borderColor: color + '30' }}
    >
      <span className="text-xl flex-shrink-0">{getFlagEmoji(alpha2)}</span>
      <button
        className="flex-1 text-white text-sm font-medium text-left hover:text-violet-400 transition-colors truncate"
        onClick={() => navigate(`/country/${code}`, { state: { name, alpha2 } })}
      >
        {name}
      </button>
      <button
        onClick={onEdit}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors flex-shrink-0"
        title="Change status"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onRemove}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
        title="Remove"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, color, count, emptyText, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: color + '25', color }}
        >
          {count}
        </span>
      </div>
      {count === 0 && emptyText ? (
        <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-slate-500 text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}
