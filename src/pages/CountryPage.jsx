import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Star, Trash2, Pencil, BookOpen, Cloud, Users } from 'lucide-react';
import { formatBudget } from '../components/CurrencyBudgetField';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo, getFlagEmoji } from '../data/countryNames';
import { format, parseISO } from 'date-fns';
import PhotoLightbox from '../components/PhotoLightbox';

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

const STATUS_LABELS = {
  visited:    'Visited',
  bucketList: 'Bucket List',
  current:    'Traveling',
};

export default function CountryPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { memories, countryStatuses, setCountryStatus, deleteMemory, statusColors } = useTravel();

  const info = location.state || getCountryInfo(code);
  const countryName = info.name || `Country ${code}`;
  const flag = getFlagEmoji(info.alpha2);
  const status = countryStatuses[code]?.status;
  const countryMemories = memories.filter(m => m.countryCode === code);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-2xl">{flag}</span>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg leading-tight">{countryName}</h1>
          {status && (
            <span
              className="text-xs font-medium"
              style={{ color: statusColors[status] }}
            >
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>
        {/* Diary button */}
        <button
          onClick={() => navigate('/diary', { state: { search: countryName } })}
          className="flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium px-3 py-2 rounded-xl hover:bg-violet-500/25 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Diary
        </button>

        {/* Add memory button */}
        <Link
          to={`/country/${code}/add`}
          state={info}
          className="w-9 h-9 bg-violet-500 hover:bg-violet-400 rounded-xl flex items-center justify-center transition-colors"
        >
          <Plus className="w-5 h-5 text-white" />
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {/* Status selector */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Travel Status</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCountryStatus(code, key)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all text-left ${
                  status === key ? 'text-white' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-500'
                }`}
                style={status === key ? {
                  background: statusColors[key] + '25',
                  borderColor: statusColors[key] + '70',
                  color: statusColors[key],
                } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block mr-2"
                  style={{ background: statusColors[key] }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Memories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold">Memories ({countryMemories.length})</p>
              <p className="text-slate-500 text-xs mt-0.5">Tap a card to view full diary entry</p>
            </div>
            <Link
              to={`/country/${code}/add`}
              state={info}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              + Add Memory
            </Link>
          </div>

          {countryMemories.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-2xl p-8 text-center">
              <p className="text-slate-500 text-sm mb-3">No memories yet</p>
              <Link
                to={`/country/${code}/add`}
                state={info}
                className="inline-flex items-center gap-1.5 bg-violet-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-violet-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add First Memory
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {countryMemories.map(memory => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onDelete={() => deleteMemory(memory.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemoryCard({ memory, onDelete }) {
  const navigate = useNavigate();
  const dateStr = formatDateRange(memory.date, memory.dateTo);
  const [lightbox, setLightbox] = useState(null);

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

      {/* Tappable area → opens Diary filtered to this country */}
      <div
        className="cursor-pointer active:opacity-80 transition-opacity"
        onClick={() => navigate('/diary', { state: { search: memory.countryName } })}
      >
        {/* Photos strip — tap any photo to zoom */}
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
          {/* Date + rating row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-2">
            {memory.region && (
              <span className="text-violet-400 font-semibold">{memory.region}</span>
            )}
            {dateStr && (
              <span className="flex items-center gap-1">
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
            {memory.weather && (
              <span className="flex items-center gap-1"><Cloud className="w-3 h-3" />{memory.weather}</span>
            )}
            {memory.budget > 0 && (
              <span>💰 {formatBudget(memory.budget, memory.budgetCurrency)}</span>
            )}
          </div>

          {/* Travel partners */}
          {memory.partners?.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-400">{memory.partners.join(', ')}</span>
            </div>
          )}

          {/* Diary text */}
          {memory.diary ? (
            <div className="mt-1 pt-2 border-t border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Diary</p>
              <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: '1.65', margin: 0 }}>
                {memory.diary}
              </p>
            </div>
          ) : (
            <p className="text-slate-600 text-xs italic">No diary entry written.</p>
          )}

          {/* Tags */}
          {memory.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {memory.tags.map(tag => (
                <span key={tag} className="text-[11px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Diary hint */}
          <div className="flex items-center gap-1 mt-3 text-violet-400">
            <BookOpen className="w-3 h-3" />
            <span className="text-[11px]">View in Diary</span>
          </div>
        </div>
      </div>

      {/* Action row — Edit + Delete, separate so neither triggers navigation */}
      <div className="px-4 pb-3 flex items-center justify-between border-t border-slate-700/50">
        {/* Edit */}
        <button
          onClick={() => navigate(`/country/${memory.countryCode}/add`, {
            state: {
              name:   memory.countryName,
              alpha2: memory.countryAlpha2 || '',
              memory,
            },
          })}
          className="flex items-center gap-1.5 text-slate-500 hover:text-violet-400 transition-colors text-xs py-1.5 px-2"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-slate-600 hover:text-red-400 transition-colors text-xs py-1.5 px-2"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
