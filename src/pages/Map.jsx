import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobeView from '../components/GlobeView';
import { getCountryInfo, getFlagEmoji, COUNTRY_NAMES } from '../data/countryNames';
import { useTravel } from '../context/TravelContext';

const STATUS_LABELS = {
  visited:    'Visited',
  bucketList: 'Bucket List',
  current:    'Traveling',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtPopulation(n) {
  if (!n) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

function fmtArea(n) {
  if (!n) return '—';
  return n.toLocaleString() + ' km²';
}

export default function MapPage() {
  const globeContainerRef = useRef();
  const [size, setSize]       = useState(400);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]   = useState('');
  const navigate = useNavigate();
  const { countryStatuses, setCountryStatus, statusColors, profile } = useTravel();

  // Country info fetched from REST Countries API
  const [countryInfo,  setCountryInfo]  = useState(null);
  const [infoLoading,  setInfoLoading]  = useState(false);

  // ── Globe size ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (globeContainerRef.current) {
        setSize(Math.min(globeContainerRef.current.offsetWidth, 430));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Fetch country info whenever selection changes ────────────────────────────
  useEffect(() => {
    if (!selected?.alpha2) { setCountryInfo(null); return; }
    setInfoLoading(true);
    setCountryInfo(null);

    fetch(`https://restcountries.com/v3.1/alpha/${selected.alpha2}?fields=capital,population,currencies,languages,region,subregion,area,timezones,flags,coatOfArms`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const c = Array.isArray(data) ? data[0] : data;
        const currencies = Object.values(c.currencies || {})
          .map(cur => `${cur.name} (${cur.symbol || '—'})`)
          .join(', ') || '—';
        const languages = Object.values(c.languages || {}).join(', ') || '—';
        setCountryInfo({
          capital:    c.capital?.[0]              || '—',
          population: fmtPopulation(c.population),
          currencies,
          languages,
          region:     c.subregion || c.region     || '—',
          area:       fmtArea(c.area),
          timezone:   c.timezones?.[0]            || '—',
        });
      })
      .catch(() => setCountryInfo({ error: true }))
      .finally(() => setInfoLoading(false));
  }, [selected?.alpha2]);

  // ── Search ───────────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return Object.entries(COUNTRY_NAMES)
      .filter(([, v]) => v.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map(([id, v]) => ({ id, ...v }));
  }, [search]);

  const handleCountryClick  = (feat) => { setSelected({ id: String(feat.id), ...getCountryInfo(feat.id) }); setSearch(''); };
  const handleSearchSelect  = (c)    => { setSelected(c); setSearch(''); };
  const handleStatusSet     = (st)   => selected && setCountryStatus(selected.id, st);
  const currentStatus = selected ? countryStatuses[selected.id]?.status : null;

  // ── Info rows config ─────────────────────────────────────────────────────────
  const INFO_ROWS = countryInfo && !countryInfo.error ? [
    { icon: '🏙️', label: 'Capital',    value: countryInfo.capital    },
    { icon: '👥', label: 'Population', value: countryInfo.population },
    { icon: '💰', label: 'Currency',   value: countryInfo.currencies },
    { icon: '🗣️', label: 'Languages',  value: countryInfo.languages  },
    { icon: '🌍', label: 'Region',     value: countryInfo.region     },
    { icon: '📐', label: 'Area',       value: countryInfo.area       },
    { icon: '🕐', label: 'Timezone',   value: countryInfo.timezone   },
  ] : [];

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* ── Search bar ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 relative z-20">
        <input
          type="text"
          placeholder="🔍  Search country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />
        {search && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-30">
            {searchResults.length > 0 ? searchResults.map(country => {
              const status = countryStatuses[country.id]?.status;
              return (
                <button
                  key={country.id}
                  onClick={() => handleSearchSelect(country)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-b border-slate-800 last:border-0"
                >
                  <span className="text-xl">{getFlagEmoji(country.alpha2)}</span>
                  <span className="text-white text-sm flex-1">{country.name}</span>
                  {status && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: statusColors[status] + '25', color: statusColors[status] }}>
                      {STATUS_LABELS[status]}
                    </span>
                  )}
                </button>
              );
            }) : (
              <div className="px-4 py-3 text-slate-500 text-sm">No results for "{search}"</div>
            )}
          </div>
        )}
      </div>

      {/* ── Globe ── */}
      <div
        ref={globeContainerRef}
        className="flex-1 flex items-center justify-center bg-slate-950"
        onClick={() => search && setSearch('')}
      >
        <GlobeView onCountryClick={handleCountryClick} size={size} />
      </div>

      {/* ── Legend ── */}
      <div className="bg-slate-950 flex justify-center gap-4 py-1.5 flex-wrap px-3">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ background: statusColors[key] }} />
            {label}
          </div>
        ))}
        {profile?.homeCountry && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ background: profile?.homeCountryColor || '#ff6b6b' }} />
            Home Country
          </div>
        )}
      </div>
    </div>

    {/* ══════════════════════════════════════════════════════════════════════════
        Country panel — fixed bottom sheet
    ══════════════════════════════════════════════════════════════════════════ */}
    {selected && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
        {/* Backdrop */}
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'all' }}
          onClick={() => setSelected(null)}
        />

        {/* Sheet — flex column so drag handle is fixed while content scrolls */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          background: '#1e293b',
          borderTop: '1px solid #334155',
          borderRadius: '20px 20px 0 0',
          pointerEvents: 'all',
          maxHeight: 'min(88svh, 88vh)',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* ── Drag handle (never scrolls) ── */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#475569' }} />
          </div>

          {/* ── Scrollable content ── */}
          <div style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)',
          }}>

            {/* Country header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 26 }}>{getFlagEmoji(selected.alpha2)}</span>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0, lineHeight: 1.2 }}>{selected.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: currentStatus ? statusColors[currentStatus] : '#64748b' }}>
                    {currentStatus ? STATUS_LABELS[currentStatus] : 'No status set'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => navigate(`/country/${selected.id}`, { state: { name: selected.name, alpha2: selected.alpha2 } })}
                  style={{ fontSize: 11, background: 'rgba(6,182,212,0.15)', color: '#a78bfa', border: '1px solid rgba(6,182,212,0.3)', padding: '5px 10px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Memories →
                </button>
                <button
                  onClick={() => setSelected(null)}
                  style={{ color: '#64748b', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#334155', margin: '0 16px 2px' }} />

            {/* Status buttons — 3 in a row */}
            <div style={{ padding: '10px 12px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {Object.entries(STATUS_LABELS).map(([key, label]) => {
                const isActive = currentStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleStatusSet(key)}
                    style={{
                      padding: '10px 4px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      border: isActive ? `2px solid ${statusColors[key]}` : '2px solid #334155',
                      background: isActive ? statusColors[key] + '25' : '#0f172a',
                      color: isActive ? statusColors[key] : '#94a3b8',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 5, transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[key] }} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Remove status */}
            {currentStatus && (
              <div style={{ padding: '4px 12px 8px' }}>
                <button
                  onClick={() => handleStatusSet(null)}
                  style={{
                    width: '100%', padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                    border: '1.5px dashed #475569', background: 'transparent', color: '#94a3b8',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  ✕ Remove status
                </button>
              </div>
            )}

            {/* ── Country Info Card ─────────────────────────────────────────── */}
            <div style={{ margin: '8px 12px 0', background: '#0f172a', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>

              {/* Info header */}
              <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>ℹ️</span>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Country Info
                </p>
              </div>

              {/* Loading */}
              {infoLoading && (
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #334155', borderTopColor: '#8b5cf6', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ color: '#475569', fontSize: 12 }}>Loading…</span>
                </div>
              )}

              {/* Error */}
              {countryInfo?.error && (
                <div style={{ padding: '14px', textAlign: 'center' }}>
                  <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>Could not load country info</p>
                </div>
              )}

              {/* Info rows */}
              {INFO_ROWS.length > 0 && (
                <div>
                  {INFO_ROWS.map(({ icon, label, value }, i) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '9px 14px',
                        borderBottom: i < INFO_ROWS.length - 1 ? '1px solid #1e293b' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                      <span style={{ color: '#64748b', fontSize: 11, flexShrink: 0, width: 72, paddingTop: 1 }}>{label}</span>
                      <span style={{ color: '#cbd5e1', fontSize: 12, flex: 1, lineHeight: 1.5 }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>{/* end scrollable */}
        </div>{/* end sheet */}
      </div>
    )}

    {/* Spin keyframe for loading spinner */}
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
