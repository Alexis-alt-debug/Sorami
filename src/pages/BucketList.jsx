import { useState, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IcoPlus, IcoX, IcoSearch, IcoMapPin, IcoPencil, IcoCheck, IcoStar, IcoPlane, IcoBook } from '../components/VintageIcons';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo, COUNTRY_NAMES } from '../data/countryNames';
import FlagImg from '../components/FlagImg';

const STATUS_LABELS = {
  visited:    'Visited',
  bucketList: 'Bucket List',
  current:    'Traveling',
};

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

export default function BucketList() {
  const navigate = useNavigate();
  const { countryStatuses, setCountryStatus, statusColors, updateCountryNote } = useTravel();

  const [showAdd, setShowAdd]       = useState(false);
  const [addSearch, setAddSearch]   = useState('');
  const [addCountry, setAddCountry] = useState(null);
  const [addStatus, setAddStatus]   = useState('bucketList');

  // ── Dream Notes state ────────────────────────────────────────────────────────
  const [noteValues,  setNoteValues]  = useState({});
  const [noteSavedId, setNoteSavedId] = useState(null);
  const noteTimers = useRef({});
  const [expandedNotes, setExpandedNotes] = useState(new Set());

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
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: T.card, borderBottom: `2px solid ${T.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>
        <div>
          <h1 style={{ color: T.text, fontWeight: 700, fontSize: 18, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
            My Travel List
          </h1>
          <p style={{ color: T.text3, fontSize: 11, margin: '2px 0 0' }}>{totalTracked} countr{totalTracked === 1 ? 'y' : 'ies'} tracked</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/map')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, background: 'none', border: `1.5px solid ${T.border}`, color: T.text2, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
          >
            <IcoMapPin size={13} color={T.text2} /> Map
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, background: T.purple, border: 'none', color: '#fff', fontWeight: 600, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
          >
            <IcoPlus size={13} color="#fff" /> Add
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── Summary tiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { key: 'visited',    icon: <IcoCheck size={18} color={T.rose} />, label: 'Visited',     color: T.rose  },
            { key: 'bucketList', icon: <IcoStar  size={18} color={T.navy} />, label: 'Bucket List', color: T.navy  },
            { key: 'current',    icon: <IcoPlane size={18} color={T.gold} />, label: 'Traveling',   color: T.gold  },
          ].map(({ key, icon, label, color }) => (
            <div key={key} style={{ background: T.card, border: `2px dashed ${color}60`, borderRadius: 14, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1 }}>{groups[key].length}</div>
              <div style={{ fontSize: 10, marginTop: 3, fontWeight: 600, color }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Traveling ── */}
        {groups.current.length > 0 && (
          <Section title="Traveling" color={T.gold} count={groups.current.length}>
            {groups.current.map(({ code, name, alpha2 }) => (
              <CountryRow
                key={code}
                code={code} name={name} alpha2={alpha2}
                color={T.gold}
                onEdit={() => openEditFor({ id: code, name, alpha2 }, 'current')}
                onRemove={() => setCountryStatus(code, null)}
              />
            ))}
          </Section>
        )}

        {/* ── Bucket List (with Dream Notes) ── */}
        <Section
          title="Bucket List"
          color={T.navy}
          count={groups.bucketList.length}
          emptyText="No countries yet — tap Add or mark countries on the Map."
        >
          {groups.bucketList.map(({ code, name, alpha2, note }) => {
            const localVal   = noteValues[code] !== undefined ? noteValues[code] : note;
            const hasNote    = !!localVal.trim();
            const isExpanded = expandedNotes.has(code);
            const saved      = noteSavedId === code;
            return (
              <div key={code} style={{ background: T.card, border: `1.5px solid ${T.navy}35`, borderRadius: 14, padding: '12px 14px' }}>
                {/* Country header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FlagImg alpha2={alpha2} size={18} />
                  <button
                    style={{ flex: 1, color: T.text, fontSize: 13, fontWeight: 600, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Playfair Display', Georgia, serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onClick={() => navigate(`/country/${code}`, { state: { name, alpha2 } })}
                  >
                    {name}
                  </button>
                  {saved && (
                    <span style={{ fontSize: 10, color: '#5a8a5a', fontWeight: 600, flexShrink: 0 }}>✓ Saved</span>
                  )}
                  <button
                    onClick={() => openEditFor({ id: code, name, alpha2 }, 'bucketList')}
                    style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                    title="Change status"
                  >
                    <IcoPencil size={13} color={T.text3} />
                  </button>
                  <button
                    onClick={() => setCountryStatus(code, null)}
                    style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                    title="Remove"
                  >
                    <IcoX size={14} color={T.text3} />
                  </button>
                </div>

                {/* Dream note */}
                {isExpanded ? (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      autoFocus={!hasNote}
                      placeholder={`Why visit ${name}? What to see, eat, do…`}
                      value={localVal}
                      onChange={e => handleNoteChange(code, e.target.value)}
                      rows={localVal ? Math.min(Math.max(localVal.split('\n').length, 2), 6) : 2}
                      style={{
                        width: '100%', background: T.bg,
                        border: `1.5px solid ${T.gold}50`,
                        borderRadius: 10, padding: '9px 12px',
                        color: T.text2, fontSize: 13, lineHeight: 1.65,
                        resize: 'none', outline: 'none',
                        fontFamily: "'Crimson Text', Georgia, serif",
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => toggleNote(code)}
                      style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.text3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
                    >
                      <span style={{ fontSize: 13, lineHeight: 1 }}>↑</span>
                      Hide note
                    </button>
                  </div>
                ) : hasNote ? (
                  <button
                    onClick={() => toggleNote(code)}
                    style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
                  >
                    <IcoBook size={13} color={T.gold} />
                    Show Dream Note
                  </button>
                ) : (
                  <button
                    onClick={() => toggleNote(code)}
                    style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.text3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
                  >
                    <IcoPencil size={13} color={T.text3} />
                    Add Dream Note
                  </button>
                )}
              </div>
            );
          })}
        </Section>

        {/* ── Visited ── */}
        {groups.visited.length > 0 && (
          <Section title="Visited" color={T.rose} count={groups.visited.length}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {groups.visited.map(({ code, name, alpha2 }) => (
                <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1.5px solid ${T.rose}35`, borderRadius: 12, padding: '8px 10px' }}>
                  <Link to={`/country/${code}`} state={{ name, alpha2 }} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, textDecoration: 'none' }}>
                    <FlagImg alpha2={alpha2} size={16} />
                    <span style={{ color: T.text, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Crimson Text', Georgia, serif" }}>{name}</span>
                  </Link>
                  <button
                    onClick={() => openEditFor({ id: code, name, alpha2 }, 'visited')}
                    style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: 2 }}
                    title="Edit status"
                  >
                    <IcoPencil size={11} color={T.text3} />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Empty state ── */}
        {totalTracked === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 32 }}>
            <p style={{ fontSize: 48, margin: '0 0 10px' }}>🗺️</p>
            <p style={{ color: T.text, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Playfair Display', Georgia, serif" }}>No countries tracked yet</p>
            <p style={{ color: T.text3, fontSize: 13, marginBottom: 18 }}>
              Tap <strong style={{ color: T.purple }}>Add</strong> above to get started, or mark countries directly on the Map.
            </p>
            <button
              onClick={() => navigate('/map')}
              style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
            >
              Open Map
            </button>
          </div>
        )}
      </div>

      {/* ═══════════ Add / Edit Country Bottom Sheet ═══════════ */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.35)', pointerEvents: 'all' }} onClick={closeSheet} />

          <div style={{
            position: 'relative', width: '100%', maxWidth: 430,
            background: T.card, borderTop: `2.5px solid ${T.border}`,
            borderRadius: '20px 20px 0 0',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            pointerEvents: 'all', boxShadow: '0 -4px 24px rgba(44,26,14,0.15)',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
            </div>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 14px' }}>
              <p style={{ color: T.text, fontWeight: 700, fontSize: 16, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {addCountry && countryStatuses[addCountry.id] ? 'Edit Country Status' : 'Add Country'}
              </p>
              <button onClick={closeSheet} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <IcoX size={18} color={T.text3} />
              </button>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Country search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <IcoSearch size={14} color={T.text3} />
                </span>
                <input
                  type="text"
                  placeholder="Search for a country…"
                  value={addSearch}
                  onChange={e => { setAddSearch(e.target.value); setAddCountry(null); }}
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: T.bg, border: `1.5px solid ${T.border}`,
                    borderRadius: 10, padding: '10px 12px 10px 34px',
                    color: T.text, fontSize: 13, outline: 'none',
                    fontFamily: "'Crimson Text', Georgia, serif",
                  }}
                />
              </div>

              {/* Dropdown results */}
              {searchResults.length > 0 && (
                <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
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
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left', color: T.text, fontSize: 13 }}
                      >
                        <FlagImg alpha2={c.alpha2} size={16} />
                        <span style={{ flex: 1 }}>{c.name}</span>
                        {existing && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, flexShrink: 0, background: `${T.purple}20`, color: T.purple, fontWeight: 600 }}>
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
                <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FlagImg alpha2={addCountry.alpha2} size={18} />
                  <span style={{ color: T.text, fontWeight: 700, fontSize: 14, flex: 1, fontFamily: "'Playfair Display', Georgia, serif" }}>{addCountry.name}</span>
                  <button onClick={() => { setAddCountry(null); setAddSearch(''); }} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <IcoX size={15} color={T.text3} />
                  </button>
                </div>
              )}

              {/* Status picker */}
              <div>
                <p style={{ color: T.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 8px', fontFamily: "'Crimson Text', Georgia, serif" }}>
                  Set Status
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => {
                    const active = addStatus === key;
                    const statusColor = key === 'visited' ? T.rose : key === 'bucketList' ? T.navy : T.gold;
                    return (
                      <button
                        key={key}
                        onClick={() => setAddStatus(key)}
                        style={{
                          padding: '9px 8px', borderRadius: 10, cursor: 'pointer',
                          border: active ? `2px solid ${statusColor}` : `2px solid ${T.border}`,
                          background: active ? statusColor + '18' : T.bg,
                          color: active ? statusColor : T.text3,
                          fontSize: 12, fontWeight: active ? 700 : 500,
                          display: 'flex', alignItems: 'center', gap: 6,
                          transition: 'all 0.12s', fontFamily: "'Crimson Text', Georgia, serif",
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
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
                    style={{ flex: 1, padding: 11, borderRadius: 10, border: `1.5px dashed ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, cursor: 'pointer', fontWeight: 500, fontFamily: "'Crimson Text', Georgia, serif" }}
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!addCountry}
                  style={{
                    flex: 2, padding: 11, borderRadius: 10, border: 'none',
                    background: addCountry ? T.purple : `${T.border}80`,
                    color: addCountry ? '#fff' : T.text3,
                    fontSize: 13, fontWeight: 700,
                    cursor: addCountry ? 'pointer' : 'not-allowed',
                    transition: 'background 0.12s', fontFamily: "'Playfair Display', Georgia, serif",
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

// ── Country row for Traveling ─────────────────────────────────────────────────
function CountryRow({ code, name, alpha2, color, onEdit, onRemove }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.card, border: `1.5px solid ${color}35`, borderRadius: 12, padding: '10px 12px' }}>
      <FlagImg alpha2={alpha2} size={18} />
      <button
        style={{ flex: 1, color: T.text, fontSize: 13, fontWeight: 600, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Playfair Display', Georgia, serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        onClick={() => navigate(`/country/${code}`, { state: { name, alpha2 } })}
      >
        {name}
      </button>
      <button onClick={onEdit} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
        <IcoPencil size={12} color={T.text3} />
      </button>
      <button onClick={onRemove} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
        <IcoX size={13} color={T.text3} />
      </button>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, color, count, emptyText, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: color }} />
        <h2 style={{ color: T.text, fontWeight: 700, fontSize: 13, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h2>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: color + '22', color, fontFamily: "'Crimson Text', Georgia, serif" }}>
          {count}
        </span>
      </div>
      {count === 0 && emptyText ? (
        <div style={{ background: `${T.border}25`, border: `1.5px dashed ${T.border}`, borderRadius: 14, padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>{emptyText}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
      )}
    </div>
  );
}
