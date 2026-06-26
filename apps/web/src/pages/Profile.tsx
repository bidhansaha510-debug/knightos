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
    <div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="glass-card p-6 flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-md shadow-blue-500/10">
                {profile.username[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black font-display text-text-primary">{profile.username}</h1>
                <p className="text-text-muted text-xs font-light mt-0.5">
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-4 mt-4 text-xs font-medium">
              <span className="text-text-muted">
                <strong className="text-text-primary font-bold">{profile.followerCount}</strong> followers
              </span>
              <span className="text-text-muted">
                <strong className="text-text-primary font-bold">{profile.followingCount}</strong> following
              </span>
            </div>
          </div>
          {user && user.username !== username && (
            <button
              onClick={toggleFollow}
              className={`
                px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200
                ${isFollowing
                  ? 'bg-white/[0.04] border border-white/10 text-text-primary hover:bg-white/[0.08]'
                  : 'btn-primary'
                }
              `}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="glass-card p-5 space-y-4 shadow-lg">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-black font-display text-text-primary">{profile.stats.totalGames}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Total Games</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black font-display text-accent-green">{profile.stats.wins}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Wins</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black font-display text-accent-red">{profile.stats.losses}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Losses</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black font-display text-accent-amber">{profile.stats.draws}</p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Draws</p>
            </div>
          </div>
          <div className="relative pt-1">
            <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-white/[0.05] border border-white/5">
              <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-green" style={{ width: `${winRate}%` }} />
              <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-amber" style={{ width: `${profile.stats.totalGames > 0 ? ((profile.stats.draws / profile.stats.totalGames) * 100).toFixed(1) : 0}%` }} />
              <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-red flex-1" />
            </div>
          </div>
        </div>

        {/* Ratings Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {RATING_CATEGORIES.map((cat) => {
            const r = profile.ratings[cat.key];
            return (
              <div key={cat.key} className="glass-card p-4 text-center hover:border-white/10 transition-colors shadow-md">
                <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.05)]">{cat.icon}</span>
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-2">{cat.label}</p>
                <p className="text-2xl font-black font-mono text-text-primary mt-1.5 leading-none">
                  {r ? Math.round(r.rating) : '—'}
                </p>
                {r && r.rd > 100 && (
                  <p className="text-text-muted text-[9px] font-medium tracking-wide mt-1">±{Math.round(r.rd)} deviation</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Recent Games */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Recent Matches</h2>
          <div className="glass-card overflow-hidden">
            {games.length === 0 ? (
              <p className="p-8 text-text-muted text-sm font-light text-center">No games played yet</p>
            ) : (
              <div className="divide-y divide-white/5">
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
                      className={`
                        flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-all duration-200 group border-l-2
                        ${won ? 'border-accent-green/40' : lost ? 'border-accent-red/40' : 'border-accent-amber/40'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isWhite ? 'bg-slate-200 border border-white/10' : 'bg-slate-800 border border-white/5'}`} />
                        <span className="text-text-primary text-sm font-medium">
                          vs <strong className="font-bold group-hover:text-blue-400 transition-colors">{opponent.username}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-text-muted font-mono text-xs bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5">{game.timeControl}</span>
                        <span className={`font-bold text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full border
                          ${won ? 'bg-emerald-500/10 border-emerald-500/20 text-accent-green' : lost ? 'bg-red-500/10 border-red-500/20 text-accent-red' : 'bg-amber-500/10 border-amber-500/20 text-accent-amber'}
                        `}>
                          {won ? 'Victory' : lost ? 'Defeat' : 'Draw'}
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
