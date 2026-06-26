import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWsUrl } from '../config';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUserStore } from '../stores/userStore';
import type { Seek, ServerLobbyMessage } from '@knightos/shared';

const TIME_CONTROL_GROUPS = [
  {
    name: 'Bullet',
    icon: '⚡',
    controls: ['1+0', '1+1', '2+1'],
  },
  {
    name: 'Blitz',
    icon: '🔥',
    controls: ['3+0', '3+2', '5+0', '5+3'],
  },
  {
    name: 'Rapid',
    icon: '⏱',
    controls: ['10+0', '10+5', '15+10'],
  },
  {
    name: 'Classical',
    icon: '♚',
    controls: ['30+0', '30+20'],
  },
];

export default function Lobby() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [seeks, setSeeks] = useState<Seek[]>([]);
  const [activeSeeking, setActiveSeeking] = useState<string | null>(null);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);

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
        case 'challenged_by':
          // Show challenge notification
          break;
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
        send({
          type: 'seek',
          timeControl,
          rated: true,
          color: 'random',
        });
        setActiveSeeking(timeControl);
      }
    },
    [send, activeSeeking]
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Please sign in to play</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-accent-blue text-white px-6 py-2 font-semibold hover:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-text-primary">Play</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent-green' : 'bg-accent-red'}`} />
            <span className="text-text-muted text-xs">
              {isConnected ? 'Connected to lobby' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time control selection */}
          <div className="lg:col-span-2 space-y-4">
            {TIME_CONTROL_GROUPS.map((group) => (
              <div key={group.name}>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>{group.icon}</span>
                  {group.name}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {group.controls.map((tc) => (
                    <button
                      key={tc}
                      onClick={() => handleSeek(tc)}
                      className={`
                        p-4 border transition-all duration-150
                        ${activeSeeking === tc
                          ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                          : 'bg-surface border-border text-text-primary hover:border-accent-blue hover:bg-elevated'
                        }
                      `}
                    >
                      <span className="font-mono text-lg font-bold">{tc}</span>
                      {activeSeeking === tc && (
                        <p className="text-xs mt-1 animate-pulse">Seeking...</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom time control */}
            <div className="bg-surface border border-border p-4">
              <h3 className="text-sm font-semibold text-text-muted mb-2">Custom</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 10+5"
                  value={selectedControl || ''}
                  onChange={(e) => setSelectedControl(e.target.value)}
                  className="flex-1 bg-base border border-border text-text-primary px-3 py-2 font-mono text-sm"
                />
                <button
                  onClick={() => selectedControl && handleSeek(selectedControl)}
                  className="bg-accent-blue text-white px-4 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  Play
                </button>
              </div>
            </div>
          </div>

          {/* Open seeks */}
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
              Open Games
            </h2>
            <div className="bg-surface border border-border">
              {seeks.length === 0 ? (
                <div className="p-4 text-center text-text-muted text-sm">
                  No open seeks
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {seeks.filter((s) => s.userId !== user.id).map((seek) => (
                    <button
                      key={seek.id}
                      onClick={() => handleSeek(seek.timeControl)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-elevated transition-colors"
                    >
                      <div>
                        <span className="text-text-primary font-semibold text-sm">{seek.username}</span>
                        <span className="text-text-muted text-xs ml-2">({seek.rating})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-text-primary font-mono text-sm">{seek.timeControl}</span>
                        {seek.rated && (
                          <span className="text-accent-amber text-xs ml-1">Rated</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
