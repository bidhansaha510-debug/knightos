import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWsUrl } from '../config';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUserStore } from '../stores/userStore';
import type { Seek, ServerLobbyMessage } from '@knightos/shared';

const TIME_CONTROL_GROUPS = [
  { name: 'Bullet', controls: ['1+0', '1+1', '2+1'] },
  { name: 'Blitz', controls: ['3+0', '3+2', '5+0', '5+3'] },
  { name: 'Rapid', controls: ['10+0', '10+5', '15+10'] },
  { name: 'Classical', controls: ['30+0', '30+20'] },
];

export default function Lobby() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [seeks, setSeeks] = useState<Seek[]>([]);
  const [activeSeeking, setActiveSeeking] = useState<string | null>(null);
  const [customControl, setCustomControl] = useState('');

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
        send({ type: 'seek', timeControl, rated: true, color: 'random' });
        setActiveSeeking(timeControl);
      }
    },
    [send, activeSeeking]
  );

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
          padding: 'var(--space-6)',
          maxWidth: 320,
          width: '100%',
        }}>
          <p style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-medium)', color: 'var(--c-text)', marginBottom: 'var(--space-2)' }}>
            Sign in required
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', marginBottom: 'var(--space-4)' }}>
            You must be logged in to play online.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%' }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-5)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--c-border)',
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--c-text)' }}>
            Create a Game
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', marginTop: 'var(--space-1)' }}>
            Select a time control to find an opponent.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isConnected ? 'var(--c-win)' : 'var(--c-loss)',
          }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)' }}>
            {isConnected ? 'Connected' : 'Connecting…'}
          </span>
        </div>
      </div>

      <div className="lobby-grid">
        {/* Time control groups */}
        <div>
          {TIME_CONTROL_GROUPS.map((group) => (
            <div key={group.name} style={{ marginBottom: 'var(--space-5)' }}>
              <h2 style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--c-text-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-3)',
              }}>
                {group.name}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {group.controls.map((tc) => {
                  const isActive = activeSeeking === tc;
                  return (
                    <button
                      key={tc}
                      onClick={() => handleSeek(tc)}
                      style={{
                        width: 120,
                        height: 64,
                        background: isActive ? 'var(--c-elevated)' : 'var(--c-surface)',
                        border: `1px solid ${isActive ? 'var(--c-accent)' : 'var(--c-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'border-color var(--dur-fast) var(--ease-out)',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = 'var(--c-border-strong)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = 'var(--c-border)';
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--weight-medium)',
                        color: isActive ? 'var(--c-accent)' : 'var(--c-text)',
                      }}>
                        {tc}
                      </span>
                      {isActive && (
                        <span style={{
                          fontSize: '9px',
                          color: 'var(--c-accent)',
                          marginTop: 2,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: 'var(--weight-medium)',
                        }}>
                          Seeking…
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: 380 }}>
            <input
              type="text"
              placeholder="Custom (e.g. 10+5)"
              value={customControl}
              onChange={(e) => setCustomControl(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', flex: 1 }}
            />
            <button
              onClick={() => customControl && handleSeek(customControl)}
              className="btn-primary"
            >
              Play
            </button>
          </div>
        </div>

        {/* Open seeks */}
        <div>
          <h2 style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--c-text-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-3)',
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
                padding: 'var(--space-5) var(--space-4)',
                color: 'var(--c-text-3)',
                fontSize: 'var(--text-sm)',
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
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: '1px solid var(--c-border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background var(--dur-fast) var(--ease-out)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-elevated)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--c-text)', display: 'block' }}>
                      {seek.username}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', fontFamily: 'var(--font-mono)' }}>
                      {seek.rating}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--c-text)',
                    }}>
                      {seek.timeControl}
                    </span>
                    {seek.rated && (
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--c-warning)',
                        fontWeight: 'var(--weight-medium)',
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
