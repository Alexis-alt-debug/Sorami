import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IcoCalendar, IcoStar, IcoSearch, IcoUsers, IcoTrash, IcoPencil, IcoPlus, IcoCheck, IcoMapPin, IcoCamera, IcoX, IcoCoin, IcoBook, IcoFlower, IcoSun, IcoMapleLeaf, IcoSnowflake } from '../components/VintageIcons';
import CurrencyBudgetField, { formatBudget } from '../components/CurrencyBudgetField';
import { useTravel } from '../context/TravelContext';
import { COUNTRY_NAMES } from '../data/countryNames';
import FlagImg from '../components/FlagImg';
import { format, parseISO } from 'date-fns';
import PhotoLightbox from '../components/PhotoLightbox';

const MAX_PLAN_PHOTOS = 4;

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

// ── Shared sheet styles ────────────────────────────────────────────────────────
const sheetInput = {
  width: '100%',
  background: T.bg,
  border: `1.5px solid ${T.border}`,
  borderRadius: 10,
  padding: '10px 12px',
  color: T.text,
  fontSize: 13,
  outline: 'none',
  fontFamily: "'Crimson Text', Georgia, serif",
  boxSizing: 'border-box',
};

const sheetLabel = {
  fontSize: 10,
  color: T.text3,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 700,
  display: 'block',
  marginBottom: 7,
  fontFamily: "'Crimson Text', Georgia, serif",
};

