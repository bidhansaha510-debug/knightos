import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChessBoard from '../components/Board/ChessBoard';
import { useUserStore } from '../stores/userStore';

const ROTATING_GAMES = [
  {
    fen: 'r1bqk2r/pp2bppp/2nppn2/8/3NP3/2N5/PPP1BPPP/R1BQK2R w KQkq - 4 8',
    white: { name: 'Fischer, Bobby', rating: 2785 },
    black: { name: 'Spassky, Boris', rating: 2690 },
    opening: 'Sicilian Defense: Scheveningen Variant',
    whiteClock: 124000,
    blackClock: 98000,
  },
  {
    fen: 'r1bqk2r/ppp2ppp/2n1pn2/3p4/2PP4/2N2NP1/PP2PPP1/R2QKB1R b KQkq - 2 6',
    white: { name: 'Kasparov, Garry', rating: 2851 },
    black: { name: 'Karpov, Anatoly', rating: 2780 },
    opening: 'Queen\'s Gambit Declined: Catalan System',
    whiteClock: 45000,
    blackClock: 110000,
  },
  {
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    white: { name: 'Carlsen, Magnus', rating: 2882 },
    black: { name: 'Nakamura, Hikaru', rating: 2875 },
    opening: 'Ruy Lopez: Berlin Defense, l\'Hermet Variation',
    whiteClock: 180000,
    blackClock: 215000,
  },
];

