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
  const [ratingDiff, setRatingDiff] = useState<number | null>(null);
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
        setRatingDiff(null);
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
            setRatingDiff(12);
            setPuzzleRating((r) => r + 12);

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
          setRatingDiff(-8);
          setPuzzleRating((r) => Math.max(100, r - 8));

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
    <div className="puzzle-layout" style={{ background: 'var(--c-base)' }}>
      {/* Board section */}
      <div className="puzzle-board">
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

      <div className="puzzle-panel">
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 'var(--sp-6)' }}>
          <div>
            <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Streak
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-lg)', fontWeight: 'var(--wt-bold)', color: 'var(--c-win)' }}>
              {streak}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Rating
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-lg)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
                {puzzleRating}
              </span>
              {ratingDiff !== null && (
                <span
                  key={puzzle?.id + '-' + ratingDiff}
                  className="rating-change-badge"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--tx-xs)',
                    fontWeight: 'var(--wt-bold)',
                    color: ratingDiff >= 0 ? 'var(--c-win)' : 'var(--c-loss)',
                  }}
                >
                  {ratingDiff >= 0 ? `+${ratingDiff}` : ratingDiff}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Puzzle info */}
        {puzzle && (
          <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
              <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Puzzle Rating
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-sm)', color: 'var(--c-text)' }}>
                {Math.round(puzzle.rating)}
              </span>
            </div>

            <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 'var(--sp-2)' }}>
              Themes
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)' }}>
              {puzzle.themes.map((theme) => (
                <span
                  key={theme}
                  style={{
                    fontSize: 'var(--tx-xs)',
                    fontWeight: 'var(--wt-medium)',
                    color: 'var(--c-text-2)',
                    background: 'var(--c-elevated)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px var(--sp-2)',
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
              <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text)' }}>
                Find the best move for {sideToMove ? 'Black' : 'White'}.
              </p>
              {attempts > 0 && (
                <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-warn)', marginTop: 'var(--sp-2)' }}>
                  Try again ({2 - attempts} attempt{2 - attempts !== 1 ? 's' : ''} left)
                </p>
              )}
            </div>
          )}

          {status === 'solved' && (
            <div>
              <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-win)', fontWeight: 'var(--wt-medium)' }}>
                ✓ Puzzle solved
              </p>
              <button
                onClick={fetchPuzzle}
                className="btn-play"
                style={{ marginTop: 'var(--sp-4)', width: '100%', justifyContent: 'center' }}
              >
                Next Puzzle
              </button>
            </div>
          )}

          {status === 'wrong' && (
            <div>
              <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-loss)', fontWeight: 'var(--wt-medium)' }}>
                ✗ Incorrect
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
                <button onClick={showSolution} className="btn-secondary" style={{ width: '100%' }}>
                  Show Solution
                </button>
                <button onClick={fetchPuzzle} className="btn-play" style={{ width: '100%', justifyContent: 'center' }}>
                  Next Puzzle
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)' }}>
              Loading puzzle…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