// Same compression as AddMemory — max 900px, 65% JPEG quality
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg', 0.65
      );
    };
    img.src = objectUrl;
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateRange(date, dateTo) {
  if (!date) return null;
  try {
    const from = parseISO(date);
    if (!dateTo) return format(from, 'MMM d, yyyy');
    const to = parseISO(dateTo);
    const sameMonth = format(from, 'MMM yyyy') === format(to, 'MMM yyyy');
    const sameYear  = format(from, 'yyyy')     === format(to, 'yyyy');
    if (sameMonth) return `${format(from, 'MMM d')} – ${format(to, 'd, yyyy')}`;
    if (sameYear)  return `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`;
    return `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;
  } catch { return null; }
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  try {
    const trip = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((trip - today) / 86400000);
  } catch { return null; }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Latest' },
  { value: 'date-asc',  label: 'Oldest' },
  { value: 'country',   label: 'Country A→Z' },
];

const PLAN_STATUS = {
  planning:  { label: 'Planning',   color: '#a89070' },
  booked:    { label: 'Booked',     color: '#7b6eb0' },
  confirmed: { label: 'Confirmed',  color: '#5a8a5a' },
};

// ── Diary Page ────────────────────────────────────────────────────────────────

export default function Diary() {
  const {
    memories, loading, memoriesError, deleteMemory,
    tripPlans, addTripPlan, updateTripPlan, deleteTripPlan,
  } = useTravel();

  const location  = useLocation();
  const [activeTab,  setActiveTab]  = useState('memories');
  const [search,     setSearch]     = useState(location.state?.search || '');
  const [filterYear, setFilterYear] = useState('');
  const [sortBy,     setSortBy]     = useState('date-desc');
  const [planSheet,  setPlanSheet]  = useState(null);

  const years = [...new Set(memories.map(m => m.date?.slice(0, 4)).filter(Boolean))].sort((a, b) => b - a);

  // ── Memories filter / sort / group ──────────────────────────────────────────
  const filtered = memories.filter(m => {
    const matchSearch =
      !search ||
      m.countryName?.toLowerCase().includes(search.toLowerCase()) ||
      m.region?.toLowerCase().includes(search.toLowerCase()) ||
      m.diary?.toLowerCase().includes(search.toLowerCase());
    const matchYear = !filterYear || m.date?.startsWith(filterYear);
    return matchSearch && matchYear;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return (b.date || '').localeCompare(a.date || '');
    if (sortBy === 'date-asc')  return (a.date || '').localeCompare(b.date || '');
    if (sortBy === 'country')   return (a.countryName || '').localeCompare(b.countryName || '');
    return 0;
  });

  const grouped = sorted.reduce((acc, m) => {
    const key = sortBy === 'country'
      ? (m.countryName || 'Unknown Country')
      : (m.date ? format(parseISO(m.date), 'MMMM yyyy') : 'Unknown Date');
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>

      {/* ── Sticky header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: T.card, borderBottom: `2px solid ${T.border}`, padding: 14, boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { id: 'memories', label: 'Memories' },
            { id: 'plans',    label: 'Plans'     },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Crimson Text', Georgia, serif",
                border: `1.5px solid ${activeTab === tab.id ? T.purple + '70' : T.border}`,
                background: activeTab === tab.id ? `${T.purple}15` : 'none',
                color: activeTab === tab.id ? T.purple : T.text3,
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Memories header */}
        {activeTab === 'memories' && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <h1 style={{ color: T.text, fontWeight: 700, fontSize: 20, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                Travel Diary
              </h1>
              <span style={{ color: T.text3, fontSize: 11 }}>
                {loading ? 'Loading…' : `${memories.length} memor${memories.length === 1 ? 'y' : 'ies'}`}
              </span>
            </div>

            <div style={{ position: 'relative', marginBottom: 8 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <IcoSearch size={14} color={T.text3} />
              </span>
              <input
                type="text"
                placeholder="Search countries, places, diary…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...sheetInput, paddingLeft: 32 }}
              />
            </div>

            <div className="diary-filter-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {SORT_OPTIONS.map(opt => (
                <FilterChip key={opt.value} active={sortBy === opt.value} onClick={() => setSortBy(opt.value)}>
                  {opt.label}
                </FilterChip>
              ))}
              {years.length > 0 && (
                <>
                  <span style={{ width: 1, background: T.border, flexShrink: 0, alignSelf: 'stretch', margin: '0 2px' }} />
                  <FilterChip active={!filterYear} onClick={() => setFilterYear('')}>All years</FilterChip>
                  {years.map(y => (
                    <FilterChip key={y} active={filterYear === y} onClick={() => setFilterYear(y === filterYear ? '' : y)}>
                      {y}
                    </FilterChip>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {/* Plans header */}
        {activeTab === 'plans' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ color: T.text, fontWeight: 700, fontSize: 20, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Trip Planner</h1>
              <p style={{ color: T.text3, fontSize: 11, margin: '2px 0 0' }}>
                {tripPlans.length === 0 ? 'No plans yet' : `${tripPlans.length} upcoming trip${tripPlans.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => setPlanSheet('new')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.purple, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
            >
              <IcoPlus size={14} color="#fff" /> Add Plan
            </button>
          </div>
        )}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'memories' ? (

        <div style={{ padding: 14 }}>
          {memoriesError && (
            <div style={{ marginBottom: 14, background: `${T.rose}12`, border: `1.5px solid ${T.rose}40`, borderRadius: 14, padding: '12px 16px' }}>
              <p style={{ color: T.rose, fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>Could not load memories</p>
              <p style={{ color: T.rose, fontSize: 11, margin: 0, opacity: 0.7 }}>{memoriesError}</p>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.purple, animation: 'spin 0.7s linear infinite' }} />
            </div>

          ) : memories.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 64, paddingInline: 16 }}>
              <p style={{ fontSize: 40, margin: '0 0 10px' }}>📖</p>
              <p style={{ color: T.text, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Playfair Display', Georgia, serif" }}>No memories saved yet</p>
              <p style={{ color: T.text3, fontSize: 13 }}>Go to the Map, tap a country, then tap ＋ to add your first memory.</p>
            </div>

          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 48 }}>
              <p style={{ fontSize: 28, margin: '0 0 10px' }}>🔍</p>
              <p style={{ color: T.text, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Playfair Display', Georgia, serif" }}>No results for "{search}"</p>
              <p style={{ color: T.text3, fontSize: 13, marginBottom: 14 }}>
                {memories.length} memor{memories.length === 1 ? 'y' : 'ies'} saved — try clearing the search.
              </p>
              <button
                onClick={() => setSearch('')}
                style={{ background: `${T.purple}15`, color: T.purple, border: `1.5px solid ${T.purple}40`, padding: '8px 18px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
              >
                Clear search
              </button>
            </div>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(grouped).map(([groupLabel, mems]) => (
                <div key={groupLabel}>
                  <h2 style={{ color: T.text3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px', fontFamily: "'Crimson Text', Georgia, serif" }}>
                    {groupLabel}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {mems.map(m => (
                      <DiaryCard key={m.id} memory={m} onDelete={() => deleteMemory(m.id)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      ) : (

        <div style={{ padding: 14 }}>
          {tripPlans.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 64, paddingInline: 16 }}>
              <p style={{ fontSize: 40, margin: '0 0 10px' }}>🗺️</p>
              <p style={{ color: T.text, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Playfair Display', Georgia, serif" }}>No trips planned yet</p>
              <p style={{ color: T.text3, fontSize: 13, marginBottom: 18 }}>Add a future trip — country, dates, budget, and a checklist of things to do.</p>
              <button
                onClick={() => setPlanSheet('new')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.purple, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
              >
                <IcoPlus size={14} color="#fff" /> Plan My First Trip
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tripPlans.map(plan => (
                <TripPlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={() => setPlanSheet(plan)}
                  onDelete={() => deleteTripPlan(plan.id)}
                  onToggleCheck={(i) => {
                    const updated = (plan.checklist || []).map((item, idx) =>
                      idx === i ? { ...item, done: !item.done } : item
                    );
                    updateTripPlan(plan.id, { checklist: updated });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Plan sheet ── */}
      {planSheet !== null && (
        <AddPlanSheet
          editPlan={planSheet === 'new' ? null : planSheet}
          onClose={() => setPlanSheet(null)}
          onSave={async (data) => {
            if (planSheet === 'new') {
              await addTripPlan(data);
            } else {
              await updateTripPlan(planSheet.id, data);
            }
            setPlanSheet(null);
          }}
          onDelete={async () => {
            await deleteTripPlan(planSheet.id);
            setPlanSheet(null);
          }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .diary-filter-scroll::-webkit-scrollbar { height: 4px; }
        .diary-filter-scroll::-webkit-scrollbar-track { background: #e8dcc8; border-radius: 2px; }
        .diary-filter-scroll::-webkit-scrollbar-thumb { background: #b89878; border-radius: 2px; }
        .diary-filter-scroll::-webkit-scrollbar-thumb:hover { background: #9a7a5a; }
        .diary-filter-scroll { scrollbar-width: thin; scrollbar-color: #b89878 #e8dcc8; }
      `}</style>
    </div>
  );
}

// ── Season icon helper ────────────────────────────────────────────────────────
function SeasonIcon({ season, size = 11, color = '#a89070' }) {
  switch ((season || '').toLowerCase()) {
    case 'spring': return <IcoFlower    size={size} color={color} />;
    case 'summer': return <IcoSun       size={size} color={color} />;
    case 'autumn': return <IcoMapleLeaf size={size} color={color} />;
    case 'winter': return <IcoSnowflake size={size} color={color} />;
    default:       return null;
  }
}

// ── DiaryCard ─────────────────────────────────────────────────────────────────

function DiaryCard({ memory, onDelete }) {
  const navigate = useNavigate();
  const dateStr = formatDateRange(memory.date, memory.dateTo);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox,      setLightbox]      = useState(null);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirmDelete) { onDelete(); }
    else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>

      {/* Photo lightbox */}
      {lightbox !== null && memory.photos?.length > 0 && (
        <PhotoLightbox
          photos={memory.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(lb => ({ index: (lb.index - 1 + memory.photos.length) % memory.photos.length }))}
          onNext={() => setLightbox(lb => ({ index: (lb.index + 1) % memory.photos.length }))}
          onJump={i => setLightbox({ index: i })}
        />
      )}

      {/* Tappable body */}
      <div
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/country/${memory.countryCode}`, {
          state: { name: memory.countryName, alpha2: memory.countryAlpha2 || '' }
        })}
      >
        {/* Photo strip */}
        {memory.photos?.length > 0 && (
          <div style={{ display: 'flex', gap: 2, height: 130, overflow: 'hidden' }}>
            {memory.photos.slice(0, 4).map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={e => { e.stopPropagation(); setLightbox({ index: i }); }}
                style={{ flex: 1, minWidth: 0, overflow: 'hidden', padding: 0, background: 'none', border: 'none', cursor: 'zoom-in' }}
              >
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: 14 }}>
          {/* Country + date + rating */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <FlagImg alpha2={memory.countryAlpha2 || ''} size={20} />
              <div style={{ minWidth: 0 }}>
                <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0, fontFamily: "'Playfair Display', Georgia, serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memory.countryName}</p>
                {memory.region && (
                  <p style={{ color: T.navy, fontSize: 11, margin: '2px 0 0' }}>{memory.region}</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, marginLeft: 8, flexShrink: 0 }}>
              {dateStr && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.text3 }}>
                  <IcoCalendar size={11} color={T.text3} />{dateStr}
                </span>
              )}
              {memory.rating > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: T.gold }}>
                  {Array.from({ length: memory.rating }).map((_, i) => (
                    <IcoStar key={i} size={11} color={T.gold} filled />
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* Weather + budget */}
          {((memory.season || memory.weather) || memory.budget > 0) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              {(memory.season || memory.weather) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.text3 }}>
                  <SeasonIcon season={memory.season || memory.weather} size={11} color={T.text3} />
                  {memory.season || memory.weather}
                </span>
              )}
              {memory.budget > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.text3 }}>
                  <IcoCoin size={11} color={T.gold} />{formatBudget(memory.budget, memory.budgetCurrency)}
                </span>
              )}
            </div>
          )}

          {/* Partners */}
          {memory.partners?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <IcoUsers size={11} color={T.text3} />
              <span style={{ fontSize: 11, color: T.text3 }}>{memory.partners.join(', ')}</span>
            </div>
          )}

          {/* Diary text */}
          {memory.diary ? (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 5px', fontFamily: "'Crimson Text', Georgia, serif" }}>Diary</p>
              <p style={{ color: T.text2, fontSize: 13, lineHeight: 1.65, margin: 0, fontFamily: "'Crimson Text', Georgia, serif" }}>
                {memory.diary}
              </p>
            </div>
          ) : (
            <p style={{ color: T.text3, fontSize: 11, fontStyle: 'italic', marginTop: 8 }}>No diary entry.</p>
          )}

          {/* Tags */}
          {memory.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {memory.tags.map(t => (
                <span key={t} style={{ fontSize: 10, background: `${T.navy}14`, color: T.navy, border: `1px solid ${T.navy}30`, padding: '2px 8px', borderRadius: 20, fontFamily: "'Crimson Text', Georgia, serif" }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      <div style={{ padding: '8px 14px 10px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/country/${memory.countryCode}/add`, {
              state: { name: memory.countryName, alpha2: memory.countryAlpha2 || '', memory },
            });
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px', borderRadius: 8, color: T.text3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
        >
          <IcoPencil size={13} color={T.text3} /> Edit
        </button>

        <button
          onClick={handleDelete}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
            fontFamily: "'Crimson Text', Georgia, serif",
            background: confirmDelete ? `${T.rose}15` : 'none',
            color: confirmDelete ? T.rose : T.text3,
            border: confirmDelete ? `1px solid ${T.rose}50` : 'none',
            transition: 'all 0.15s',
          }}
        >
          <IcoTrash size={13} color={confirmDelete ? T.rose : T.text3} />
          {confirmDelete ? 'Tap again to confirm' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ── TripPlanCard ──────────────────────────────────────────────────────────────

function TripPlanCard({ plan, onEdit, onDelete, onToggleCheck }) {
  const navigate = useNavigate();
  const dateStr  = formatDateRange(plan.dateFrom, plan.dateTo);
  const days     = daysUntil(plan.dateFrom);
  const { label: statusLabel, color: statusColor } =
    PLAN_STATUS[plan.status] || PLAN_STATUS.planning;

  const checklist   = plan.checklist || [];
  const doneCount   = checklist.filter(i => i.done).length;
  const totalCount  = checklist.length;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox,      setLightbox]      = useState(null);

  const daysColor =
    days === null   ? null :
    days === 0      ? T.gold :
    days < 0        ? T.text3 :
    days <= 7       ? T.rose :
    days <= 30      ? T.gold : T.navy;

  const daysLabel =
    days === null ? null :
    days === 0    ? 'Today!' :
    days < 0      ? 'Past trip' :
    days === 1    ? 'Tomorrow' :
                    `In ${days} days`;

  return (
    <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>

      {lightbox !== null && plan.photos?.length > 0 && (
        <PhotoLightbox
          photos={plan.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(lb => ({ index: (lb.index - 1 + plan.photos.length) % plan.photos.length }))}
          onNext={() => setLightbox(lb => ({ index: (lb.index + 1) % plan.photos.length }))}
          onJump={i => setLightbox({ index: i })}
        />
      )}

      {/* Photo strip */}
      {plan.photos?.length > 0 && (
        <div style={{ display: 'flex', gap: 2, height: 130, overflow: 'hidden' }}>
          {plan.photos.slice(0, 4).map((url, i) => (
            <button key={i} type="button" onClick={() => setLightbox({ index: i })}
              style={{ flex: 1, minWidth: 0, overflow: 'hidden', padding: 0, background: 'none', border: 'none', cursor: 'zoom-in' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: 14 }}>

        {/* Top row: flag + name + status badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <FlagImg alpha2={plan.countryAlpha2 || ''} size={22} />
            <div style={{ minWidth: 0 }}>
              <button
                onClick={() => navigate(`/country/${plan.countryCode}`, { state: { name: plan.countryName, alpha2: plan.countryAlpha2 || '' } })}
                style={{ color: T.text, fontWeight: 700, fontSize: 14, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {plan.countryName}
              </button>
              {plan.title && (
                <p style={{ color: T.text3, fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.title}</p>
              )}
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0, marginLeft: 8, background: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}40`, fontFamily: "'Crimson Text', Georgia, serif" }}>
            {statusLabel}
          </span>
        </div>

        {/* Date + days-until */}
        {(dateStr || daysLabel) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            {dateStr && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.text3 }}>
                <IcoCalendar size={11} color={T.text3} />{dateStr}
              </span>
            )}
            {daysLabel && (
              <span style={{ fontSize: 11, fontWeight: 700, color: daysColor }}>{daysLabel}</span>
            )}
          </div>
        )}

        {/* Budget */}
        {plan.budget > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.text3, marginBottom: 8 }}>
            <IcoCoin size={11} color={T.gold} /> Budget: {formatBudget(plan.budget, plan.budgetCurrency)}
          </div>
        )}

        {/* City itinerary */}
        {plan.cities?.length > 0 && (
          <div style={{ marginBottom: 10, background: `${T.border}25`, borderRadius: 10, overflow: 'hidden' }}>
            {plan.cities.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < plan.cities.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <IcoMapPin size={11} color={T.navy} />
                <span style={{ color: T.text2, fontSize: 12, fontWeight: 600, flex: 1 }}>{c.name}</span>
                {(c.dateFrom || c.dateTo) && (
                  <span style={{ color: T.text3, fontSize: 11 }}>{formatDateRange(c.dateFrom, c.dateTo) || c.dateFrom}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes preview */}
        {plan.notes && (
          <p style={{ color: T.text3, fontSize: 12, lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {plan.notes}
          </p>
        )}

        {/* Checklist */}
        {totalCount > 0 && (
          <div style={{ background: `${T.border}25`, borderRadius: 10, padding: 10, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: "'Crimson Text', Georgia, serif" }}>Checklist</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: doneCount === totalCount ? '#5a8a5a' : T.text3 }}>
                {doneCount === totalCount ? '✓ All done' : `${doneCount} / ${totalCount} done`}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {checklist.slice(0, 4).map((item, i) => (
                <button key={i} onClick={() => onToggleCheck(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: item.done ? T.purple : 'transparent',
                    border: `2px solid ${item.done ? T.purple : T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}>
                    {item.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, color: item.done ? T.text3 : T.text2, textDecoration: item.done ? 'line-through' : 'none', fontFamily: "'Crimson Text', Georgia, serif" }}>
                    {item.text}
                  </span>
                </button>
              ))}
              {totalCount > 4 && (
                <p style={{ fontSize: 10, color: T.text3, marginLeft: 24, margin: '2px 0 0 24px' }}>+ {totalCount - 4} more — tap Edit to see all</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action row */}
      <div style={{ padding: '8px 14px 10px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onEdit}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px', borderRadius: 8, color: T.text3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}>
          <IcoPencil size={13} color={T.text3} /> Edit
        </button>
        <button
          onClick={() => {
            if (confirmDelete) { onDelete(); }
            else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
            fontFamily: "'Crimson Text', Georgia, serif",
            background: confirmDelete ? `${T.rose}15` : 'none',
            color: confirmDelete ? T.rose : T.text3,
            border: confirmDelete ? `1px solid ${T.rose}50` : 'none',
            transition: 'all 0.15s',
          }}
        >
          <IcoTrash size={13} color={confirmDelete ? T.rose : T.text3} />
          {confirmDelete ? 'Tap again to confirm' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ── AddPlanSheet ──────────────────────────────────────────────────────────────

function AddPlanSheet({ editPlan, onClose, onSave, onDelete }) {
  const { uploadPhoto } = useTravel();

  const [form, setForm] = useState({
    countryCode:    editPlan?.countryCode   || '',
    countryName:    editPlan?.countryName   || '',
    countryAlpha2:  editPlan?.countryAlpha2 || '',
    title:          editPlan?.title         || '',
    dateFrom:       editPlan?.dateFrom      || '',
    dateTo:         editPlan?.dateTo        || '',
    cities:         editPlan?.cities        || [],
    notes:          editPlan?.notes         || '',
    budget:         editPlan?.budget != null ? String(editPlan.budget) : '',
    budgetCurrency: editPlan?.budgetCurrency || 'USD',
    status:         editPlan?.status        || 'planning',
    checklist:      editPlan?.checklist     || [],
  });

  // ── Photos ──────────────────────────────────────────────────────────────────
  const [photos,    setPh]        = useState(editPlan?.photos || []);
  const [previews,  setPrev]      = useState(editPlan?.photos || []);
  const [uploadMsg, setUploadMsg] = useState('');
  const photoFileRef = useRef();

  const handlePhotos = (e) => {
    const incoming = Array.from(e.target.files);
    e.target.value = '';
    const slots   = MAX_PLAN_PHOTOS - photos.length;
    if (slots <= 0) return;
    const allowed = incoming.slice(0, slots);
    setPh(prev => [...prev, ...allowed]);
    allowed.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPrev(p => [...p, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i) => {
    setPh(prev  => prev.filter((_, idx) => idx !== i));
    setPrev(prev => prev.filter((_, idx) => idx !== i));
  };

  const [countrySearch,  setCountrySearch]  = useState('');
  const [checkInput,     setCheckInput]     = useState('');
  const [saving,         setSaving]         = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  // ── City stops ──────────────────────────────────────────────────────────────
  const [addingCity,  setAddingCity]  = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo,   setPendingTo]   = useState('');

  // ── District state ──────────────────────────────────────────────────────────
  const [districts,        setDistricts]        = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [districtSearch,   setDistrictSearch]   = useState('');

  useEffect(() => {
    if (!form.countryName) { setDistricts([]); return; }
    setDistrictsLoading(true);
    setDistricts([]);
    fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ country: form.countryName }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error && Array.isArray(data.data) && data.data.length) {
          setDistricts(data.data);
        } else {
          setDistricts([]);
        }
      })
      .catch(() => setDistricts([]))
      .finally(() => setDistrictsLoading(false));
  }, [form.countryName]);

  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return districts;
    const q = districtSearch.toLowerCase();
    return districts.filter(d => d.toLowerCase().includes(q));
  }, [districts, districtSearch]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const searchResults = useMemo(() => {
    if (!countrySearch.trim()) return [];
    const q = countrySearch.toLowerCase();
    return Object.entries(COUNTRY_NAMES)
      .filter(([, v]) => v.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map(([id, v]) => ({ id, ...v }));
  }, [countrySearch]);

  const selectCountry = (c) => {
    set('countryCode',   c.id);
    set('countryName',   c.name);
    set('countryAlpha2', c.alpha2 || '');
    setCountrySearch('');
  };

  const clearCountry = () => {
    set('countryCode', ''); set('countryName', ''); set('countryAlpha2', '');
  };

  const addCheckItem = () => {
    if (!checkInput.trim()) return;
    set('checklist', [...form.checklist, { text: checkInput.trim(), done: false }]);
    setCheckInput('');
  };
  const toggleCheck     = (i) => set('checklist', form.checklist.map((it, idx) => idx === i ? { ...it, done: !it.done } : it));
  const removeCheckItem = (i) => set('checklist', form.checklist.filter((_, idx) => idx !== i));

  const confirmAddCity = () => {
    if (!pendingName.trim()) return;
    set('cities', [...form.cities, { name: pendingName.trim(), dateFrom: pendingFrom, dateTo: pendingTo }]);
    setAddingCity(false);
    setPendingName(''); setPendingFrom(''); setPendingTo('');
    setDistrictSearch('');
  };
  const removeCityStop = (i) => set('cities', form.cities.filter((_, idx) => idx !== i));

  const canSave = form.countryCode && form.dateFrom;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      let photoUrls = [];
      if (photos.length > 0) {
        if (photos.filter(p => p instanceof File).length > 0) setUploadMsg('Compressing photos…');
        const results = await Promise.all(
          photos.map(async (photo) => {
            if (typeof photo === 'string') return photo;
            try {
              const compressed = await compressImage(photo);
              return await uploadPhoto(compressed);
            } catch { return null; }
          })
        );
        photoUrls = results.filter(Boolean);
        setUploadMsg('');
      }
      await onSave({
        ...form,
        budget: form.budget ? Number(form.budget) : null,
        budgetCurrency: form.budget ? (form.budgetCurrency || 'USD') : null,
        photos: photoUrls,
      });
    } catch (err) {
      console.error('Save plan failed:', err);
      setSaving(false);
      setUploadMsg('');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.4)', pointerEvents: 'all' }} onClick={onClose} />

      {/* Sheet */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 430,
        background: T.card, borderTop: `2.5px solid ${T.border}`,
        borderRadius: '20px 20px 0 0', pointerEvents: 'all',
        maxHeight: 'min(92svh, 92vh)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(44,26,14,0.15)',
      }}>
        {/* Drag handle */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>

        {/* Sheet header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 12px', borderBottom: `1.5px solid ${T.border}` }}>
          <p style={{ margin: 0, color: T.text, fontWeight: 700, fontSize: 16, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {editPlan ? 'Edit Trip Plan' : 'New Trip Plan'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Scrollable form */}
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>

          {/* ── Country ── */}
          <div style={{ marginBottom: 16 }}>
            <label style={sheetLabel}>Destination *</label>
            {form.countryCode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                <FlagImg alpha2={form.countryAlpha2} size={18} />
                <span style={{ color: T.text, flex: 1, fontSize: 13 }}>{form.countryName}</span>
                <button onClick={clearCountry} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>✕</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="Search country…" value={countrySearch} onChange={e => setCountrySearch(e.target.value)} style={sheetInput} />
                {searchResults.length > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', zIndex: 10, boxShadow: '0 8px 24px rgba(44,26,14,0.14)' }}>
                    {searchResults.map(c => (
                      <button key={c.id} onClick={() => selectCountry(c)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left', color: T.text, fontSize: 13 }}>
                        <FlagImg alpha2={c.alpha2} size={16} />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── City Stops ── */}
          {form.countryCode && (
            <div style={{ marginBottom: 16 }}>
              <label style={sheetLabel}>City Stops</label>

              {form.cities.length > 0 && (
                <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                  {form.cities.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: i < form.cities.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <IcoMapPin size={13} color={T.navy} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: T.text, fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                        {(c.dateFrom || c.dateTo) && (
                          <p style={{ margin: '1px 0 0', color: T.text3, fontSize: 11 }}>
                            {formatDateRange(c.dateFrom, c.dateTo) || c.dateFrom}
                          </p>
                        )}
                      </div>
                      <button onClick={() => removeCityStop(i)} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 4px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {addingCity ? (
                <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
                  <p style={{ ...sheetLabel, marginBottom: 6 }}>City name</p>
                  {pendingName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, background: `${T.navy}15`, border: `1px solid ${T.navy}40`, borderRadius: 8, padding: '8px 10px' }}>
                      <IcoMapPin size={12} color={T.navy} />
                      <span style={{ flex: 1, color: T.navy, fontSize: 13, fontWeight: 600 }}>{pendingName}</span>
                      <button onClick={() => setPendingName('')} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 13 }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <input type="text" placeholder={districtsLoading ? 'Loading cities…' : 'Search or type a city…'}
                        value={districtSearch} onChange={e => setDistrictSearch(e.target.value)}
                        style={{ ...sheetInput, marginBottom: 6 }} disabled={districtsLoading} autoFocus />

                      {districtsLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                          <div style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.purple, animation: 'spin 0.7s linear infinite' }} />
                          <span style={{ color: T.text3, fontSize: 12 }}>Fetching cities…</span>
                        </div>
                      )}

                      {!districtsLoading && filteredDistricts.length > 0 && (
                        <div style={{ maxHeight: 160, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                          {filteredDistricts.map((d, i) => (
                            <button key={d} onClick={() => { setPendingName(d); setDistrictSearch(''); }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', background: 'transparent', border: 'none', borderBottom: i < filteredDistricts.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', textAlign: 'left', color: T.text, fontSize: 13 }}>
                              {d}
                            </button>
                          ))}
                        </div>
                      )}

                      {!districtsLoading && districtSearch.trim() && filteredDistricts.length === 0 && (
                        <button onClick={() => { setPendingName(districtSearch.trim()); setDistrictSearch(''); }}
                          style={{ width: '100%', padding: '9px 10px', background: 'transparent', border: `1.5px dashed ${T.border}`, borderRadius: 8, color: T.navy, fontSize: 13, cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}>
                          + Use "{districtSearch.trim()}"
                        </button>
                      )}
                    </>
                  )}

                  <p style={{ ...sheetLabel, marginTop: 8, marginBottom: 6 }}>Dates for this city <span style={{ fontWeight: 400, textTransform: 'none', color: T.text3 }}>(optional)</span></p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 11, color: T.text3, margin: '0 0 4px' }}>From</p>
                      <input type="date" value={pendingFrom} onChange={e => setPendingFrom(e.target.value)} style={sheetInput} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: T.text3, margin: '0 0 4px' }}>To</p>
                      <input type="date" value={pendingTo} onChange={e => setPendingTo(e.target.value)} min={pendingFrom || undefined} style={sheetInput} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setAddingCity(false); setPendingName(''); setPendingFrom(''); setPendingTo(''); setDistrictSearch(''); }}
                      style={{ flex: 1, padding: 10, borderRadius: 8, background: 'none', border: `1.5px solid ${T.border}`, color: T.text3, fontSize: 13, cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}>
                      Cancel
                    </button>
                    <button onClick={confirmAddCity} disabled={!pendingName.trim()}
                      style={{ flex: 2, padding: 10, borderRadius: 8, background: T.purple, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: pendingName.trim() ? 'pointer' : 'not-allowed', opacity: pendingName.trim() ? 1 : 0.5 }}>
                      Add City
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingCity(true)}
                  style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: `1.5px dashed ${T.border}`, borderRadius: 10, color: T.text3, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: "'Crimson Text', Georgia, serif" }}>
                  <span style={{ fontSize: 14 }}>+</span> Add City
                </button>
              )}
            </div>
          )}

          {/* ── Title ── */}
          <div style={{ marginBottom: 16 }}>
            <label style={sheetLabel}>Trip Title</label>
            <input type="text" placeholder="e.g. Cherry Blossom Season" value={form.title} onChange={e => set('title', e.target.value)} style={sheetInput} />
          </div>

          {/* ── Dates ── */}
          <div style={{ marginBottom: 16 }}>
            <label style={sheetLabel}>Travel Dates *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: T.text3, margin: '0 0 5px' }}>From</p>
                <input type="date" value={form.dateFrom} onChange={e => set('dateFrom', e.target.value)} style={sheetInput} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: T.text3, margin: '0 0 5px' }}>To</p>
                <input type="date" value={form.dateTo} onChange={e => set('dateTo', e.target.value)} min={form.dateFrom || undefined} style={sheetInput} />
              </div>
            </div>
          </div>

          {/* ── Status ── */}
          <div style={{ marginBottom: 16 }}>
            <label style={sheetLabel}>Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {Object.entries(PLAN_STATUS).map(([key, { label, color }]) => {
                const active = form.status === key;
                return (
                  <button key={key} onClick={() => set('status', key)}
                    style={{
                      padding: '9px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: active ? `2px solid ${color}` : `2px solid ${T.border}`,
                      background: active ? color + '20' : T.bg,
                      color: active ? color : T.text3,
                      transition: 'all 0.15s', fontFamily: "'Crimson Text', Georgia, serif",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Budget ── */}
          <div style={{ marginBottom: 16 }}>
            <label style={sheetLabel}>Planned Budget</label>
            <CurrencyBudgetField
              amount={form.budget}
              currency={form.budgetCurrency}
              onChange={(amt, curr) => setForm(f => ({ ...f, budget: amt, budgetCurrency: curr }))}
              inputBg={T.bg}
            />
          </div>

          {/* ── Notes ── */}
          <div style={{ marginBottom: 16 }}>
            <label style={sheetLabel}>Notes</label>
            <textarea placeholder="Must-see places, ideas, things to research…" value={form.notes}
              onChange={e => set('notes', e.target.value)} rows={3}
              style={{ ...sheetInput, resize: 'none' }} />
          </div>

          {/* ── Checklist ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={sheetLabel}>Checklist</label>

            {form.checklist.length > 0 && (
              <div style={{ marginBottom: 8, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                {form.checklist.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: i < form.checklist.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <button onClick={() => toggleCheck(i)}
                      style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: item.done ? T.purple : 'transparent', border: `2px solid ${item.done ? T.purple : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      {item.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </button>
                    <span style={{ flex: 1, fontSize: 13, color: item.done ? T.text3 : T.text2, textDecoration: item.done ? 'line-through' : 'none', fontFamily: "'Crimson Text', Georgia, serif" }}>
                      {item.text}
                    </span>
                    <button onClick={() => removeCheckItem(i)} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Add a checklist item…" value={checkInput}
                onChange={e => setCheckInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem(); } }}
                style={{ ...sheetInput, flex: 1 }} />
              <button onClick={addCheckItem}
                style={{ background: T.purple, border: 'none', borderRadius: 10, padding: '0 16px', color: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>
                +
              </button>
            </div>
          </div>

          {/* ── Photos ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={sheetLabel}>
              Photos <span style={{ fontWeight: 400, textTransform: 'none', color: T.text3 }}>(optional · max {MAX_PLAN_PHOTOS})</span>
            </label>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: previews.length > 0 ? 8 : 0 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 68, height: 68, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removePhoto(i)}
                    style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(44,26,14,0.7)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              ))}

              {photos.length < MAX_PLAN_PHOTOS && (
                <button onClick={() => photoFileRef.current?.click()}
                  style={{ width: 68, height: 68, borderRadius: 10, border: `2px dashed ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <span>📷</span>
                  <span style={{ fontSize: 10 }}>Add</span>
                </button>
              )}
            </div>

            {photos.length >= MAX_PLAN_PHOTOS && (
              <p style={{ color: T.gold, fontSize: 11, marginTop: 4 }}>
                Maximum {MAX_PLAN_PHOTOS} photos reached — remove one to add another.
              </p>
            )}

            <input ref={photoFileRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
          </div>

          {/* ── Save ── */}
          <button onClick={handleSave} disabled={!canSave || saving}
            style={{
              width: '100%', padding: 14, borderRadius: 12,
              background: (!canSave || saving) ? `${T.purple}50` : T.purple,
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: (!canSave || saving) ? 'not-allowed' : 'pointer',
              opacity: (!canSave || saving) ? 0.7 : 1,
              marginBottom: editPlan ? 10 : 0,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
            {saving ? (uploadMsg || 'Saving…') : (editPlan ? 'Update Plan' : 'Save Plan')}
          </button>

          {editPlan && (
            <button
              onClick={() => {
                if (confirmDelete) { onDelete(); }
                else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
              }}
              style={{
                width: '100%', padding: 12, borderRadius: 12,
                background: confirmDelete ? `${T.rose}12` : 'transparent',
                color: confirmDelete ? T.rose : T.text3,
                border: `1.5px dashed ${confirmDelete ? T.rose : T.border}`,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: "'Crimson Text', Georgia, serif",
              }}>
              {confirmDelete ? 'Tap again to confirm delete' : '✕  Delete Trip Plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FilterChip ────────────────────────────────────────────────────────────────

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        fontFamily: "'Crimson Text', Georgia, serif",
        border: `1.5px solid ${active ? T.purple + '60' : T.border}`,
        background: active ? `${T.purple}15` : 'none',
        color: active ? T.purple : T.text3,
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
