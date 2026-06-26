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
  const [boardFlash, setBoardFlash] = useState<string | null>(null);
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

        // The first move is the opponent's "mistake" — play it automatically
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

          setCurrentMoveIndex(1); // User starts from move index 1
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
        // Correct move!
        try {
          const newChess = new Chess(chess.fen());
          newChess.move({ from, to, promotion });

          setLastMove({ from, to });
          setChess(new Chess(newChess.fen()));

          const nextMoveIndex = currentMoveIndex + 1;

          if (nextMoveIndex >= puzzle.moves.length) {
            // Puzzle solved!
            setStatus('solved');
            setStreak((s) => s + 1);
            setBoardFlash('green');
            setTimeout(() => setBoardFlash(null), 500);

            // Submit attempt
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
            // Play the opponent's response
            setCurrentMoveIndex(nextMoveIndex + 1); // Skip opponent's response

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
        // Wrong move
        setAttempts((a) => a + 1);
        setBoardFlash('red');
        setTimeout(() => setBoardFlash(null), 500);

        if (attempts >= 1) {
          // Show solution after 2 wrong attempts
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
    // Play remaining moves
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

  // Determine board orientation
  const sideToMove = puzzle ? (puzzle.fen.split(' ')[1] === 'w' ? false : true) : false;

  return (
    <div className="min-h-screen bg-base p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Puzzle Trainer
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-text-muted text-xs">Streak</p>
              <p className="text-accent-green font-bold font-mono">{streak}</p>
            </div>
            <div className="text-center">
              <p className="text-text-muted text-xs">Rating</p>
              <p className="text-text-primary font-bold font-mono">{puzzleRating}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Board */}
          <div className="flex-shrink-0 relative">
            <div
              className="transition-all duration-200"
              style={{
                boxShadow: boardFlash === 'red'
                  ? '0 0 0 4px rgba(239, 68, 68, 0.6)'
                  : boardFlash === 'green'
                  ? '0 0 0 4px rgba(34, 197, 94, 0.6)'
                  : 'none',
              }}
            >
              <ChessBoard
                fen={chess.fen()}
                flipped={sideToMove}
                interactive={status === 'playing'}
                onMove={handleMove}
                lastMove={lastMove}
                size={480}
              />
            </div>
          </div>

          {/* Puzzle info panel */}
          <div className="flex-1 space-y-4">
            {puzzle && (
              <div className="bg-surface border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-muted text-xs uppercase tracking-wider">Puzzle Rating</span>
                  <span className="text-text-primary font-mono font-bold">{Math.round(puzzle.rating)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {puzzle.themes.map((theme) => (
                    <span
                      key={theme}
                      className="text-xs bg-elevated px-2 py-0.5 text-text-muted border border-border"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status messages */}
            {status === 'playing' && (
              <div className="bg-surface border border-accent-blue px-4 py-3">
                <p className="text-accent-blue font-semibold text-sm">Your turn — find the best move</p>
                {attempts > 0 && (
                  <p className="text-accent-amber text-xs mt-1">Try again ({2 - attempts} attempt{2 - attempts !== 1 ? 's' : ''} left)</p>
                )}
              </div>
            )}

            {status === 'solved' && (
              <div className="bg-accent-green/10 border border-accent-green/30 px-4 py-3 animate-slide-up">
                <p className="text-accent-green font-semibold">✓ Correct!</p>
                <button
                  onClick={fetchPuzzle}
                  className="mt-2 w-full bg-accent-green text-white py-2 font-semibold hover:bg-green-600 transition-colors"
                >
                  Next Puzzle →
                </button>
              </div>
            )}

            {status === 'wrong' && (
              <div className="bg-accent-red/10 border border-accent-red/30 px-4 py-3 animate-slide-up">
                <p className="text-accent-red font-semibold">✗ Incorrect</p>
                <button
                  onClick={showSolution}
                  className="mt-2 w-full bg-surface border border-border text-text-primary py-2 text-sm hover:bg-elevated transition-colors"
                >
                  Show Solution
                </button>
                <button
                  onClick={fetchPuzzle}
                  className="mt-1 w-full bg-accent-blue text-white py-2 text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  Next Puzzle →
                </button>
              </div>
            )}

            {isLoading && (
              <div className="bg-surface border border-border px-4 py-3 text-center">
                <p className="text-text-muted text-sm animate-pulse">Loading puzzle...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
