import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';
import { Chess } from 'chess.js';
import ChessBoard from '../components/Board/ChessBoard';
import { useUserStore } from '../stores/userStore';

interface PuzzleData {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
}

export default function Puzzle() {
  const user = useUserStore((s) => s.user);
  const accessToken = useUserStore((s) => s.accessToken);
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [chess, setChess] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong' | 'solved'>('playing');
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [puzzleRating, setPuzzleRating] = useState(1500);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [startTime, setStartTime] = useState(Date.now());

  const fetchPuzzle = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/puzzles/next?rating=${puzzleRating}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPuzzle(data);
        const newChess = new Chess(data.fen);

        if (data.moves.length > 0) {
          const firstMove = data.moves[0];
          const from = firstMove.slice(0, 2);
          const to = firstMove.slice(2, 4);
          const promotion = firstMove.length > 4 ? firstMove[4] : undefined;

          setTimeout(() => {
            try {
              newChess.move({ from, to, promotion });
              setChess(new Chess(newChess.fen()));
              setLastMove({ from, to });
            } catch {}
          }, 500);

          setCurrentMoveIndex(1);
        }

        setStatus('playing');
        setAttempts(0);
        setStartTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to fetch puzzle:', err);
    } finally {
      setIsLoading(false);
    }
  }, [puzzleRating, accessToken]);

  useEffect(() => {
    fetchPuzzle();
  }, []);

  const handleMove = useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      if (!puzzle || status !== 'playing') return false;

      const expectedMove = puzzle.moves[currentMoveIndex];
      if (!expectedMove) return false;

      const userUci = from + to + (promotion || '');

      if (userUci === expectedMove) {
        try {
          const newChess = new Chess(chess.fen());
          newChess.move({ from, to, promotion });

          setLastMove({ from, to });
          setChess(new Chess(newChess.fen()));

          const nextMoveIndex = currentMoveIndex + 1;

          if (nextMoveIndex >= puzzle.moves.length) {
            setStatus('solved');
            setStreak((s) => s + 1);

            if (user && accessToken) {
              fetch(`${API_BASE}/puzzles/${puzzle.id}/attempt`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  solved: true,
                  timeTaken: Date.now() - startTime,
                }),
              });
            }
          } else {
            setCurrentMoveIndex(nextMoveIndex + 1);

            setTimeout(() => {
              const opponentMove = puzzle.moves[nextMoveIndex];
              if (opponentMove) {
                const oFrom = opponentMove.slice(0, 2);
                const oTo = opponentMove.slice(2, 4);
                const oPromo = opponentMove.length > 4 ? opponentMove[4] : undefined;
                try {
                  const afterOpponent = new Chess(newChess.fen());
                  afterOpponent.move({ from: oFrom, to: oTo, promotion: oPromo });
                  setChess(new Chess(afterOpponent.fen()));
                  setLastMove({ from: oFrom, to: oTo });
                } catch {}
              }
            }, 300);
          }
        } catch {
          return false;
        }
        return true;
      } else {
        setAttempts((a) => a + 1);

        if (attempts >= 1) {
          setStatus('wrong');
          setStreak(0);

          if (user && accessToken) {
            fetch(`${API_BASE}/puzzles/${puzzle.id}/attempt`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                solved: false,
                timeTaken: Date.now() - startTime,
              }),
            });
          }
        }
        return false;
      }
    },
    [puzzle, status, currentMoveIndex, chess, attempts, user, accessToken, startTime]
  );

  const showSolution = useCallback(() => {
    if (!puzzle) return;
    let tempChess = new Chess(chess.fen());
    for (let i = currentMoveIndex; i < puzzle.moves.length; i++) {
      const move = puzzle.moves[i];
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      const promo = move.length > 4 ? move[4] : undefined;
      try {
        tempChess.move({ from, to, promotion: promo });
      } catch {}
    }
    setChess(new Chess(tempChess.fen()));
    setStatus('wrong');
  }, [puzzle, chess, currentMoveIndex]);

  const sideToMove = puzzle ? (puzzle.fen.split(' ')[1] === 'w' ? false : true) : false;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', background: 'var(--c-base)' }}>
      {/* Board section — 60% */}
      <div style={{
        flex: '0 0 60%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}>
        <div style={{ width: '100%', maxWidth: 560, aspectRatio: '1' }}>
          <ChessBoard
            fen={chess.fen()}
            flipped={sideToMove}
            interactive={status === 'playing'}
            onMove={handleMove}
            lastMove={lastMove}
            size={560}
          />
        </div>
      </div>

      {/* Info panel — 40% */}
      <div style={{
        flex: '0 0 40%',
        background: 'var(--c-surface)',
        borderLeft: '1px solid var(--c-border)',
        padding: 'var(--space-5) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        overflowY: 'auto',
      }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
          <div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Streak
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--c-win)' }}>
              {streak}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Rating
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--c-text)' }}>
              {puzzleRating}
            </span>
          </div>
        </div>

        {/* Puzzle info */}
        {puzzle && (
          <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Puzzle Rating
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--c-text)' }}>
                {Math.round(puzzle.rating)}
              </span>
            </div>

            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 'var(--space-2)' }}>
              Themes
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
              {puzzle.themes.map((theme) => (
                <span
                  key={theme}
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-medium)',
                    color: 'var(--c-text-2)',
                    background: 'var(--c-elevated)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px var(--space-2)',
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {status === 'playing' && (
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text)' }}>
                Find the best move for {sideToMove ? 'Black' : 'White'}.
              </p>
              {attempts > 0 && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-warning)', marginTop: 'var(--space-2)' }}>
                  Try again ({2 - attempts} attempt{2 - attempts !== 1 ? 's' : ''} left)
                </p>
              )}
            </div>
          )}

          {status === 'solved' && (
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-win)', fontWeight: 'var(--weight-medium)' }}>
                ✓ Puzzle solved
              </p>
              <button
                onClick={fetchPuzzle}
                className="btn-primary"
                style={{ marginTop: 'var(--space-4)', width: '100%' }}
              >
                Next Puzzle
              </button>
            </div>
          )}

          {status === 'wrong' && (
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-loss)', fontWeight: 'var(--weight-medium)' }}>
                ✗ Incorrect
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <button onClick={showSolution} className="btn-secondary" style={{ width: '100%' }}>
                  Show Solution
                </button>
                <button onClick={fetchPuzzle} className="btn-primary" style={{ width: '100%' }}>
                  Next Puzzle
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
              Loading puzzle…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
