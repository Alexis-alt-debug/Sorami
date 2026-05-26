import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, Star, Search, Cloud, Users,
  Trash2, Pencil, Plus, Check, MapPin, Camera, X as XIcon,
} from 'lucide-react';
import CurrencyBudgetField, { formatBudget } from '../components/CurrencyBudgetField';
import { useTravel } from '../context/TravelContext';
import { getFlagEmoji, COUNTRY_NAMES } from '../data/countryNames';
import { format, parseISO } from 'date-fns';
import PhotoLightbox from '../components/PhotoLightbox';

const MAX_PLAN_PHOTOS = 4;

// Same compression as AddMemory — max 900px, 65% JPEG quality (~80-120 KB)
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
  { value: 'date-desc', label: '🕐 Latest' },
  { value: 'date-asc',  label: '🕙 Oldest' },
  { value: 'country',   label: '🌍 Country A→Z' },
];

const PLAN_STATUS = {
  planning:  { label: 'Planning',   color: '#94a3b8' },
  booked:    { label: 'Booked',     color: '#8b5cf6' },
  confirmed: { label: 'Confirmed',  color: '#22c55e' },
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
  // null = closed | 'new' = add sheet | {plan} = edit sheet
  const [planSheet, setPlanSheet] = useState(null);

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
    <div className="min-h-screen">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4">

        {/* Tab toggle */}
        <div className="flex gap-2 mb-3">
          {[
            { id: 'memories', label: '📖 Memories' },
            { id: 'plans',    label: '🗺️ Plans'    },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Memories header */}
        {activeTab === 'memories' && (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <h1 className="text-white font-bold text-xl">Travel Diary</h1>
              <span className="text-slate-500 text-xs">
                {loading ? 'Loading…' : `${memories.length} memor${memories.length === 1 ? 'y' : 'ies'}`}
              </span>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search countries, places, diary…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SORT_OPTIONS.map(opt => (
                <FilterChip key={opt.value} active={sortBy === opt.value} onClick={() => setSortBy(opt.value)}>
                  {opt.label}
                </FilterChip>
              ))}
              {years.length > 0 && (
                <>
                  <span className="w-px bg-slate-700 mx-1 self-stretch" />
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-xl">Trip Planner</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {tripPlans.length === 0 ? 'No plans yet' : `${tripPlans.length} upcoming trip${tripPlans.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => setPlanSheet('new')}
              className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Plan
            </button>
          </div>
        )}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'memories' ? (

        /* ── Memories content (unchanged) ── */
        <div className="p-4">
          {memoriesError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-red-400 text-sm font-medium mb-0.5">Could not load memories</p>
              <p className="text-red-400/70 text-xs">{memoriesError}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center pt-12">
              <div className="w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>

          ) : memories.length === 0 ? (
            <div className="text-center pt-16 px-4">
              <p className="text-4xl mb-3">📖</p>
              <p className="text-white font-semibold mb-1">No memories saved yet</p>
              <p className="text-slate-400 text-sm">
                Go to the Map, tap a country, then tap ＋ to add your first memory.
              </p>
            </div>

          ) : filtered.length === 0 ? (
            <div className="text-center pt-12">
              <p className="text-2xl mb-3">🔍</p>
              <p className="text-white font-semibold mb-1">No results for "{search}"</p>
              <p className="text-slate-400 text-sm mb-4">
                {memories.length} memor{memories.length === 1 ? 'y' : 'ies'} saved — try clearing the search.
              </p>
              <button
                onClick={() => setSearch('')}
                className="bg-violet-500/20 text-violet-400 border border-violet-500/30 px-4 py-2 rounded-xl text-sm"
              >
                Clear search
              </button>
            </div>

          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([groupLabel, mems]) => (
                <div key={groupLabel}>
                  <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    {groupLabel}
                  </h2>
                  <div className="space-y-3">
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

        /* ── Plans content ── */
        <div className="p-4">
          {tripPlans.length === 0 ? (
            <div className="text-center pt-16 px-4">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-white font-semibold mb-1">No trips planned yet</p>
              <p className="text-slate-400 text-sm mb-5">
                Add a future trip — country, dates, budget, and a checklist of things to do.
              </p>
              <button
                onClick={() => setPlanSheet('new')}
                className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Plan My First Trip
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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
    </div>
  );
}

// ── DiaryCard ─────────────────────────────────────────────────────────────────

function DiaryCard({ memory, onDelete }) {
  const navigate = useNavigate();
  const flag = getFlagEmoji(memory.countryAlpha2 || '');
  const dateStr = formatDateRange(memory.date, memory.dateTo);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox,      setLightbox]      = useState(null); // { index: number } | null

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">

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

      {/* Tappable body → go to country page */}
      <div
        className="cursor-pointer active:opacity-80 transition-opacity"
        onClick={() => navigate(`/country/${memory.countryCode}`, {
          state: { name: memory.countryName, alpha2: memory.countryAlpha2 || '' }
        })}
      >
        {/* Photo strip — each photo opens lightbox on tap */}
        {memory.photos?.length > 0 && (
          <div className="flex gap-0.5 h-36 overflow-hidden">
            {memory.photos.slice(0, 4).map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={e => { e.stopPropagation(); setLightbox({ index: i }); }}
                className="flex-1 min-w-0 overflow-hidden focus:outline-none"
                style={{ padding: 0, background: 'none', border: 'none', cursor: 'zoom-in' }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-4">
          {/* Country + date + rating */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0">{flag || '🌍'}</span>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight">{memory.countryName}</p>
                {memory.region && (
                  <p className="text-violet-400 text-xs mt-0.5">{memory.region}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
              {dateStr && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />{dateStr}
                </span>
              )}
              {memory.rating > 0 && (
                <span className="flex items-center gap-0.5 text-yellow-400">
                  {Array.from({ length: memory.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* Weather + budget */}
          {(memory.weather || memory.budget > 0) && (
            <div className="flex gap-3 mb-2 flex-wrap">
              {memory.weather && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Cloud className="w-3 h-3" />{memory.weather}
                </span>
              )}
              {memory.budget > 0 && (
                <span className="text-xs text-slate-400">
                  💰 {formatBudget(memory.budget, memory.budgetCurrency)}
                </span>
              )}
            </div>
          )}

          {/* Partners */}
          {memory.partners?.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-400">{memory.partners.join(', ')}</span>
            </div>
          )}

          {/* Diary text */}
          {memory.diary ? (
            <div className="mt-2 pt-2 border-t border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Diary</p>
              <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: '1.65', margin: 0 }}>
                {memory.diary}
              </p>
            </div>
          ) : (
            <p className="text-slate-600 text-xs italic mt-2">No diary entry.</p>
          )}

          {/* Tags */}
          {memory.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {memory.tags.map(t => (
                <span key={t} className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="px-4 pb-3 pt-1 border-t border-slate-700/50 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/country/${memory.countryCode}/add`, {
              state: { name: memory.countryName, alpha2: memory.countryAlpha2 || '', memory },
            });
          }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-slate-500 hover:text-violet-400 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>

        <button
          onClick={handleDelete}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all ${
            confirmDelete
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'text-slate-600 hover:text-red-400'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {confirmDelete ? 'Tap again to confirm' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ── TripPlanCard ──────────────────────────────────────────────────────────────

function TripPlanCard({ plan, onEdit, onDelete, onToggleCheck }) {
  const navigate = useNavigate();
  const flag     = getFlagEmoji(plan.countryAlpha2 || '');
  const dateStr  = formatDateRange(plan.dateFrom, plan.dateTo);
  const days     = daysUntil(plan.dateFrom);
  const { label: statusLabel, color: statusColor } =
    PLAN_STATUS[plan.status] || PLAN_STATUS.planning;

  const checklist   = plan.checklist || [];
  const doneCount   = checklist.filter(i => i.done).length;
  const totalCount  = checklist.length;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // "In X days" colour: ≤7 red, ≤30 orange, else violet
  const daysColor =
    days === null   ? null :
    days === 0      ? '#facc15' :
    days < 0        ? '#475569' :
    days <= 7       ? '#f87171' :
    days <= 30      ? '#fb923c' : '#a78bfa';

  const daysLabel =
    days === null ? null :
    days === 0    ? 'Today!' :
    days < 0      ? 'Past trip' :
    days === 1    ? 'Tomorrow' :
                    `In ${days} days`;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">

      {/* Photo lightbox */}
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

      {/* Photo strip — tap to zoom */}
      {plan.photos?.length > 0 && (
        <div className="flex gap-0.5 h-36 overflow-hidden">
          {plan.photos.slice(0, 4).map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightbox({ index: i })}
              className="flex-1 min-w-0 overflow-hidden focus:outline-none"
              style={{ padding: 0, background: 'none', border: 'none', cursor: 'zoom-in' }}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="p-4">

        {/* Top row: flag + name + status badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{flag || '🌍'}</span>
            <div className="min-w-0">
              <button
                onClick={() => navigate(`/country/${plan.countryCode}`, {
                  state: { name: plan.countryName, alpha2: plan.countryAlpha2 || '' },
                })}
                className="text-white font-bold text-sm hover:text-violet-400 transition-colors text-left"
              >
                {plan.countryName}
              </button>
              {plan.title && (
                <p className="text-slate-400 text-xs mt-0.5 truncate">{plan.title}</p>
              )}
              {plan.cities?.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {plan.cities.map((c, i) => (
                    <span key={i} className="flex items-center gap-1 text-violet-500/80 text-xs">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
            style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Date + days-until */}
        {(dateStr || daysLabel) && (
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {dateStr && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />{dateStr}
              </span>
            )}
            {daysLabel && (
              <span className="text-xs font-semibold" style={{ color: daysColor }}>
                {daysLabel}
              </span>
            )}
          </div>
        )}

        {/* Budget */}
        {plan.budget > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
            <span>💰 Budget: {formatBudget(plan.budget, plan.budgetCurrency)}</span>
          </div>
        )}

        {/* City itinerary */}
        {plan.cities?.length > 0 && (
          <div className="mb-3 bg-slate-900/60 rounded-xl overflow-hidden">
            {plan.cities.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2" style={{ borderBottom: i < plan.cities.length - 1 ? '1px solid #1e293b' : 'none' }}>
                <MapPin className="w-3 h-3 text-violet-500 flex-shrink-0" />
                <span className="text-slate-200 text-xs font-semibold flex-1">{c.name}</span>
                {(c.dateFrom || c.dateTo) && (
                  <span className="text-slate-500 text-xs">{formatDateRange(c.dateFrom, c.dateTo) || c.dateFrom}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes preview */}
        {plan.notes && (
          <p className="text-slate-400 text-xs leading-relaxed mb-3"
             style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {plan.notes}
          </p>
        )}

        {/* Checklist */}
        {totalCount > 0 && (
          <div className="mt-1 bg-slate-900/60 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Checklist</span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: doneCount === totalCount ? '#22c55e' : '#94a3b8' }}
              >
                {doneCount === totalCount ? '✓ All done' : `${doneCount} / ${totalCount} done`}
              </span>
            </div>
            <div className="space-y-1.5">
              {checklist.slice(0, 4).map((item, i) => (
                <button
                  key={i}
                  onClick={() => onToggleCheck(i)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      background: item.done ? '#8b5cf6' : 'transparent',
                      border: `2px solid ${item.done ? '#8b5cf6' : '#475569'}`,
                    }}
                  >
                    {item.done && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      color: item.done ? '#475569' : '#cbd5e1',
                      textDecoration: item.done ? 'line-through' : 'none',
                    }}
                  >
                    {item.text}
                  </span>
                </button>
              ))}
              {totalCount > 4 && (
                <p className="text-[10px] text-slate-500 ml-6">+ {totalCount - 4} more — tap Edit to see all</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="px-4 pb-3 border-t border-slate-700/50 flex items-center justify-between">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-slate-500 hover:text-violet-400 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={() => {
            if (confirmDelete) { onDelete(); }
            else {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 3000);
            }
          }}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all ${
            confirmDelete
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'text-slate-600 hover:text-red-400'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {confirmDelete ? 'Tap again to confirm' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ── AddPlanSheet ──────────────────────────────────────────────────────────────

const sheetInput = {
  width: '100%',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 12,
  padding: '11px 14px',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
};

const sheetLabel = {
  fontSize: 11,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 600,
  display: 'block',
  marginBottom: 8,
};

function AddPlanSheet({ editPlan, onClose, onSave, onDelete }) {
  const { uploadPhoto } = useTravel();

  const [form, setForm] = useState({
    countryCode:   editPlan?.countryCode   || '',
    countryName:   editPlan?.countryName   || '',
    countryAlpha2: editPlan?.countryAlpha2 || '',
    title:         editPlan?.title         || '',
    dateFrom:      editPlan?.dateFrom      || '',
    dateTo:        editPlan?.dateTo        || '',
    cities:        editPlan?.cities        || [],
    notes:         editPlan?.notes         || '',
    budget:         editPlan?.budget != null ? String(editPlan.budget) : '',
    budgetCurrency: editPlan?.budgetCurrency || 'USD',
    status:         editPlan?.status        || 'planning',
    checklist:     editPlan?.checklist     || [],
  });

  // ── Photos ──────────────────────────────────────────────────────────────────
  const [photos,    setPh]       = useState(editPlan?.photos   || []);
  const [previews,  setPrev]     = useState(editPlan?.photos   || []);
  const [uploadMsg, setUploadMsg]= useState('');
  const photoFileRef = useRef();

  const handlePhotos = (e) => {
    const incoming = Array.from(e.target.files);
    e.target.value = '';
    const slots = MAX_PLAN_PHOTOS - photos.length;
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

  const [countrySearch,    setCountrySearch]    = useState('');
  const [checkInput,       setCheckInput]       = useState('');
  const [saving,           setSaving]           = useState(false);
  const [confirmDelete,    setConfirmDelete]    = useState(false);

  // ── City stops — "add city" inline form ────────────────────────────────────
  const [addingCity,   setAddingCity]   = useState(false);
  const [pendingName,  setPendingName]  = useState('');
  const [pendingFrom,  setPendingFrom]  = useState('');
  const [pendingTo,    setPendingTo]    = useState('');

  // ── District state ──────────────────────────────────────────────────────────
  const [districts,        setDistricts]        = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [districtSearch,   setDistrictSearch]   = useState('');

  // Fetch states/provinces whenever the selected country changes
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

  // Filter districts by what the user types
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return districts;
    const q = districtSearch.toLowerCase();
    return districts.filter(d => d.toLowerCase().includes(q));
  }, [districts, districtSearch]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Country search results
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

  // Checklist
  const addCheckItem = () => {
    if (!checkInput.trim()) return;
    set('checklist', [...form.checklist, { text: checkInput.trim(), done: false }]);
    setCheckInput('');
  };
  const toggleCheck    = (i) => set('checklist', form.checklist.map((it, idx) => idx === i ? { ...it, done: !it.done } : it));
  const removeCheckItem = (i) => set('checklist', form.checklist.filter((_, idx) => idx !== i));

  // City stops
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
      // Compress & upload any new photo files
      let photoUrls = [];
      if (photos.length > 0) {
        const newFiles = photos.filter(p => p instanceof File);
        if (newFiles.length > 0) setUploadMsg('Compressing photos…');
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
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'all' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 430,
        background: '#1e293b', borderTop: '1px solid #334155',
        borderRadius: '20px 20px 0 0', pointerEvents: 'all',
        maxHeight: 'min(92svh, 92vh)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Drag handle */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#475569' }} />
        </div>

        {/* Sheet header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 12px', borderBottom: '1px solid #334155' }}>
          <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>
            {editPlan ? 'Edit Trip Plan' : 'New Trip Plan'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>✕</button>
        </div>

        {/* Scrollable form */}
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>

          {/* ── Country ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={sheetLabel}>Destination *</label>
            {form.countryCode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '11px 14px' }}>
                <span style={{ fontSize: 20 }}>{getFlagEmoji(form.countryAlpha2)}</span>
                <span style={{ color: '#e2e8f0', flex: 1, fontSize: 14 }}>{form.countryName}</span>
                <button onClick={clearCountry} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search country…"
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  style={sheetInput}
                />
                {searchResults.length > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, background: '#0f172a', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden', zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    {searchResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => selectCountry(c)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #1e293b', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <span style={{ fontSize: 18 }}>{getFlagEmoji(c.alpha2)}</span>
                        <span style={{ color: '#e2e8f0', fontSize: 13 }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── City Stops ── */}
          {form.countryCode && (
            <div style={{ marginBottom: 18 }}>
              <label style={sheetLabel}>City Stops</label>

              {/* Already-added cities */}
              {form.cities.length > 0 && (
                <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
                  {form.cities.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < form.cities.length - 1 ? '1px solid #1e293b' : 'none' }}>
                      <MapPin size={14} color="#a78bfa" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                        {(c.dateFrom || c.dateTo) && (
                          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 11 }}>
                            {formatDateRange(c.dateFrom, c.dateTo) || c.dateFrom}
                          </p>
                        )}
                      </div>
                      <button onClick={() => removeCityStop(i)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline "add city" form */}
              {addingCity ? (
                <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '14px' }}>

                  {/* City name row */}
                  <p style={{ ...sheetLabel, marginBottom: 8 }}>City name</p>
                  {pendingName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 10, padding: '9px 12px' }}>
                      <MapPin size={13} color="#a78bfa" />
                      <span style={{ flex: 1, color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>{pendingName}</span>
                      <button onClick={() => { setPendingName(''); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder={districtsLoading ? 'Loading cities…' : 'Search or type a city…'}
                        value={districtSearch}
                        onChange={e => setDistrictSearch(e.target.value)}
                        style={{ ...sheetInput, marginBottom: 6 }}
                        disabled={districtsLoading}
                        autoFocus
                      />

                      {/* Loading */}
                      {districtsLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #334155', borderTopColor: '#8b5cf6', animation: 'spin 0.7s linear infinite' }} />
                          <span style={{ color: '#475569', fontSize: 12 }}>Fetching cities…</span>
                        </div>
                      )}

                      {/* City list */}
                      {!districtsLoading && filteredDistricts.length > 0 && (
                        <div style={{ maxHeight: 180, overflowY: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #1e293b', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                          {filteredDistricts.map((d, i) => (
                            <button
                              key={d}
                              onClick={() => { setPendingName(d); setDistrictSearch(''); }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: i < filteredDistricts.length - 1 ? '1px solid #1e293b' : 'none', cursor: 'pointer', textAlign: 'left' }}
                            >
                              <span style={{ fontSize: 13, color: '#cbd5e1' }}>{d}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Custom city fallback */}
                      {!districtsLoading && districtSearch.trim() && filteredDistricts.length === 0 && (
                        <button
                          onClick={() => { setPendingName(districtSearch.trim()); setDistrictSearch(''); }}
                          style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: '1px dashed #334155', borderRadius: 10, color: '#a78bfa', fontSize: 13, cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}
                        >
                          + Use "{districtSearch.trim()}"
                        </button>
                      )}
                    </>
                  )}

                  {/* Date range for this city */}
                  <p style={{ ...sheetLabel, marginBottom: 8 }}>Dates for this city <span style={{ fontWeight: 400, textTransform: 'none', color: '#475569' }}>(optional)</span></p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 5, marginTop: 0 }}>From</p>
                      <input type="date" value={pendingFrom} onChange={e => setPendingFrom(e.target.value)} style={sheetInput} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 5, marginTop: 0 }}>To</p>
                      <input type="date" value={pendingTo} onChange={e => setPendingTo(e.target.value)} min={pendingFrom || undefined} style={sheetInput} />
                    </div>
                  </div>

                  {/* Confirm / Cancel row */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setAddingCity(false); setPendingName(''); setPendingFrom(''); setPendingTo(''); setDistrictSearch(''); }}
                      style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'transparent', border: '1px solid #334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmAddCity}
                      disabled={!pendingName.trim()}
                      style={{ flex: 2, padding: '11px', borderRadius: 10, background: pendingName.trim() ? '#8b5cf6' : '#164e63', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: pendingName.trim() ? 'pointer' : 'not-allowed', opacity: pendingName.trim() ? 1 : 0.5 }}
                    >
                      Add City
                    </button>
                  </div>
                </div>
              ) : (
                /* "+" button to open the inline form */
                <button
                  onClick={() => setAddingCity(true)}
                  style={{ width: '100%', padding: '11px 14px', background: 'transparent', border: '1.5px dashed #334155', borderRadius: 12, color: '#64748b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <span style={{ fontSize: 16 }}>+</span> Add City
                </button>
              )}
            </div>
          )}

          {/* ── Title ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={sheetLabel}>Trip Title</label>
            <input
              type="text"
              placeholder="e.g. Cherry Blossom Season"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              style={sheetInput}
            />
          </div>

          {/* ── Dates ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={sheetLabel}>Travel Dates *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6, marginTop: 0 }}>From</p>
                <input type="date" value={form.dateFrom} onChange={e => set('dateFrom', e.target.value)} style={sheetInput} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6, marginTop: 0 }}>To</p>
                <input type="date" value={form.dateTo} onChange={e => set('dateTo', e.target.value)} min={form.dateFrom || undefined} style={sheetInput} />
              </div>
            </div>
          </div>

          {/* ── Status ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={sheetLabel}>Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {Object.entries(PLAN_STATUS).map(([key, { label, color }]) => {
                const active = form.status === key;
                return (
                  <button
                    key={key}
                    onClick={() => set('status', key)}
                    style={{
                      padding: '10px 6px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      border: active ? `2px solid ${color}` : '2px solid #334155',
                      background: active ? color + '22' : '#0f172a',
                      color: active ? color : '#94a3b8',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Budget ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={sheetLabel}>Planned Budget</label>
            <CurrencyBudgetField
              amount={form.budget}
              currency={form.budgetCurrency}
              onChange={(amt, curr) => setForm(f => ({ ...f, budget: amt, budgetCurrency: curr }))}
              inputBg="#0f172a"
            />
          </div>

          {/* ── Notes ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={sheetLabel}>Notes</label>
            <textarea
              placeholder="Must-see places, ideas, things to research…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              style={{ ...sheetInput, resize: 'none' }}
            />
          </div>

          {/* ── Checklist ── */}
          <div style={{ marginBottom: 24 }}>
            <label style={sheetLabel}>Checklist</label>

            {form.checklist.length > 0 && (
              <div style={{ marginBottom: 10, background: '#0f172a', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
                {form.checklist.map((item, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < form.checklist.length - 1 ? '1px solid #1e293b' : 'none' }}
                  >
                    <button
                      onClick={() => toggleCheck(i)}
                      style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                        background: item.done ? '#8b5cf6' : 'transparent',
                        border: `2px solid ${item.done ? '#8b5cf6' : '#475569'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}
                    >
                      {item.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </button>
                    <span style={{
                      flex: 1, fontSize: 13,
                      color: item.done ? '#475569' : '#cbd5e1',
                      textDecoration: item.done ? 'line-through' : 'none',
                    }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeCheckItem(i)}
                      style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 15, padding: '0 4px', lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add item row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Add a checklist item…"
                value={checkInput}
                onChange={e => setCheckInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem(); } }}
                style={{ ...sheetInput, flex: 1 }}
              />
              <button
                onClick={addCheckItem}
                style={{ background: '#0e7490', border: 'none', borderRadius: 10, padding: '0 16px', color: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}
              >
                +
              </button>
            </div>
          </div>

          {/* ── Photos ── */}
          <div style={{ marginBottom: 24 }}>
            <label style={sheetLabel}>
              Photos <span style={{ fontWeight: 400, textTransform: 'none', color: '#475569' }}>(optional · max {MAX_PLAN_PHOTOS})</span>
            </label>

            {/* Preview grid */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: previews.length > 0 ? 10 : 0 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removePhoto(i)}
                    style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', border: 'none',
                      color: '#fff', cursor: 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                </div>
              ))}

              {/* Add button */}
              {photos.length < MAX_PLAN_PHOTOS && (
                <button
                  onClick={() => photoFileRef.current?.click()}
                  style={{
                    width: 72, height: 72, borderRadius: 10,
                    border: '2px dashed #334155', background: 'transparent',
                    color: '#475569', cursor: 'pointer', fontSize: 22,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  }}
                >
                  <span>📷</span>
                  <span style={{ fontSize: 10 }}>Add</span>
                </button>
              )}
            </div>

            {photos.length >= MAX_PLAN_PHOTOS && (
              <p style={{ color: '#f59e0b', fontSize: 11, marginTop: 4 }}>
                Maximum {MAX_PLAN_PHOTOS} photos reached — remove one to add another.
              </p>
            )}

            <input ref={photoFileRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
          </div>

          {/* ── Save ── */}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              width: '100%', padding: '16px', borderRadius: 14,
              background: (!canSave || saving) ? '#164e63' : '#8b5cf6',
              color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
              cursor: (!canSave || saving) ? 'not-allowed' : 'pointer',
              opacity: (!canSave || saving) ? 0.6 : 1,
              marginBottom: editPlan ? 12 : 0,
            }}
          >
            {saving ? (uploadMsg || 'Saving…') : (editPlan ? 'Update Plan' : 'Save Plan')}
          </button>

          {/* ── Delete (edit mode only) ── */}
          {editPlan && (
            <button
              onClick={() => {
                if (confirmDelete) { onDelete(); }
                else {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                }
              }}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                background: confirmDelete ? 'rgba(239,68,68,0.12)' : 'transparent',
                color: confirmDelete ? '#f87171' : '#94a3b8',
                border: `1.5px dashed ${confirmDelete ? '#ef4444' : '#475569'}`,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
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
      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
        active
          ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
      }`}
    >
      {children}
    </button>
  );
}
