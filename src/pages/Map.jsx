import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobeView from '../components/GlobeView';
import { getCountryInfo, COUNTRY_NAMES } from '../data/countryNames';
import FlagImg from '../components/FlagImg';
import { useTravel } from '../context/TravelContext';
import { IcoSearch, IcoInfo } from '../components/VintageIcons';

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
  const [size, setSize]         = useState(400);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const navigate = useNavigate();
  const { countryStatuses, setCountryStatus, statusColors, profile } = useTravel();

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
    { label: 'Capital',    value: countryInfo.capital    },
    { label: 'Population', value: countryInfo.population },
    { label: 'Currency',   value: countryInfo.currencies },
    { label: 'Languages',  value: countryInfo.languages  },
    { label: 'Region',     value: countryInfo.region     },
    { label: 'Area',       value: countryInfo.area       },
    { label: 'Timezone',   value: countryInfo.timezone   },
  ] : [];

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>

      {/* ── Search bar ── */}
      <div style={{
        background: T.card,
        borderBottom: `2px solid ${T.border}`,
        padding: '8px 12px',
        position: 'relative', zIndex: 20,
      }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <IcoSearch size={15} color={T.text3} />
          </span>
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: T.bg,
              border: `1.5px solid ${T.border}`,
              borderRadius: 12, padding: '8px 14px 8px 34px',
              color: T.text, fontSize: 13,
              outline: 'none',
              fontFamily: "'Crimson Text', Georgia, serif",
              boxSizing: 'border-box',
            }}
          />
        </div>
        {search && (
          <div style={{ position: 'absolute', left: 12, right: 12, top: '100%', marginTop: 4, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', zIndex: 30, boxShadow: '0 4px 16px rgba(44,26,14,0.12)' }}>
            {searchResults.length > 0 ? searchResults.map(country => {
              const status = countryStatuses[country.id]?.status;
              return (
                <button
                  key={country.id}
                  onClick={() => handleSearchSelect(country)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', color: T.text, fontSize: 13 }}
                >
                  <FlagImg alpha2={country.alpha2} size={18} />
                  <span style={{ flex: 1 }}>{country.name}</span>
                  {status && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: statusColors[status] + '25', color: statusColors[status] }}>
                      {STATUS_LABELS[status]}
                    </span>
                  )}
                </button>
              );
            }) : (
              <div style={{ padding: '12px 14px', color: T.text3, fontSize: 13 }}>No results for "{search}"</div>
            )}
          </div>
        )}
      </div>

      {/* ── Globe ── */}
      <div
        ref={globeContainerRef}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0e8d8' }}
        onClick={() => search && setSearch('')}
      >
        <GlobeView onCountryClick={handleCountryClick} size={size} />
      </div>

      {/* ── Legend ── */}
      <div style={{ background: T.card, borderTop: `1.5px solid ${T.border}`, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, padding: '6px 12px' }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.text2, fontFamily: "'Crimson Text', Georgia, serif" }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[key] }} />
            {label}
          </div>
        ))}
        {profile?.homeCountry && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.text2, fontFamily: "'Crimson Text', Georgia, serif" }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: profile?.homeCountryColor || '#ff6b6b' }} />
            Home Country
          </div>
        )}
      </div>
    </div>

    {/* ══════════════════════════════════════════════════════════════════════════
        Country panel — fixed bottom sheet (parchment style)
    ══════════════════════════════════════════════════════════════════════════ */}
    {selected && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
        {/* Backdrop */}
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.35)', pointerEvents: 'all' }}
          onClick={() => setSelected(null)}
        />

        {/* Sheet */}
        <div style={{
          position: 'relative',
          width: '100%', maxWidth: 430,
          background: T.card,
          borderTop: `2.5px solid ${T.border}`,
          borderRadius: '20px 20px 0 0',
          pointerEvents: 'all',
          maxHeight: 'min(88svh, 88vh)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(44,26,14,0.15)',
        }}>

          {/* Drag handle */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)' }}>

            {/* Country header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FlagImg alpha2={selected.alpha2} size={28} />
                <div>
                  <p style={{ color: T.text, fontWeight: 700, fontSize: 16, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>{selected.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: currentStatus ? statusColors[currentStatus] : T.text3 }}>
                    {currentStatus ? STATUS_LABELS[currentStatus] : 'No status set'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => navigate(`/country/${selected.id}`, { state: { name: selected.name, alpha2: selected.alpha2 } })}
                  style={{ fontSize: 11, background: `${T.purple}15`, color: T.purple, border: `1.5px solid ${T.purple}40`, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Crimson Text', Georgia, serif" }}
                >
                  Memories →
                </button>
                <button
                  onClick={() => setSelected(null)}
                  style={{ color: T.text3, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: T.border, margin: '0 16px 4px' }} />

            {/* Status buttons */}
            <div style={{ padding: '10px 12px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {Object.entries(STATUS_LABELS).map(([key, label]) => {
                const isActive = currentStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleStatusSet(key)}
                    style={{
                      padding: '10px 4px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      border: isActive ? `2px solid ${statusColors[key]}` : `2px solid ${T.border}`,
                      background: isActive ? statusColors[key] + '22' : T.bg,
                      color: isActive ? statusColors[key] : T.text3,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 5, transition: 'all 0.15s',
                      fontFamily: "'Crimson Text', Georgia, serif",
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
                    border: `1.5px dashed ${T.border}`, background: 'transparent', color: T.text3,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, transition: 'all 0.15s', fontFamily: "'Crimson Text', Georgia, serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c4809a'; e.currentTarget.style.color = '#c4809a'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}
                >
                  ✕ Remove status
                </button>
              </div>
            )}

            {/* Country Info Card */}
            <div style={{ margin: '8px 12px 0', background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

              {/* Info header */}
              <div style={{ padding: '10px 14px 8px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ margin: 0, color: T.text3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Crimson Text', Georgia, serif" }}>
                  Country Info
                </p>
                <IcoInfo size={13} color={T.text3} />
              </div>

              {/* Loading */}
              {infoLoading && (
                <div style={{ padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.purple, display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ color: T.text3, fontSize: 12 }}>Loading…</span>
                </div>
              )}

              {/* Error */}
              {countryInfo?.error && (
                <div style={{ padding: 14, textAlign: 'center' }}>
                  <p style={{ color: T.text3, fontSize: 12, margin: 0 }}>Could not load country info</p>
                </div>
              )}

              {/* Info rows */}
              {INFO_ROWS.length > 0 && (
                <div>
                  {INFO_ROWS.map(({ label, value }, i) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '9px 14px',
                        borderBottom: i < INFO_ROWS.length - 1 ? `1px solid ${T.border}` : 'none',
                      }}
                    >
                      <span style={{ color: T.text3, fontSize: 11, flexShrink: 0, width: 72, paddingTop: 1 }}>{label}</span>
                      <span style={{ color: T.text2, fontSize: 12, flex: 1, lineHeight: 1.5 }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    )}

    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
