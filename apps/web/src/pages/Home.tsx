import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/Board/ChessBoard';
import { useUserStore } from '../stores/userStore';

const TIME_CONTROLS = [
  { label: '1+0', category: 'Bullet', icon: '⚡' },
  { label: '2+1', category: 'Bullet', icon: '⚡' },
  { label: '3+0', category: 'Blitz', icon: '🔥' },
  { label: '3+2', category: 'Blitz', icon: '🔥' },
  { label: '5+0', category: 'Blitz', icon: '🔥' },
  { label: '5+3', category: 'Blitz', icon: '🔥' },
  { label: '10+0', category: 'Rapid', icon: '⏱' },
  { label: '15+10', category: 'Rapid', icon: '⏱' },
  { label: '30+0', category: 'Classical', icon: '♚' },
];

export default function Home() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);

  // Demo board with a famous position
  const demoFen = 'r1bqkb1r/pppppppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';

  return (
    <div className="min-h-screen bg-base">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left: Text + Actions */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold font-display text-text-primary tracking-tight">
                Knight<span className="text-accent-blue">OS</span>
              </h1>
              <p className="text-text-muted text-lg">
                Open-source chess. No bloat. No ads. Just chess.
              </p>
            </div>

            {/* Quick Play Buttons */}
            {user ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                  Quick Play
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_CONTROLS.map((tc) => (
                    <button
                      key={tc.label}
                      onClick={() => navigate('/play')}
                      onMouseEnter={() => setHoveredControl(tc.label)}
                      onMouseLeave={() => setHoveredControl(null)}
                      className={`
                        flex flex-col items-center justify-center p-3
                        bg-surface border border-border
                        hover:border-accent-blue hover:bg-elevated
                        transition-all duration-150
                        ${hoveredControl === tc.label ? 'border-accent-blue bg-elevated' : ''}
                      `}
                    >
                      <span className="text-lg">{tc.icon}</span>
                      <span className="text-text-primary font-mono text-sm font-semibold mt-1">
                        {tc.label}
                      </span>
                      <span className="text-text-muted text-xs">{tc.category}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    to="/puzzle"
                    className="flex-1 bg-surface border border-border px-4 py-3 text-center
                             hover:border-accent-green hover:bg-elevated transition-all duration-150"
                  >
                    <span className="text-accent-green text-lg">♟</span>
                    <p className="text-text-primary text-sm font-semibold mt-1">Puzzles</p>
                  </Link>
                  <Link
                    to="/analysis"
                    className="flex-1 bg-surface border border-border px-4 py-3 text-center
                             hover:border-accent-blue hover:bg-elevated transition-all duration-150"
                  >
                    <span className="text-accent-blue text-lg">🔍</span>
                    <p className="text-text-primary text-sm font-semibold mt-1">Analysis</p>
                  </Link>
                  <Link
                    to="/leaderboard"
                    className="flex-1 bg-surface border border-border px-4 py-3 text-center
                             hover:border-accent-amber hover:bg-elevated transition-all duration-150"
                  >
                    <span className="text-accent-amber text-lg">🏆</span>
                    <p className="text-text-primary text-sm font-semibold mt-1">Leaderboard</p>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="bg-accent-blue text-white px-8 py-3 font-semibold
                             hover:bg-blue-600 transition-colors text-center flex-1"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login?register=true"
                    className="bg-surface border border-border text-text-primary px-8 py-3 font-semibold
                             hover:bg-elevated transition-colors text-center flex-1"
                  >
                    Register
                  </Link>
                </div>
                <p className="text-text-muted text-sm">
                  Play instantly. No account required for analysis.
                </p>
                <div className="flex gap-2">
                  <Link
                    to="/analysis"
                    className="bg-surface border border-border px-4 py-2 text-sm text-text-primary
                             hover:border-accent-blue transition-colors"
                  >
                    Analysis Board →
                  </Link>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 pt-4 border-t border-border">
              <div>
                <p className="text-2xl font-bold font-display text-accent-blue">∞</p>
                <p className="text-text-muted text-xs">Games Played</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-accent-green">3M+</p>
                <p className="text-text-muted text-xs">Puzzles</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-accent-amber">SF 16</p>
                <p className="text-text-muted text-xs">Engine</p>
              </div>
            </div>
          </div>

          {/* Right: Demo Board */}
          <div className="flex-shrink-0">
            <div className="relative">
              <ChessBoard
                fen={demoFen}
                interactive={false}
                size={420}
              />
              <div className="absolute -bottom-2 -right-2 bg-surface border border-border px-3 py-1">
                <span className="text-text-muted text-xs font-mono">Italian Game: Giuoco Piano</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-border p-6 animate-fade-in">
              <div className="text-accent-blue text-2xl mb-3">⚡</div>
              <h3 className="text-text-primary font-semibold font-display mb-2">Real-Time Multiplayer</h3>
              <p className="text-text-muted text-sm">
                WebSocket-powered gameplay with server-side validation and precision clocks.
                No lag. No cheating.
              </p>
            </div>
            <div className="bg-surface border border-border p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="text-accent-green text-2xl mb-3">🧩</div>
              <h3 className="text-text-primary font-semibold font-display mb-2">Puzzle Trainer</h3>
              <p className="text-text-muted text-sm">
                Over 3 million tactical puzzles with spaced repetition. Forks, pins, skewers,
                and more. Track your progress.
              </p>
            </div>
            <div className="bg-surface border border-border p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="text-accent-amber text-2xl mb-3">🔬</div>
              <h3 className="text-text-primary font-semibold font-display mb-2">Stockfish Analysis</h3>
              <p className="text-text-muted text-sm">
                Stockfish 16 WASM runs in your browser. Analyze any position with
                depth 20+ and multi-PV lines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
