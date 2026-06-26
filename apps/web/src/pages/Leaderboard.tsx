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
  { key: 'bullet', label: 'Bullet' },
  { key: 'blitz', label: 'Blitz' },
  { key: 'rapid', label: 'Rapid' },
  { key: 'classical', label: 'Classical' },
  { key: 'puzzle', label: 'Puzzle' },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('blitz');
  const [entries, setEntries] = useState<LeaderboardEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/leaderboard/${activeTab}`)
      .then((r) => r.json())
      .then((data) => { setEntries(data.entries || []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [activeTab]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--c-text)', marginBottom: 'var(--space-5)' }}>
        Leaderboard
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-1)',
        marginBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--c-border)',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0 var(--space-3)',
                height: 36,
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: isActive ? 'var(--c-text)' : 'var(--c-text-2)',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--c-accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color var(--dur-fast) var(--ease-out)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
              <th style={{ width: 56, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--c-text-3)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
              <th style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--c-text-3)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Player</th>
              <th style={{ width: 80, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--c-text-3)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} style={{ padding: 'var(--space-7) var(--space-3)', textAlign: 'center', color: 'var(--c-text-2)', fontSize: 'var(--text-sm)' }}>
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 'var(--space-7) var(--space-3)', textAlign: 'center', color: 'var(--c-text-3)', fontSize: 'var(--text-sm)' }}>
                  No players yet
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.userId}
                  style={{
                    borderBottom: '1px solid var(--c-border)',
                    cursor: 'pointer',
                    transition: 'background var(--dur-fast) var(--ease-out)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-elevated)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
                    {entry.rank}
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <Link
                      to={`/user/${entry.username}`}
                      style={{ color: 'var(--c-text)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', textDecoration: 'none' }}
                    >
                      {entry.username}
                    </Link>
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--c-text)', textAlign: 'right' }}>
                    {entry.rating}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
