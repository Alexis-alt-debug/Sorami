import { useState } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';

export default function Friends() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen">
      <div className="p-5">
        <h1 className="text-white font-bold text-xl mb-1 pt-2">Friends</h1>
        <p className="text-slate-400 text-xs mb-5">Connect and share your travels</p>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Coming soon banner */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center mb-6">
          <div className="w-14 h-14 bg-pink-500/15 rounded-full flex items-center justify-center mx-auto mb-3 border border-pink-500/20">
            <Users className="w-7 h-7 text-pink-400" />
          </div>
          <h2 className="text-white font-semibold mb-1">Friends Coming Soon</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Connect with fellow travelers, share your diaries, and see where your friends have been.
          </p>
        </div>

        {/* Planned features */}
        <div className="space-y-3">
          {[
            { emoji: '🔍', label: 'Search & add friends by username' },
            { emoji: '📍', label: 'See recently visited places' },
            { emoji: '📖', label: 'Share travel diaries & photos' },
            { emoji: '🔒', label: 'Privacy controls: public / friends / private' },
            { emoji: '👥', label: 'Tag travel partners in memories' },
          ].map(({ emoji, label }) => (
            <div key={label} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
              <span className="text-xl">{emoji}</span>
              <span className="text-slate-300 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
