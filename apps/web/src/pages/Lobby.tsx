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
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="glass-card p-10 text-center max-w-sm w-full shadow-2xl border border-white/5 space-y-6 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-3xl mx-auto shadow-md">
            ⚔️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-text-primary">Sign In Required</h2>
            <p className="text-text-muted text-sm font-light">
              You must be logged in to access online matchmaking and play against other players.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full py-3 text-sm uppercase tracking-wider"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute top-[-10%] left-[20%] w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-black font-display text-text-primary tracking-wide">
              Create a Game
            </h1>
            <p className="text-text-muted text-sm font-light mt-1">Select a time control to join the matchmaking pool.</p>
          </div>
          <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 rounded-full px-4 py-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-accent-green shadow-[0_0_8px_#10b981]' : 'bg-accent-red animate-pulse'}`} />
            <span className="text-text-primary text-xs font-semibold tracking-wide">
              {isConnected ? 'Lobby Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Time control selection */}
          <div className="lg:col-span-2 space-y-6">
            {TIME_CONTROL_GROUPS.map((group) => (
              <div key={group.name} className="glass-card p-5">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-lg filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.1)]">{group.icon}</span>
                  {group.name}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {group.controls.map((tc) => (
                    <button
                      key={tc}
                      onClick={() => handleSeek(tc)}
                      className={`
                        p-5 rounded-2xl border transition-all duration-300 font-mono text-lg font-bold flex flex-col items-center justify-center relative overflow-hidden
                        ${activeSeeking === tc
                          ? 'bg-blue-500/25 border-accent-blue text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.35)]'
                          : 'bg-white/[0.02] border-white/5 text-text-primary hover:border-accent-blue/40 hover:bg-white/[0.08] hover:scale-[1.03]'
                        }
                      `}
                    >
                      <span>{tc}</span>
                      {activeSeeking === tc && (
                        <span className="absolute bottom-2 text-[10px] text-blue-400 uppercase tracking-widest font-sans font-bold animate-pulse">Seeking...</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom time control */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Custom Time Control</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. 10+5"
                  value={selectedControl || ''}
                  onChange={(e) => setSelectedControl(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-white/5 text-text-primary px-4 py-2.5 rounded-xl font-mono text-base focus:border-accent-blue"
                />
                <button
                  onClick={() => selectedControl && handleSeek(selectedControl)}
                  className="btn-primary px-6 py-2.5 text-sm uppercase tracking-wider"
                >
                  Play Custom
                </button>
              </div>
            </div>
          </div>

          {/* Open seeks */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Available Seeks
            </h2>
            <div className="glass-card overflow-hidden">
              {seeks.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm font-light">
                  <div className="text-2xl mb-2">⏳</div>
                  No active seekers.
                  <br />
                  Start a seek to invite others!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {seeks.filter((s) => s.userId !== user.id).map((seek) => (
                    <button
                      key={seek.id}
                      onClick={() => handleSeek(seek.timeControl)}
                      className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-white/[0.04] transition-all duration-200 text-left group"
                    >
                      <div className="space-y-1">
                        <span className="text-text-primary font-bold text-sm group-hover:text-blue-400 transition-colors">{seek.username}</span>
                        <div className="text-[11px] text-text-muted font-medium uppercase tracking-wider">Rating: {seek.rating}</div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-text-primary font-mono text-sm bg-white/[0.04] border border-white/5 rounded-lg px-2.5 py-1 font-bold">{seek.timeControl}</span>
                        {seek.rated && (
                          <span className="text-[10px] text-accent-amber bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Rated</span>
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
