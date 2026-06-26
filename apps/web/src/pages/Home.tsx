import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChessBoard from '../components/Board/ChessBoard';
import { useUserStore } from '../stores/userStore';

const TIME_CONTROLS = [
  { label: '1+0', category: 'Bullet' },
  { label: '2+1', category: 'Bullet' },
  { label: '3+0', category: 'Blitz' },
  { label: '3+2', category: 'Blitz' },
  { label: '5+0', category: 'Blitz' },
  { label: '5+3', category: 'Blitz' },
  { label: '10+0', category: 'Rapid' },
  { label: '15+10', category: 'Rapid' },
  { label: '30+0', category: 'Classical' },
];

export default function Home() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  const demoFen = 'r1bqkb1r/pppppppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-7) var(--space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-7)', alignItems: 'flex-start' }}>
        {/* Left: Play controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {user ? (
            <>
              <h2 style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--c-text-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-4)',
              }}>
                Play
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 120px)',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-6)',
              }}>
                {TIME_CONTROLS.map((tc) => (
                  <button
                    key={tc.label}
                    onClick={() => navigate('/play')}
                    style={{
                      width: 120,
                      height: 64,
                      background: 'var(--c-surface)',
                      border: '1px solid var(--c-border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'border-color var(--dur-fast) var(--ease-out)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--c-border-strong)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--weight-medium)',
                      color: 'var(--c-text)',
                    }}>
                      {tc.label}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--c-text-2)',
                      marginTop: 2,
                    }}>
                      {tc.category}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Link to="/puzzle" className="btn-secondary" style={{ textDecoration: 'none' }}>
                  Puzzles
                </Link>
                <Link to="/analysis" className="btn-secondary" style={{ textDecoration: 'none' }}>
                  Analysis
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--c-text)',
                marginBottom: 'var(--space-3)',
              }}>
                KnightOS
              </h1>
              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--c-text-2)',
                marginBottom: 'var(--space-5)',
                lineHeight: 'var(--leading-loose)',
              }}>
                Open-source chess platform with real-time multiplayer, puzzles, and Stockfish analysis.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
                  Sign In
                </Link>
                <Link to="/login?register=true" className="btn-secondary" style={{ textDecoration: 'none' }}>
                  Register
                </Link>
              </div>
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--c-border)' }}>
                <Link to="/analysis" style={{
                  color: 'var(--c-accent)',
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none',
                }}>
                  Open Analysis Board →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Right: Demo board */}
        <div style={{ width: 320, flexShrink: 0 }} className="hidden lg:block">
          <ChessBoard
            fen={demoFen}
            interactive={false}
            size={320}
          />
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--c-text-3)',
            marginTop: 'var(--space-2)',
          }}>
            Italian Game: Giuoco Piano
          </p>
        </div>
      </div>
    </div>
  );
}
