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
  { key: 'bullet', label: 'Bullet', icon: '⚡' },
  { key: 'blitz', label: 'Blitz', icon: '🔥' },
  { key: 'rapid', label: 'Rapid', icon: '⏱' },
  { key: 'classical', label: 'Classical', icon: '♚' },
  { key: 'puzzle', label: 'Puzzle', icon: '🧩' },
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
      .then((data) => {
        setProfile(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    // Fetch recent games
    fetch(`${API_BASE}/users/${username}/games?limit=10`)
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
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-text-muted animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-text-muted">User not found</p>
      </div>
    );
  }

  const winRate = profile.stats.totalGames > 0
    ? ((profile.stats.wins / profile.stats.totalGames) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-base p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-surface border border-border p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">{profile.username}</h1>
            <p className="text-text-muted text-sm mt-1">
              Joined {new Date(profile.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-text-muted">
                <strong className="text-text-primary">{profile.followerCount}</strong> followers
              </span>
              <span className="text-text-muted">
                <strong className="text-text-primary">{profile.followingCount}</strong> following
              </span>
            </div>
          </div>
          {user && user.username !== username && (
            <button
              onClick={toggleFollow}
              className={`
                px-4 py-2 text-sm font-semibold transition-colors
                ${isFollowing
                  ? 'bg-surface border border-accent-blue text-accent-blue hover:bg-accent-blue/10'
                  : 'bg-accent-blue text-white hover:bg-blue-600'
                }
              `}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="bg-surface border border-border p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-display text-text-primary">{profile.stats.totalGames}</p>
              <p className="text-text-muted text-xs uppercase">Games</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-accent-green">{profile.stats.wins}</p>
              <p className="text-text-muted text-xs uppercase">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-accent-red">{profile.stats.losses}</p>
              <p className="text-text-muted text-xs uppercase">Losses</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-accent-amber">{profile.stats.draws}</p>
              <p className="text-text-muted text-xs uppercase">Draws</p>
            </div>
          </div>
          <div className="mt-3 bg-base h-2 overflow-hidden">
            <div className="flex h-full">
              <div className="bg-accent-green" style={{ width: `${winRate}%` }} />
              <div className="bg-accent-amber" style={{ width: `${profile.stats.totalGames > 0 ? ((profile.stats.draws / profile.stats.totalGames) * 100).toFixed(1) : 0}%` }} />
              <div className="bg-accent-red flex-1" />
            </div>
          </div>
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-5 gap-2">
          {RATING_CATEGORIES.map((cat) => {
            const r = profile.ratings[cat.key];
            return (
              <div key={cat.key} className="bg-surface border border-border p-4 text-center">
                <span className="text-lg">{cat.icon}</span>
                <p className="text-text-muted text-xs uppercase mt-1">{cat.label}</p>
                <p className="text-xl font-bold font-mono text-text-primary mt-1">
                  {r ? Math.round(r.rating) : '—'}
                </p>
                {r && r.rd > 100 && (
                  <p className="text-text-muted text-xs">±{Math.round(r.rd)}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Recent Games */}
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Recent Games</h2>
          <div className="bg-surface border border-border">
            {games.length === 0 ? (
              <p className="p-4 text-text-muted text-sm text-center">No games played yet</p>
            ) : (
              <div className="divide-y divide-border">
                {games.map((game: any) => {
                  const isWhite = game.white.id === profile.id;
                  const opponent = isWhite ? game.black : game.white;
                  const won =
                    (isWhite && game.result === '1-0') ||
                    (!isWhite && game.result === '0-1');
                  const lost =
                    (isWhite && game.result === '0-1') ||
                    (!isWhite && game.result === '1-0');

                  return (
                    <Link
                      key={game.id}
                      to={`/games/${game.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-elevated transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 ${isWhite ? 'bg-white' : 'bg-[#333]'}`} />
                        <span className="text-text-primary text-sm">
                          vs <strong>{opponent.username}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted font-mono text-xs">{game.timeControl}</span>
                        <span className={`font-semibold text-sm ${won ? 'text-accent-green' : lost ? 'text-accent-red' : 'text-accent-amber'}`}>
                          {won ? 'Win' : lost ? 'Loss' : 'Draw'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
