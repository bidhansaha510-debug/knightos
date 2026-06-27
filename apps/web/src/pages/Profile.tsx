import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { useParams, Link } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

interface ProfileData {
  id: string;
  username: string;
  createdAt: string;
  ratings: Record<string, { rating: number; rd: number }>;
  stats: { totalGames: number; wins: number; losses: number; draws: number };
  followerCount: number;
  followingCount: number;
}

const RATING_CATEGORIES = [
  { key: 'bullet', label: 'Bullet' },
  { key: 'blitz', label: 'Blitz' },
  { key: 'rapid', label: 'Rapid' },
  { key: 'classical', label: 'Classical' },
  { key: 'puzzle', label: 'Puzzle' },
];

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const user = useUserStore((s) => s.user);
  const accessToken = useUserStore((s) => s.accessToken);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    if (!username) return;

    setIsLoading(true);
    fetch(`${API_BASE}/users/${username}`)
      .then((r) => r.json())
      .then((data) => { setProfile(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));

    fetch(`${API_BASE}/users/${username}/games?limit=20`)
      .then((r) => r.json())
      .then((data) => setGames(data.games || []))
      .catch(() => {});
  }, [username]);

  const toggleFollow = async () => {
    if (!accessToken || !username) return;
    const method = isFollowing ? 'DELETE' : 'POST';
    await fetch(`${API_BASE}/users/${username}/follow`, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setIsFollowing(!isFollowing);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--sp-7) var(--sp-4)' }}>
        <p style={{ color: 'var(--c-text-2)', fontSize: 'var(--tx-sm)' }}>Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 'var(--sp-7) var(--sp-4)' }}>
        <p style={{ color: 'var(--c-text-2)' }}>User not found</p>
      </div>
    );
  }

  const winRate = profile.stats.totalGames > 0
    ? ((profile.stats.wins / profile.stats.totalGames) * 100).toFixed(1)
    : '0';

  const userRating = Math.round(profile.ratings?.blitz?.rating || profile.ratings?.rapid?.rating || 1500);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--sp-5) var(--sp-4)' }}>
      {/* User header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-4)',
        marginBottom: 'var(--sp-5)',
        paddingBottom: 'var(--sp-4)',
        borderBottom: '1px solid var(--c-border)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '1px solid var(--c-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--c-elevated)',
          fontFamily: 'var(--font-ui)', fontSize: 'var(--tx-lg)', fontWeight: 'var(--wt-bold)',
          color: 'var(--c-text-2)',
          flexShrink: 0,
        }}>
          {profile.username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--tx-lg)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
            {profile.username}
          </h1>
          <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-3)' }}>
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
        {user && user.username !== username && (
          <button onClick={toggleFollow} className={isFollowing ? 'btn-secondary' : 'btn-play'} style={{ fontSize: 'var(--tx-xs)', padding: '6px 16px' }}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      {/* Rating Hero Block */}
      <div style={{
        textAlign: 'center',
        padding: 'var(--sp-5) 0',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--sp-5)',
      }}>
        <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--wt-medium)' }}>
          Active Rating
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--tx-2xl)',
          fontWeight: 'var(--wt-bold)',
          color: 'var(--c-gold)',
          margin: 'var(--sp-2) 0',
          lineHeight: 1,
        }}>
          {userRating}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--sp-6)',
          marginTop: 'var(--sp-4)',
          borderTop: '1px solid var(--c-border)',
          paddingTop: 'var(--sp-4)',
        }}>
          <div>
            <span style={{ fontSize: 'var(--tx-2xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Rating
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
              {userRating}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 'var(--tx-2xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Win Rate
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-bold)', color: 'var(--c-win)' }}>
              {winRate}%
            </span>
          </div>
          <div>
            <span style={{ fontSize: 'var(--tx-2xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Avg Move Time
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
              3.4s
            </span>
          </div>
        </div>
      </div>

      {/* Ratings detailed */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <h2 style={{
          fontSize: 'var(--tx-xs)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text-2)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--sp-3)',
        }}>
          All Categories
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 'var(--sp-2)',
        }}>
          {RATING_CATEGORIES.map((cat) => {
            const r = profile.ratings?.[cat.key];
            return (
              <div key={cat.key} style={{
                background: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--sp-3) var(--sp-4)',
              }}>
                <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', display: 'block' }}>
                  {cat.label}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
                  {r ? Math.round(r.rating) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game history table */}
      <div>
        <h2 style={{
          fontSize: 'var(--tx-xs)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text-2)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--sp-3)',
        }}>
          Recent Games
        </h2>
        <div style={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                {['Date', 'Opponent', 'Result', 'Time', 'Moves'].map((h) => (
                  <th key={h} style={{
                    padding: 'var(--sp-2) var(--sp-3)',
                    fontSize: 'var(--tx-xs)',
                    fontWeight: 'var(--wt-medium)',
                    color: 'var(--c-text-3)',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--sp-5) var(--sp-3)', color: 'var(--c-text-3)', fontSize: 'var(--tx-sm)' }}>
                    No games played yet
                  </td>
                </tr>
              ) : (
                games.map((game) => {
                  const isWhite = game.whiteId === profile.id;
                  const opponent = isWhite ? game.blackUsername : game.whiteUsername;
                  const resultColor = game.result === '1-0'
                    ? (isWhite ? 'var(--c-win)' : 'var(--c-loss)')
                    : game.result === '0-1'
                    ? (isWhite ? 'var(--c-loss)' : 'var(--c-win)')
                    : 'var(--c-draw)';
                  const resultText = game.result === '1-0'
                    ? (isWhite ? 'Win' : 'Loss')
                    : game.result === '0-1'
                    ? (isWhite ? 'Loss' : 'Win')
                    : 'Draw';

                  return (
                    <tr
                      key={game.id}
                      style={{
                        borderBottom: '1px solid var(--c-border)',
                        cursor: 'pointer',
                        transition: 'background var(--dur-fast) var(--ease-out)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-elevated)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)' }}>
                        {new Date(game.endedAt || game.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--tx-sm)', color: 'var(--c-text)' }}>
                        <Link to={`/user/${opponent}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {opponent || '—'}
                        </Link>
                      </td>
                      <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-medium)', color: resultColor }}>
                        {resultText}
                      </td>
                      <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', fontFamily: 'var(--font-mono)' }}>
                        {game.timeControl || '—'}
                      </td>
                      <td style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--tx-xs)', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>
                        {game.moves?.length || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
