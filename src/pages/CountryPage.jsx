import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { IcoArrowLeft, IcoPlus, IcoCalendar, IcoStar, IcoTrash, IcoPencil, IcoBook, IcoUsers, IcoCoin, IcoFlower, IcoSun, IcoMapleLeaf, IcoSnowflake } from '../components/VintageIcons';
import { formatBudget } from '../components/CurrencyBudgetField';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo } from '../data/countryNames';
import FlagImg from '../components/FlagImg';
import { format, parseISO } from 'date-fns';
import PhotoLightbox from '../components/PhotoLightbox';

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

function SeasonIcon({ season, size = 10, color = '#a89070' }) {
  switch ((season || '').toLowerCase()) {
    case 'spring': return <IcoFlower    size={size} color={color} />;
    case 'summer': return <IcoSun       size={size} color={color} />;
    case 'autumn': return <IcoMapleLeaf size={size} color={color} />;
    case 'winter': return <IcoSnowflake size={size} color={color} />;
    default:       return null;
  }
}

const STATUS_COLORS = {
  visited:    T.rose,
  bucketList: T.navy,
  current:    T.gold,
};

export default function CountryPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { memories, countryStatuses, setCountryStatus, deleteMemory, statusColors } = useTravel();

  const info = location.state || getCountryInfo(code);
  const countryName = info.name || `Country ${code}`;
  const status = countryStatuses[code]?.status;
  const countryMemories = memories.filter(m => m.countryCode === code);

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: T.card, borderBottom: `2px solid ${T.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <IcoArrowLeft size={18} color={T.text3} />
        </button>
        <FlagImg alpha2={info.alpha2} size={24} />
        <div style={{ flex: 1 }}>
          <h1 style={{ color: T.text, fontWeight: 700, fontSize: 17, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>{countryName}</h1>
          {status && (
            <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLORS[status] || statusColors[status] }}>
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/diary', { state: { search: countryName } })}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${T.purple}15`, border: `1.5px solid ${T.purple}40`, color: T.purple, fontSize: 11, fontWeight: 600, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif" }}
        >
          <IcoBook size={13} color={T.purple} /> Diary
        </button>
        <Link
          to={`/country/${code}/add`}
          state={info}
          style={{ width: 34, height: 34, background: T.purple, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
        >
          <IcoPlus size={18} color="#fff" />
        </Link>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Status selector */}
        <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
          <p style={{ color: T.text3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px', fontFamily: "'Crimson Text', Georgia, serif" }}>
            Travel Status
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const isActive = status === key;
              const color = STATUS_COLORS[key] || statusColors[key];
              return (
                <button
                  key={key}
                  onClick={() => setCountryStatus(code, key)}
                  style={{
                    padding: '10px 10px', borderRadius: 10, fontSize: 12, fontWeight: isActive ? 700 : 500,
                    border: isActive ? `2px solid ${color}` : `2px solid ${T.border}`,
                    background: isActive ? color + '18' : T.bg,
                    color: isActive ? color : T.text3,
                    cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s', fontFamily: "'Crimson Text', Georgia, serif",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Memories */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <p style={{ color: T.text, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                Memories ({countryMemories.length})
              </p>
              <p style={{ color: T.text3, fontSize: 11, margin: '2px 0 0' }}>Tap a card to view full diary entry</p>
            </div>
            <Link to={`/country/${code}/add`} state={info}
              style={{ fontSize: 12, color: T.purple, textDecoration: 'none', fontFamily: "'Crimson Text', Georgia, serif" }}>
              + Add Memory
            </Link>
          </div>

          {countryMemories.length === 0 ? (
            <div style={{ background: `${T.border}20`, border: `1.5px dashed ${T.border}`, borderRadius: 14, padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ color: T.text3, fontSize: 13, margin: '0 0 12px' }}>No memories yet</p>
              <Link to={`/country/${code}/add`} state={info}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.purple, color: '#fff', textDecoration: 'none', fontSize: 13, padding: '8px 16px', borderRadius: 10, fontFamily: "'Crimson Text', Georgia, serif" }}>
                <IcoPlus size={14} color="#fff" /> Add First Memory
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {countryMemories.map(memory => (
                <MemoryCard key={memory.id} memory={memory} onDelete={() => deleteMemory(memory.id)} />
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
    <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
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

      <div style={{ cursor: 'pointer' }} onClick={() => navigate('/diary', { state: { search: memory.countryName } })}>
        {memory.photos?.length > 0 && (
          <div style={{ display: 'flex', gap: 2, height: 130, overflow: 'hidden' }}>
            {memory.photos.slice(0, 4).map((url, i) => (
              <button key={i} type="button" onClick={e => { e.stopPropagation(); setLightbox({ index: i }); }}
                style={{ flex: 1, minWidth: 0, overflow: 'hidden', padding: 0, background: 'none', border: 'none', cursor: 'zoom-in' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 11, color: T.text3, marginBottom: 8 }}>
            {memory.region && <span style={{ color: T.navy, fontWeight: 700 }}>{memory.region}</span>}
            {dateStr && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IcoCalendar size={10} color={T.text3} />{dateStr}</span>}
            {memory.rating > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: T.gold }}>
                {Array.from({ length: memory.rating }).map((_, i) => <IcoStar key={i} size={10} color={T.gold} filled />)}
              </span>
            )}
            {(memory.season || memory.weather) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <SeasonIcon season={memory.season || memory.weather} size={10} color={T.text3} />
                <span style={{ fontSize: 11, color: T.text3 }}>{memory.season || memory.weather}</span>
              </span>
            )}
            {memory.budget > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IcoCoin size={10} color={T.gold} />{formatBudget(memory.budget, memory.budgetCurrency)}</span>}
          </div>

          {memory.partners?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <IcoUsers size={11} color={T.text3} />
              <span style={{ fontSize: 11, color: T.text3 }}>{memory.partners.join(', ')}</span>
            </div>
          )}

          {memory.diary ? (
            <div style={{ marginTop: 4, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 4px', fontFamily: "'Crimson Text', Georgia, serif" }}>Diary</p>
              <p style={{ color: T.text2, fontSize: 13, lineHeight: 1.65, margin: 0, fontFamily: "'Crimson Text', Georgia, serif" }}>{memory.diary}</p>
            </div>
          ) : (
            <p style={{ color: T.text3, fontSize: 11, fontStyle: 'italic' }}>No diary entry written.</p>
          )}

          {memory.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {memory.tags.map(tag => (
                <span key={tag} style={{ fontSize: 10, background: `${T.navy}14`, color: T.navy, border: `1px solid ${T.navy}30`, padding: '2px 8px', borderRadius: 20 }}>#{tag}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, color: T.navy }}>
            <IcoBook size={11} color={T.navy} />
            <span style={{ fontSize: 11 }}>View in Diary</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={() => navigate(`/country/${memory.countryCode}/add`, { state: { name: memory.countryName, alpha2: memory.countryAlpha2 || '', memory } })}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.text3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'Crimson Text', Georgia, serif" }}
        >
          <IcoPencil size={12} color={T.text3} /> Edit
        </button>
        <button
          onClick={onDelete}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.text3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'Crimson Text', Georgia, serif" }}
        >
          <IcoTrash size={12} color={T.text3} /> Delete
        </button>
      </div>
    </div>
  );
}
