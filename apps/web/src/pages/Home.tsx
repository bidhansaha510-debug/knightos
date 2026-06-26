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
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Background glow decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Text + Actions */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <span className="px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full tracking-wider uppercase inline-block">
                Beta Version
              </span>
              <h1 className="text-6xl font-black font-display text-text-primary tracking-tight leading-none">
                Knight<span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">OS</span>
              </h1>
              <p className="text-text-muted text-xl max-w-lg font-light leading-relaxed">
                A premium, open-source chess platform. No bloat. No ads. Just pure chess.
              </p>
            </div>

            {/* Quick Play Buttons */}
            {user ? (
              <div className="space-y-5">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">
                  Choose Time Control
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_CONTROLS.map((tc) => (
                    <button
                      key={tc.label}
                      onClick={() => navigate('/play')}
                      onMouseEnter={() => setHoveredControl(tc.label)}
                      onMouseLeave={() => setHoveredControl(null)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-xl
                        bg-white/[0.03] border border-white/5 backdrop-blur-md
                        hover:border-accent-blue/40 hover:bg-white/[0.07] hover:scale-[1.03]
                        transition-all duration-200 shadow-sm
                        ${hoveredControl === tc.label ? 'border-accent-blue bg-white/[0.07] scale-[1.03]' : ''}
                      `}
                    >
                      <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">{tc.icon}</span>
                      <span className="text-text-primary font-mono text-base font-bold mt-2">
                        {tc.label}
                      </span>
                      <span className="text-text-muted text-xs font-medium tracking-wide mt-0.5">{tc.category}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-3">
                  <Link
                    to="/puzzle"
                    className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-4 text-center
                             hover:border-accent-green/40 hover:bg-white/[0.07] hover:scale-[1.02] transition-all duration-200 flex flex-col items-center justify-center gap-1 group"
                  >
                    <span className="text-accent-green text-2xl group-hover:scale-110 transition-transform duration-200">♟</span>
                    <p className="text-text-primary text-sm font-bold tracking-wide">Puzzles</p>
                  </Link>
                  <Link
                    to="/analysis"
                    className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-4 text-center
                             hover:border-accent-blue/40 hover:bg-white/[0.07] hover:scale-[1.02] transition-all duration-200 flex flex-col items-center justify-center gap-1 group"
                  >
                    <span className="text-accent-blue text-2xl group-hover:scale-110 transition-transform duration-200">🔍</span>
                    <p className="text-text-primary text-sm font-bold tracking-wide">Analysis</p>
                  </Link>
                  <Link
                    to="/leaderboard"
                    className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-4 text-center
                             hover:border-accent-amber/40 hover:bg-white/[0.07] hover:scale-[1.02] transition-all duration-200 flex flex-col items-center justify-center gap-1 group"
                  >
                    <span className="text-accent-amber text-2xl group-hover:scale-110 transition-transform duration-200">🏆</span>
                    <p className="text-text-primary text-sm font-bold tracking-wide">Leaderboard</p>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-md">
                <div className="flex gap-4">
                  <Link
                    to="/login"
                    className="btn-primary py-3.5 text-center flex-1 text-base tracking-wide"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login?register=true"
                    className="btn-secondary py-3.5 text-center flex-1 text-base tracking-wide"
                  >
                    Register
                  </Link>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                  <p className="text-text-muted text-sm font-light">
                    Play instantly with computer analysis. No account required.
                  </p>
                  <Link
                    to="/analysis"
                    className="text-accent-blue hover:text-blue-400 transition-colors text-sm font-bold flex items-center gap-1"
                  >
                    Open Analysis Board <span>→</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5 max-w-md">
              <div className="space-y-1">
                <p className="text-2xl font-black font-display text-accent-blue tracking-wide">∞</p>
                <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Games Played</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black font-display text-accent-green tracking-wide">3M+</p>
                <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Puzzles</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black font-display text-accent-amber tracking-wide">SF 10</p>
                <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Engine</p>
              </div>
            </div>
          </div>

          {/* Right: Demo Board */}
          <div className="flex-shrink-0 animate-fade-in">
            <div className="relative p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl board-glow backdrop-blur-md">
              <ChessBoard
                fen={demoFen}
                interactive={false}
                size={440}
              />
              <div className="absolute -bottom-3 left-6 bg-[#131522] border border-white/5 rounded-lg px-3.5 py-1.5 shadow-xl">
                <span className="text-text-primary text-xs font-mono font-medium tracking-wide">Italian Game: Giuoco Piano</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-white/5 bg-white/[0.01] backdrop-blur-sm relative z-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 hover:border-white/15 transition-all duration-300 group hover:translate-y-[-2px]">
              <div className="text-accent-blue text-4xl mb-4 transform group-hover:scale-115 transition-transform duration-300">⚡</div>
              <h3 className="text-text-primary font-bold font-display text-lg mb-3 tracking-wide">Real-Time Multiplayer</h3>
              <p className="text-text-muted text-sm font-light leading-relaxed">
                WebSocket-powered chess with server-side move verification and sub-second clocks.
                Experience seamless match matchmaking.
              </p>
            </div>
            <div className="glass-card p-8 hover:border-white/15 transition-all duration-300 group hover:translate-y-[-2px]">
              <div className="text-accent-green text-4xl mb-4 transform group-hover:scale-115 transition-transform duration-300">🧩</div>
              <h3 className="text-text-primary font-bold font-display text-lg mb-3 tracking-wide">Puzzle Trainer</h3>
              <p className="text-text-muted text-sm font-light leading-relaxed">
                Sharpen your chess tactics with handpicked puzzle sets. Spaced repetition for forks, pins, and checkmate patterns.
              </p>
            </div>
            <div className="glass-card p-8 hover:border-white/15 transition-all duration-300 group hover:translate-y-[-2px]">
              <div className="text-accent-amber text-4xl mb-4 transform group-hover:scale-115 transition-transform duration-300">🔬</div>
              <h3 className="text-text-primary font-bold font-display text-lg mb-3 tracking-wide">Stockfish Analysis</h3>
              <p className="text-text-muted text-sm font-light leading-relaxed">
                Engine analysis powered by Stockfish.js directly in your browser. Get eval scores, best moves, and alternative paths instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
