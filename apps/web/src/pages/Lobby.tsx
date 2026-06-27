import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWsUrl } from '../config';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUserStore } from '../stores/userStore';
import type { Seek, ServerLobbyMessage } from '@knightos/shared';

const POPULAR_TIME_CONTROLS = [
  { label: '1+0', name: 'Bullet', sub: 'Fast-paced hyper chess' },
  { label: '2+1', name: 'Bullet', sub: 'Bullet with 1-second increment' },
  { label: '3+0', name: 'Blitz', sub: 'Standard speed tournament blitz' },
  { label: '5+3', name: 'Blitz', sub: 'Blitz with 3-second increment' },
  { label: '10+0', name: 'Rapid', sub: 'Deep strategic rapid game' },
  { label: '15+10', name: 'Rapid', sub: 'Rapid with 10-second increment' },
  { label: '30+0', name: 'Classical', sub: 'Deep thinking classical chess' },
];

export default function Lobby() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [seeks, setSeeks] = useState<Seek[]>([]);
  const [activeSeeking, setActiveSeeking] = useState<string | null>(null);
  const [customControl, setCustomControl] = useState('');
  const [selectedControl, setSelectedControl] = useState('3+0');

  const wsUrl = getWsUrl('/ws/lobby');

  const handleMessage = useCallback(
    (msg: ServerLobbyMessage) => {
      switch (msg.type) {
        case 'seeks_update':
          setSeeks((msg as any).seeks || []);
          break;
        case 'game_start': {
          const startMsg = msg as any;
          navigate(`/game/${startMsg.gameId}`);
          break;
        }
      }
    },
    [navigate]
  );

  const { send, isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
  });

  const handleSeek = useCallback(
    (timeControl: string) => {
      if (activeSeeking === timeControl) {
        send({ type: 'seek_cancel' });
        setActiveSeeking(null);
      } else {
        // If seeking another time control, cancel it first
        if (activeSeeking) {
          send({ type: 'seek_cancel' });
        }
        send({ type: 'seek', timeControl, rated: true, color: 'random' });
        setActiveSeeking(timeControl);
      }
    },
    [send, activeSeeking]
  );

  const handlePlayClick = () => {
    handleSeek(selectedControl);
  };

  if (!user) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 48px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-6)',
          maxWidth: 320,
          width: '100%',
        }}>
          <p style={{ fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text)', marginBottom: 'var(--sp-2)' }}>
            Sign in required
          </p>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)', marginBottom: 'var(--sp-4)' }}>
            You must be logged in to play online.
          </p>
          <button onClick={() => navigate('/login')} className="btn-play" style={{ width: '100%', fontSize: 'var(--tx-xs)' }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const isSeekingSelected = activeSeeking === selectedControl;
  const buttonText = activeSeeking
    ? (isSeekingSelected ? 'Cancel Seeking' : `Play ${selectedControl} (Cancel Current)`)
    : 'Play Now';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--sp-5) var(--sp-4)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--sp-5)',
        paddingBottom: 'var(--sp-4)',
        borderBottom: '1px solid var(--c-border)',
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--tx-lg)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
            Create a Game
          </h1>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)', marginTop: 'var(--sp-1)' }}>
            Select a time control to find an opponent.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isConnected ? 'var(--c-win)' : 'var(--c-loss)',
          }} />
          <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)' }}>
            {isConnected ? 'Connected' : 'Connecting…'}
          </span>
        </div>
      </div>

      <div className="lobby-grid">
        {/* Time control vertical stack */}
        <div>
          <h2 style={{
            fontSize: 'var(--tx-xs)',
            fontWeight: 'var(--wt-medium)',
            color: 'var(--c-text-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--sp-3)',
          }}>
            Select Time Control
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
            {POPULAR_TIME_CONTROLS.map((tc) => {
              const isSelected = selectedControl === tc.label;
              const isCurrentlySeeking = activeSeeking === tc.label;
              return (
                <button
                  key={tc.label}
                  onClick={() => setSelectedControl(tc.label)}
                  style={{
                    height: 52,
                    width: '100%',
                    background: isSelected ? 'var(--c-gold-glow)' : 'transparent',
                    border: '1px solid var(--c-border)',
                    borderLeft: isSelected ? '3px solid var(--c-gold)' : '1px solid var(--c-border)',
                    padding: '0 var(--sp-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-bold)', color: isSelected ? 'var(--c-gold)' : 'var(--c-text)' }}>
                        {tc.name}
                      </span>
                      {isCurrentlySeeking && (
                        <span style={{ fontSize: '10px', color: 'var(--c-gold)', textTransform: 'uppercase', fontWeight: 'var(--wt-bold)' }}>
                          ● Seeking…
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--tx-2xs)', color: 'var(--c-text-3)' }}>
                      {tc.sub}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
                    {tc.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Input */}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
            <input
              type="text"
              placeholder="Custom (e.g. 10+5)"
              value={customControl}
              onChange={(e) => setCustomControl(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', flex: 1 }}
            />
            <button
              onClick={() => {
                if (customControl) {
                  setSelectedControl(customControl);
                  setCustomControl('');
                }
              }}
              className="btn-secondary"
            >
              Select Custom
            </button>
          </div>

          {/* PLAY NOW Button */}
          <button
            onClick={handlePlayClick}
            className={activeSeeking ? 'btn-secondary' : 'btn-play'}
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {buttonText}
          </button>
        </div>

        {/* Open seeks */}
        <div>
          <h2 style={{
            fontSize: 'var(--tx-xs)',
            fontWeight: 'var(--wt-medium)',
            color: 'var(--c-text-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--sp-3)',
          }}>
            Available Seeks
          </h2>
          <div style={{
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {seeks.filter((s) => s.userId !== user.id).length === 0 ? (
              <p style={{
                padding: 'var(--sp-5) var(--sp-4)',
                color: 'var(--c-text-3)',
                fontSize: 'var(--tx-sm)',
              }}>
                No active seekers
              </p>
            ) : (
              seeks.filter((s) => s.userId !== user.id).map((seek) => (
                <button
                  key={seek.id}
                  onClick={() => handleSeek(seek.timeControl)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--sp-3) var(--sp-4)',
                    borderBottom: '1px solid var(--c-border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background var(--dur-fast) var(--ease-out)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-elevated)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text)', display: 'block' }}>
                      {seek.username}
                    </span>
                    <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', fontFamily: 'var(--font-mono)' }}>
                      {seek.rating}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--tx-sm)',
                      color: 'var(--c-text)',
                    }}>
                      {seek.timeControl}
                    </span>
                    {seek.rated && (
                      <span style={{
                        fontSize: 'var(--tx-xs)',
                        color: 'var(--c-warn)',
                        fontWeight: 'var(--wt-medium)',
                      }}>
                        Rated
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
