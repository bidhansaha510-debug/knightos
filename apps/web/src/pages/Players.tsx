import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';
import { useUserStore } from '../stores/userStore';

interface UserRating {
  timeControl: string;
  rating: number;
}

interface Player {
  id: string;
  username: string;
  createdAt: string;
  ratings: UserRating[];
}

export default function Players() {
  const currentUser = useUserStore((s) => s.user);
  const accessToken = useUserStore((s) => s.accessToken);
  const [players, setPlayers] = useState<Player[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSocialData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // 1. Fetch all players
      const resPlayers = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const dataPlayers = await resPlayers.json();

      // 2. Fetch following
      const resFollowing = await fetch(`${API_BASE}/users/${currentUser.username}/following`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const dataFollowing = await resFollowing.json();

      // 3. Fetch followers
      const resFollowers = await fetch(`${API_BASE}/users/${currentUser.username}/followers`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const dataFollowers = await resFollowers.json();

      if (Array.isArray(dataPlayers)) setPlayers(dataPlayers);
      if (Array.isArray(dataFollowing)) setFollowing(dataFollowing);
      if (Array.isArray(dataFollowers)) setFollowers(dataFollowers);
    } catch (err) {
      console.error('Failed to fetch social directory data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, accessToken]);

  useEffect(() => {
    fetchSocialData();
  }, [fetchSocialData]);

  const handleFollowToggle = async (player: Player, isFollowing: boolean) => {
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE}/users/${player.username}/follow`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        // Refresh following list
        const resFollowing = await fetch(`${API_BASE}/users/${currentUser?.username}/following`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const dataFollowing = await resFollowing.json();
        if (Array.isArray(dataFollowing)) setFollowing(dataFollowing);
      }
    } catch (err) {
      console.error('Failed to toggle follow status:', err);
    }
  };

  const handleOpenChat = (player: Player) => {
    // Dispatch custom event to open DM chat window globally
    window.dispatchEvent(
      new CustomEvent('open_chat', {
        detail: { userId: player.id, username: player.username }
      })
    );
  };

  const filteredPlayers = players.filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase()) && p.id !== currentUser?.id
  );

  return (
    <div style={{
      maxWidth: 1040,
      margin: '0 auto',
      padding: 'var(--sp-5) var(--sp-4) var(--sp-7)',
      background: 'var(--c-base)',
      minHeight: 'calc(100vh - 48px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-5)',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--c-border)', paddingBottom: 'var(--sp-4)' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--tx-xl)',
          fontWeight: 'var(--wt-bold)',
          color: 'var(--c-text)',
        }}>
          Players Directory
        </h1>
        <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', marginTop: 'var(--sp-1)' }}>
          Connect with the community, add friends, and start chess conversations.
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
        <input
          type="text"
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{
            maxWidth: 320,
            fontSize: 'var(--tx-sm)',
            padding: '8px var(--sp-3)',
          }}
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', color: 'var(--c-text-2)', fontSize: 'var(--tx-sm)', padding: 'var(--sp-7) 0' }}>
          Loading community roster…
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--c-text-3)', fontSize: 'var(--tx-sm)', padding: 'var(--sp-7) 0', fontStyle: 'italic' }}>
          No players match your search criteria.
        </div>
      ) : (
        /* Grid Layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--sp-4)',
        }}>
          {filteredPlayers.map((player) => {
            const isFollowing = following.some((f) => f.id === player.id);
            const isFollower = followers.some((f) => f.id === player.id);
            const isFriend = isFollowing && isFollower;

            // Get standard rating formats
            const blitzRating = Math.round(player.ratings?.find((r) => r.timeControl === 'blitz')?.rating ?? 1500);
            const rapidRating = Math.round(player.ratings?.find((r) => r.timeControl === 'rapid')?.rating ?? 1500);

            return (
              <div
                key={player.id}
                style={{
                  background: 'var(--c-surface)',
                  border: isFriend ? '1px solid var(--c-gold)' : '1px solid var(--c-border)',
                  boxShadow: isFriend ? '0 0 10px rgba(212, 168, 67, 0.1)' : 'none',
                  padding: 'var(--sp-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--sp-3)',
                  transition: 'border-color var(--dur-fast) var(--ease-out)',
                }}
              >
                {/* User details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
                      {player.username}
                    </h3>
                    {isFriend ? (
                      <span style={{ fontSize: 'var(--tx-3xs)', color: 'var(--c-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--wt-bold)', background: 'var(--c-gold-glow)', padding: '1px 4px', border: '1px solid var(--c-gold)' }}>
                        Friend
                      </span>
                    ) : isFollower ? (
                      <span style={{ fontSize: 'var(--tx-3xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--c-elevated)', padding: '1px 4px', border: '1px solid var(--c-border)' }}>
                        Follower
                      </span>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 'var(--tx-3xs)', color: 'var(--c-text-3)', display: 'block', marginTop: '2px' }}>
                    Joined {new Date(player.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Ratings details */}
                <div style={{ display: 'flex', gap: 'var(--sp-4)', borderTop: '1px solid var(--c-border)', paddingTop: 'var(--sp-2)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--tx-3xs)', color: 'var(--c-text-3)', textTransform: 'uppercase', display: 'block' }}>
                      Blitz
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-sm)', color: 'var(--c-text)', fontWeight: 'var(--wt-medium)' }}>
                      {blitzRating}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--tx-3xs)', color: 'var(--c-text-3)', textTransform: 'uppercase', display: 'block' }}>
                      Rapid
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-sm)', color: 'var(--c-text)', fontWeight: 'var(--wt-medium)' }}>
                      {rapidRating}
                    </span>
                  </div>
                </div>

                {/* Interaction Actions */}
                <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'auto', paddingTop: 'var(--sp-2)' }}>
                  <button
                    onClick={() => handleFollowToggle(player, isFollowing)}
                    className={isFollowing ? 'btn-secondary' : 'btn-play'}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      fontSize: 'var(--tx-2xs)',
                      padding: '6px 0',
                    }}
                  >
                    {isFollowing ? 'Unfriend / Unfollow' : 'Add Friend / Follow'}
                  </button>
                  <button
                    onClick={() => handleOpenChat(player)}
                    className="btn-play"
                    style={{
                      justifyContent: 'center',
                      fontSize: 'var(--tx-2xs)',
                      padding: '6px var(--sp-3)',
                      background: 'var(--c-gold)',
                      color: '#000',
                    }}
                  >
                    Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
