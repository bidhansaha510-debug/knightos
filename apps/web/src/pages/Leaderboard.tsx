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
    <div className="min-h-screen bg-base p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold font-display text-text-primary mb-6">Leaderboard</h1>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 text-sm font-semibold transition-colors border-b-2
                ${activeTab === tab.key
                  ? 'border-accent-blue text-accent-blue'
                  : 'border-transparent text-text-muted hover:text-text-primary'
                }
              `}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface border border-border">
          {/* Header */}
          <div className="flex items-center px-4 py-2 border-b border-border text-text-muted text-xs uppercase tracking-wider">
            <span className="w-12">#</span>
            <span className="flex-1">Player</span>
            <span className="w-24 text-right">Rating</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-text-muted animate-pulse">Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-muted">No players with established ratings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry) => (
                <Link
                  key={entry.userId}
                  to={`/user/${entry.username}`}
                  className="flex items-center px-4 py-3 hover:bg-elevated transition-colors"
                >
                  <span className={`
                    w-12 font-mono text-sm font-bold
                    ${entry.rank <= 3
                      ? entry.rank === 1 ? 'text-accent-amber' : entry.rank === 2 ? 'text-text-muted' : 'text-amber-700'
                      : 'text-text-muted'
                    }
                  `}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </span>
                  <span className="flex-1 text-text-primary font-semibold text-sm">
                    {entry.username}
                  </span>
                  <span className="w-24 text-right font-mono text-text-primary font-bold">
                    {entry.rating}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
