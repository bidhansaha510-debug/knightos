import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { Link } from 'react-router-dom';

interface LeaderboardEntryData {
  rank: number;
  userId: string;
  username: string;
  rating: number;
}

const TABS = [
  { key: 'bullet', label: 'Bullet', icon: '⚡' },
  { key: 'blitz', label: 'Blitz', icon: '🔥' },
  { key: 'rapid', label: 'Rapid', icon: '⏱' },
  { key: 'classical', label: 'Classical', icon: '♚' },
  { key: 'puzzle', label: 'Puzzle', icon: '🧩' },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('blitz');
  const [entries, setEntries] = useState<LeaderboardEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/leaderboard/${activeTab}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <h1 className="text-3xl font-black font-display text-text-primary tracking-wide mb-6">
          Leaderboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl mb-6 backdrop-blur-md">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive
                    ? 'bg-accent-blue/15 text-blue-400 border border-accent-blue/20 shadow-sm'
                    : 'text-text-muted hover:text-text-primary border border-transparent'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Table Container */}
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center px-6 py-4 border-b border-white/5 text-text-muted text-[10px] uppercase font-bold tracking-widest bg-white/[0.01]">
            <span className="w-16">Rank</span>
            <span className="flex-1">Player</span>
            <span className="w-24 text-right">Rating</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-accent-blue animate-spin mb-3" />
              <p className="text-text-muted text-sm font-light">Loading top players...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-text-muted text-sm font-light">
              No players registered yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {entries.map((entry) => {
                const isTopThree = entry.rank <= 3;
                return (
                  <Link
                    key={entry.userId}
                    to={`/user/${entry.username}`}
                    className="flex items-center px-6 py-4.5 hover:bg-white/[0.03] transition-all duration-200 group border-l-2 border-transparent hover:border-accent-blue/40"
                  >
                    <div className="w-16 flex items-center">
                      <span className={`
                        font-mono text-base font-black flex items-center justify-center w-7 h-7 rounded-lg
                        ${entry.rank === 1 ? 'bg-amber-500/15 border border-amber-500/30 text-accent-amber shadow-[0_0_10px_rgba(245,158,11,0.2)]' : ''}
                        ${entry.rank === 2 ? 'bg-slate-400/15 border border-slate-400/30 text-slate-300' : ''}
                        ${entry.rank === 3 ? 'bg-amber-700/15 border border-amber-700/30 text-amber-600' : ''}
                        ${entry.rank > 3 ? 'text-text-muted' : ''}
                      `}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </span>
                    </div>
                    <span className="flex-1 text-text-primary font-bold text-sm group-hover:text-blue-400 transition-colors">
                      {entry.username}
                    </span>
                    <span className="w-24 text-right font-mono text-text-primary font-extrabold bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1 text-xs">
                      {entry.rating}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
