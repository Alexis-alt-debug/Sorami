import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, BookOpen, Camera, Users, Tag, Star } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { getFlagEmoji, COUNTRY_NAMES } from '../data/countryNames';
import { ALPHA2_CONTINENT, CONTINENT_META, CONTINENT_ORDER } from '../data/continents';

const TOTAL_COUNTRIES = 195;

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

    // Normalize zero-padded codes (e.g. '010' → '10' for Antarctica)
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
    <div className="min-h-screen pb-10">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Travel Statistics</h1>
      </div>

      <div className="p-4 space-y-4">

        {/* World coverage hero */}
        <div className="bg-gradient-to-br from-violet-500/20 to-purple-700/20 border border-violet-500/25 rounded-2xl p-5">
          <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-1">World Coverage</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-5xl font-bold text-white">{data.pct}%</span>
            <span className="text-slate-400 text-sm mb-1.5">of the world visited</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-700"
              style={{ width: `${data.pct}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs mt-2">{stats.visited} of {TOTAL_COUNTRIES} countries</p>
        </div>

        {/* Continent Progress */}
        <Section title="Continent Progress">
          <div className="space-y-3">
            {data.continents.map(({ name, color, visited, total }) => {
              const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-200">{name}</span>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: visited > 0 ? color : '#475569' }}>
                      {visited} / {total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color, minWidth: visited > 0 ? 6 : 0 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Key numbers grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={<Globe className="w-4 h-4" />}    color="text-violet-400"   bg="bg-violet-500/10 border-violet-500/20"
            value={stats.visited}    label="Countries Visited" />
          <StatTile icon={<Star className="w-4 h-4" />}     color="text-yellow-400" bg="bg-yellow-500/10 border-yellow-500/20"
            value={stats.bucketList} label="Bucket List" />
          <StatTile icon={<BookOpen className="w-4 h-4" />} color="text-violet-400" bg="bg-violet-500/10 border-violet-500/20"
            value={memories.length}  label="Memories" />
          <StatTile icon={<Camera className="w-4 h-4" />}   color="text-pink-400"   bg="bg-pink-500/10 border-pink-500/20"
            value={data.totalPhotos} label="Photos" />
        </div>

        {/* Most-visited country */}
        {data.topCountryEntry && (
          <Section title="Most Memories">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {getFlagEmoji(
                  Object.values(
                    Object.fromEntries(
                      memories
                        .filter(m => m.countryName === data.topCountryEntry[0])
                        .map(m => [m.countryAlpha2, m.countryAlpha2])
                    )
                  )[0] || ''
                )}
              </span>
              <div className="flex-1">
                <p className="text-white font-bold">{data.topCountryEntry[0]}</p>
                <p className="text-slate-400 text-xs">{data.topCountryEntry[1]} memor{data.topCountryEntry[1] === 1 ? 'y' : 'ies'} recorded</p>
              </div>
              <span className="text-2xl font-bold text-violet-400">{data.topCountryEntry[1]}</span>
            </div>
          </Section>
        )}

        {/* Memories by year */}
        {data.years.length > 0 && (
          <Section title="Memories by Year">
            <div className="space-y-2.5">
              {data.years.map(([year, count]) => (
                <div key={year} className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs w-10 text-right">{year}</span>
                  <div className="flex-1 h-6 bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-violet-500 to-purple-400 flex items-center px-2 transition-all duration-500"
                      style={{ width: `${(count / data.maxYearCount) * 100}%`, minWidth: 28 }}
                    >
                      <span className="text-white text-[10px] font-bold">{count}</span>
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
            <div className="flex flex-wrap gap-2">
              {data.topTags.map(([tag, count]) => (
                <span key={tag} className="flex items-center gap-1.5 bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-full border border-slate-600">
                  <Tag className="w-3 h-3 text-slate-400" />
                  #{tag}
                  <span className="text-violet-400 font-bold ml-0.5">{count}</span>
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Travel Partners */}
        {(data.partnersByGroup.length > 0 || data.ungrouped.length > 0) && (
          <Section title="Travel Partners">
            <div className="space-y-4">
              {data.partnersByGroup.map(group => (
                <div key={group.id}>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
                    {group.emoji} {group.name}
                  </p>
                  <div className="space-y-1.5">
                    {group.members.map(({ name, count }) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-violet-400" />
                        </div>
                        <span className="text-white text-sm flex-1">{name}</span>
                        <span className="text-slate-400 text-xs">{count} trip{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {data.ungrouped.length > 0 && (
                <div>
                  {data.partnersByGroup.length > 0 && (
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">👤 Others</p>
                  )}
                  <div className="space-y-1.5">
                    {data.ungrouped.map(({ name, count }) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-white text-sm flex-1">{name}</span>
                        <span className="text-slate-400 text-xs">{count} trip{count > 1 ? 's' : ''}</span>
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
            { key: 'visited',    label: 'Visited',     count: stats.visited    },
            { key: 'bucketList', label: 'Bucket List', count: stats.bucketList },
            { key: 'current',    label: 'Traveling',   count: stats.current    },
          ].map(({ key, label, count }) => {
            const total = stats.visited + stats.bucketList + stats.current || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-semibold" style={{ color: statusColors[key] }}>{count} countries</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: statusColors[key] }} />
                </div>
              </div>
            );
          })}
        </Section>

      </div>
    </div>
  );
}

function StatTile({ icon, color, bg, value, label }) {
  return (
    <div className={`${bg} border rounded-2xl p-4`}>
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-white leading-tight">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">{title}</p>
      {children}
    </div>
  );
}