const TIME_CONTROLS = [
  { label: '1+0', name: 'Bullet', sub: 'Hyper-fast chess action' },
  { label: '3+0', name: 'Blitz', sub: 'Standard tournament speed' },
  { label: '5+3', name: 'Blitz', sub: 'With 3-second increment' },
  { label: '10+0', name: 'Rapid', sub: 'Thorough strategic matches' },
];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Home() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [fadeState, setFadeState] = useState(true);
  const [selectedTimeIdx, setSelectedTimeIdx] = useState(1); // Default to Blitz 3+0

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState(false);
      setTimeout(() => {
        setActiveGameIdx((prev) => (prev + 1) % ROTATING_GAMES.length);
        setFadeState(true);
      }, 400); // Wait for dur-slow (400ms) fade out
    }, 60000); // Rotate every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const activeGame = ROTATING_GAMES[activeGameIdx];

  return (
    <div style={{
      maxWidth: 1040,
      margin: '0 auto',
      padding: 'var(--sp-5) var(--sp-4) var(--sp-7)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-6)',
    }}>
      {/* Page Headline using display serif */}
      <div style={{ textAlign: 'center', margin: 'var(--sp-3) 0 var(--sp-2)' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--tx-2xl)',
          fontWeight: 'var(--wt-bold)',
          color: 'var(--c-text)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          A Tournament Hall in your browser
        </h1>
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--tx-md)',
          color: 'var(--c-text-2)',
          marginTop: 'var(--sp-2)',
        }}>
          Experience the pure focus of chess. Compete, analyze, and master the board.
        </p>
      </div>

      {/* Main Grid: Left 60%, Right 40% */}
      <div className="home-layout">
        {/* Left Side: Live Game Hero */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          transition: 'opacity var(--dur-slow) var(--ease-inout)',
          opacity: fadeState ? 1 : 0,
        }}>
          {/* Black Player Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--sp-2) var(--sp-4)',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderBottom: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
                {activeGame.black.name}
              </span>
              <span style={{ fontSize: 'var(--tx-xs)', fontFamily: 'var(--font-mono)', color: 'var(--c-gold)' }}>
                {activeGame.black.rating}
              </span>
            </div>
            <span style={{ fontSize: 'var(--tx-sm)', fontFamily: 'var(--font-mono)', color: 'var(--c-text-2)' }}>
              {formatTime(activeGame.blackClock)}
            </span>
          </div>

          {/* Chess Board Container */}
          <div style={{ border: '1px solid var(--c-border)', background: 'var(--c-base)' }}>
            <ChessBoard
              fen={activeGame.fen}
              interactive={false}
              showCoordinates={true}
            />
          </div>

          {/* White Player Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--sp-2) var(--sp-4)',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderTop: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
                {activeGame.white.name}
              </span>
              <span style={{ fontSize: 'var(--tx-xs)', fontFamily: 'var(--font-mono)', color: 'var(--c-gold)' }}>
                {activeGame.white.rating}
              </span>
            </div>
            <span style={{ fontSize: 'var(--tx-sm)', fontFamily: 'var(--font-mono)', color: 'var(--c-text-2)' }}>
              {formatTime(activeGame.whiteClock)}
            </span>
          </div>

          {/* Spectating Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'var(--sp-2)',
            padding: '0 var(--sp-1)',
            userSelect: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)' }}>
              <span style={{ color: 'var(--c-win)', fontSize: '9px' }}>●</span>
              <span>12 spectating</span>
              <span style={{ color: 'var(--c-border-mid)' }}>·</span>
              <span style={{ color: 'var(--c-text-2)', fontStyle: 'italic' }}>{activeGame.opening}</span>
            </div>
            <Link to="/analysis" style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-gold)', textDecoration: 'none', fontWeight: 'var(--wt-medium)' }}>
              Click to spectate →
            </Link>
          </div>
        </div>

        {/* Right Side: Play Chess Panel */}
        <div style={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          padding: 'var(--sp-5)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid var(--c-border)', paddingBottom: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
            <h2 style={{ fontSize: 'var(--tx-lg)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
              Play Chess
            </h2>
            <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)' }}>
              1,248 players online
            </span>
          </div>

          {/* Time controls vertical stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
            {TIME_CONTROLS.map((tc, idx) => {
              const isSelected = selectedTimeIdx === idx;
              return (
                <button
                  key={tc.label}
                  onClick={() => setSelectedTimeIdx(idx)}
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
                    <div style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-bold)', color: isSelected ? 'var(--c-gold)' : 'var(--c-text)' }}>
                      {tc.name}
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

          {/* PLAY NOW Button (Gold, Uppercase, Large) */}
          <button
            onClick={() => navigate('/play')}
            className="btn-play"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Play Now
          </button>

          {/* Wait estimate & Sign in suggestion */}
          <div style={{ textAlign: 'center', fontSize: 'var(--tx-xs)', color: 'var(--c-text-3)', marginTop: 'var(--sp-3)' }}>
            ~6 seconds estimated wait time
          </div>

          {!user && (
            <div style={{
              textAlign: 'center',
              fontSize: 'var(--tx-xs)',
              color: 'var(--c-text-2)',
              marginTop: 'var(--sp-4)',
              paddingTop: 'var(--sp-4)',
              borderTop: '1px solid var(--c-border)',
            }}>
              or{' '}
              <Link to="/login" style={{ color: 'var(--c-gold)', textDecoration: 'none', fontWeight: 'var(--wt-bold)' }}>
                Sign In
              </Link>{' '}
              to save ratings & play in tournaments
            </div>
          )}
        </div>
      </div>

      {/* Below the Fold: Puzzle of the Day teaser (Zeigarnik hook) */}
      <div style={{ marginTop: 'var(--sp-5)' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--tx-lg)',
          fontWeight: 'var(--wt-bold)',
          color: 'var(--c-text)',
          marginBottom: 'var(--sp-3)',
        }}>
          Puzzle of the Day
        </h2>
        
        {/* cropped puzzle box with fade overlay */}
        <div style={{
          position: 'relative',
          height: 180, // Intentionally cropped
          overflow: 'hidden',
          border: '1px solid var(--c-border)',
          background: 'var(--c-surface)',
          padding: 'var(--sp-4)',
          display: 'flex',
          gap: 'var(--sp-5)',
          alignItems: 'flex-start',
        }}>
          <div style={{ flexShrink: 0, width: 140, height: 140, overflow: 'hidden', pointerEvents: 'none' }}>
            <ChessBoard
              fen="r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
              interactive={false}
              showCoordinates={false}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', paddingTop: '4px' }}>
            <span style={{ fontSize: 'var(--tx-2xs)', color: 'var(--c-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--wt-bold)' }}>
              Daily Challenge
            </span>
            <span style={{ fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
              White to move · Mate in 3
            </span>
            <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)', lineHeight: 1.45, maxWidth: 500 }}>
              Test your tactical vision. Can you find the precise mating sequence in this classic double-king-pawn line?
            </p>
            <Link to="/puzzle" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--tx-sm)', color: 'var(--c-gold)', textDecoration: 'none', fontWeight: 'var(--wt-medium)', marginTop: '4px' }}>
              Try it →
            </Link>
          </div>

          {/* Fade gradient to prompt clicking (Zeigarnik hook) */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'linear-gradient(transparent, var(--c-base))',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </div>
  );
}
