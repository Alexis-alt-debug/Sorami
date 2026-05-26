import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IcoArrowLeft, IcoGlobe, IcoBook, IcoCamera, IcoUsers, IcoTag, IcoStar, IcoCoin } from '../components/VintageIcons';
import { useTravel } from '../context/TravelContext';
import { COUNTRY_NAMES } from '../data/countryNames';
import FlagImg from '../components/FlagImg';
import { ALPHA2_CONTINENT, CONTINENT_META, CONTINENT_ORDER } from '../data/continents';

const TOTAL_COUNTRIES = 195;

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

export default function Stats() {
  const navigate = useNavigate();
  const { memories, countryStatuses, stats, statusColors, profile } = useTravel();

  const data = useMemo(() => {
    const pct = ((stats.visited / TOTAL_COUNTRIES) * 100).toFixed(1);
    const totalPhotos = memories.reduce((n, m) => n + (m.photos?.length || 0), 0);

    const memoriesByCountry = memories.reduce((acc, m) => {
      if (!m.countryName) return acc;
      acc[m.countryName] = (acc[m.countryName] || 0) + 1;
      return acc;
    }, {});
    const topCountryEntry = Object.entries(memoriesByCountry).sort((a, b) => b[1] - a[1])[0];

    const byYear = memories.reduce((acc, m) => {
      const y = m.date?.slice(0, 4);
      if (y) acc[y] = (acc[y] || 0) + 1;
      return acc;
    }, {});
    const years = Object.entries(byYear).sort((a, b) => b[0] - a[0]);
    const maxYearCount = Math.max(...Object.values(byYear), 1);

    const tagCount = {};
    memories.forEach(m => m.tags?.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const partnerCount = {};
    memories.forEach(m => m.partners?.forEach(p => { partnerCount[p] = (partnerCount[p] || 0) + 1; }));

    const groups = profile?.travelGroups || [];
    const partnersByGroup = groups
      .map(g => ({
        ...g,
        members: g.members
          .filter(name => partnerCount[name] > 0)
          .map(name => ({ name, count: partnerCount[name] }))
          .sort((a, b) => b.count - a.count),
      }))
      .filter(g => g.members.length > 0);

    const knownNames = new Set(groups.flatMap(g => g.members));
    const ungrouped = Object.entries(partnerCount)
      .filter(([name]) => !knownNames.has(name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const continentTotals = Object.values(COUNTRY_NAMES).reduce((acc, { alpha2 }) => {
      const c = ALPHA2_CONTINENT[alpha2];
      if (c) acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    const visitedByContinent = Object.entries(countryStatuses)
      .filter(([, v]) => v.status === 'visited')
      .reduce((acc, [code]) => {
        const normalCode = String(parseInt(code, 10));
        const alpha2 = COUNTRY_NAMES[code]?.alpha2 || COUNTRY_NAMES[normalCode]?.alpha2;
        const continent = alpha2 ? ALPHA2_CONTINENT[alpha2] : null;
        if (continent) acc[continent] = (acc[continent] || 0) + 1;
        return acc;
      }, {});

    const continents = CONTINENT_ORDER.map(name => ({
      name,
      visited: visitedByContinent[name] || 0,
      total:   continentTotals[name]    || 0,
      ...CONTINENT_META[name],
    }));

    return { pct, totalPhotos, topCountryEntry, years, maxYearCount, topTags, partnersByGroup, ungrouped, continents };
  }, [memories, countryStatuses, stats, profile]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: T.card,
        borderBottom: `2px solid ${T.border}`,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 8px rgba(44,26,14,0.06)',
      }}>
        <button onClick={() => navigate(-1)} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <IcoArrowLeft size={20} color={T.text3} />
        </button>
        {/* Decorative stamp mark */}
        <span style={{ fontSize: 18 }}>✈️</span>
        <h1 style={{ color: T.text, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 18, margin: 0, flex: 1 }}>
          Travel Statistics
        </h1>
        <div style={{
          width: 32, height: 32, border: `2px solid ${T.border}`,
          borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: 'rotate(12deg)', fontSize: 10, color: T.text3,
          fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.2, padding: 2,
        }}>
          <span>STATS</span>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* World coverage hero */}
        <div style={{
          background: T.card,
          border: `2px dashed ${T.rose}`,
          borderRadius: 16, padding: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Corner decoration */}
          <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 22, opacity: 0.25, transform: 'rotate(15deg)' }}>🌍</div>
          <p style={{ color: T.rose, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px', fontFamily: "'Crimson Text', Georgia, serif" }}>
            World Coverage
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1 }}>
              {data.pct}%
            </span>
            <span style={{ color: T.text3, fontSize: 13, marginBottom: 4 }}>of the world visited</span>
          </div>
          <div style={{ width: '100%', height: 8, background: `${T.rose}20`, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, background: T.rose, width: `${data.pct}%`, transition: 'width 0.7s ease' }} />
          </div>
          <p style={{ color: T.text3, fontSize: 11, margin: '6px 0 0' }}>{stats.visited} of {TOTAL_COUNTRIES} countries</p>
        </div>

        {/* Continent Progress */}
        <Section title="Continent Progress">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.continents.map(({ name, color, visited, total }) => {
              const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: T.text2 }}>{name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: visited > 0 ? color : T.text3 }}>
                      {visited} / {total}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 7, background: `${T.border}60`, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, minWidth: visited > 0 ? 6 : 0, transition: 'width 0.7s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Key numbers grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatTile icon={<IcoGlobe  size={16} color={T.rose}   />} color={T.rose}   value={stats.visited}    label="Countries Visited" />
          <StatTile icon={<IcoStar   size={16} color={T.gold}   />} color={T.gold}   value={stats.bucketList} label="Bucket List" />
          <StatTile icon={<IcoBook   size={16} color={T.navy}   />} color={T.navy}   value={memories.length}  label="Memories" />
          <StatTile icon={<IcoCamera size={16} color={T.purple} />} color={T.purple} value={data.totalPhotos} label="Photos" />
        </div>

        {/* Most-visited country */}
        {data.topCountryEntry && (
          <Section title="Most Memories">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FlagImg
                alpha2={Object.values(
                  Object.fromEntries(
                    memories
                      .filter(m => m.countryName === data.topCountryEntry[0])
                      .map(m => [m.countryAlpha2, m.countryAlpha2])
                  )
                )[0] || ''}
                size={28}
              />
              <div style={{ flex: 1 }}>
                <p style={{ color: T.text, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>{data.topCountryEntry[0]}</p>
                <p style={{ color: T.text3, fontSize: 11, margin: '2px 0 0' }}>
                  {data.topCountryEntry[1]} memor{data.topCountryEntry[1] === 1 ? 'y' : 'ies'} recorded
                </p>
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, color: T.rose, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {data.topCountryEntry[1]}
              </span>
            </div>
          </Section>
        )}

        {/* Memories by year */}
        {data.years.length > 0 && (
          <Section title="Memories by Year">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.years.map(([year, count]) => (
                <div key={year} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: T.text3, fontSize: 11, width: 38, textAlign: 'right', fontFamily: 'monospace' }}>{year}</span>
                  <div style={{ flex: 1, height: 22, background: `${T.border}40`, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6,
                      background: `linear-gradient(90deg, ${T.purple}, ${T.navy})`,
                      width: `${(count / data.maxYearCount) * 100}%`,
                      minWidth: 28,
                      display: 'flex', alignItems: 'center', paddingLeft: 8,
                      transition: 'width 0.5s ease',
                    }}>
                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Top tags */}
        {data.topTags.length > 0 && (
          <Section title="Top Tags">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.topTags.map(([tag, count]) => (
                <span key={tag} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: `${T.navy}15`,
                  border: `1px solid ${T.navy}40`,
                  color: T.navy,
                  fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  fontFamily: "'Crimson Text', Georgia, serif",
                }}>
                  <IcoTag size={10} color={T.navy} />
                  #{tag}
                  <span style={{ color: T.purple, fontWeight: 700, marginLeft: 2 }}>{count}</span>
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Travel Partners */}
        {(data.partnersByGroup.length > 0 || data.ungrouped.length > 0) && (
          <Section title="Travel Partners">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.partnersByGroup.map(group => (
                <div key={group.id}>
                  <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, margin: '0 0 8px' }}>
                    {group.emoji} {group.name}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.members.map(({ name, count }) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${T.purple}18`, border: `1.5px solid ${T.purple}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IcoUsers size={12} color={T.purple} />
                        </div>
                        <span style={{ color: T.text, fontSize: 13, flex: 1 }}>{name}</span>
                        <span style={{ color: T.text3, fontSize: 11 }}>{count} trip{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {data.ungrouped.length > 0 && (
                <div>
                  {data.partnersByGroup.length > 0 && (
                    <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, margin: '0 0 8px' }}>👤 Others</p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {data.ungrouped.map(({ name, count }) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${T.border}40`, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IcoUsers size={12} color={T.text3} />
                        </div>
                        <span style={{ color: T.text, fontSize: 13, flex: 1 }}>{name}</span>
                        <span style={{ color: T.text3, fontSize: 11 }}>{count} trip{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Status breakdown */}
        <Section title="Status Breakdown">
          {[
            { key: 'visited',    label: 'Visited',     count: stats.visited,    color: T.rose   },
            { key: 'bucketList', label: 'Bucket List', count: stats.bucketList, color: T.navy   },
            { key: 'current',    label: 'Traveling',   count: stats.current,    color: T.gold   },
          ].map(({ key, label, count, color }) => {
            const total = stats.visited + stats.bucketList + stats.current || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: T.text2 }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{count} countries</span>
                </div>
                <div style={{ width: '100%', height: 6, background: `${T.border}50`, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </Section>

      </div>
    </div>
  );
}

function StatTile({ icon, color, value, label }) {
  return (
    <div style={{
      background: T.card,
      border: `2px dashed ${color}60`,
      borderRadius: 14, padding: 16,
    }}>
      <div style={{ color, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.text, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
      <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 12px', fontFamily: "'Crimson Text', Georgia, serif" }}>
        {title}
      </p>
      {children}
    </div>
  );
}
