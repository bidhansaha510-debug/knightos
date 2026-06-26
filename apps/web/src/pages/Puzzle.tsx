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
    <div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-black font-display text-text-primary tracking-wide">
              Puzzle Trainer
            </h1>
            <p className="text-text-muted text-sm font-light mt-1">Train your pattern recognition with tactical exercises.</p>
          </div>
          <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-2.5 shadow-md">
            <div className="text-center border-r border-white/5 pr-4">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Streak</p>
              <p className="text-accent-green font-black font-mono text-lg mt-0.5 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                🔥 {streak}
              </p>
            </div>
            <div className="text-center">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Trainer Rating</p>
              <p className="text-text-primary font-black font-mono text-lg mt-0.5">
                {puzzleRating}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Board */}
          <div className="flex-shrink-0 relative">
            <div
              className="p-2.5 bg-white/[0.02] border border-white/5 rounded-3xl board-glow backdrop-blur-md transition-all duration-300"
              style={{
                boxShadow: boardFlash === 'red'
                  ? '0 0 30px rgba(239, 68, 68, 0.4)'
                  : boardFlash === 'green'
                  ? '0 0 30px rgba(16, 185, 129, 0.4)'
                  : '0 20px 50px rgba(0, 0, 0, 0.5)',
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
          <div className="flex-1 space-y-4 self-stretch flex flex-col">
            {puzzle && (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Puzzle Rating</span>
                  <span className="text-text-primary font-mono font-bold bg-white/[0.04] border border-white/5 px-2.5 py-0.5 rounded-lg">{Math.round(puzzle.rating)}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest block">Themes</span>
                  <div className="flex flex-wrap gap-1.5">
                    {puzzle.themes.map((theme) => (
                      <span
                        key={theme}
                        className="text-[10px] font-semibold bg-white/[0.03] border border-white/5 hover:border-white/10 px-2.5 py-1 text-text-muted rounded-md transition-colors"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Status messages */}
            {status === 'playing' && (
              <div className="glass-card border-blue-500/30 p-5 shadow-lg bg-blue-500/[0.02] flex-1 flex flex-col justify-center">
                <h3 className="text-blue-400 font-bold text-sm tracking-wide uppercase">Your Turn</h3>
                <p className="text-text-primary font-medium text-base mt-1">Find the best move for {sideToMove ? 'Black' : 'White'}.</p>
                {attempts > 0 && (
                  <div className="mt-3 text-xs bg-amber-500/10 border border-amber-500/20 text-accent-amber rounded-lg px-3 py-2 font-medium">
                    ⚠️ Try again ({2 - attempts} attempt{2 - attempts !== 1 ? 's' : ''} left)
                  </div>
                )}
              </div>
            )}

            {status === 'solved' && (
              <div className="glass-card border-emerald-500/30 p-5 shadow-lg bg-emerald-500/[0.02] flex-1 flex flex-col justify-center animate-slide-up">
                <h3 className="text-accent-green font-bold text-sm tracking-wide uppercase">✓ Correct!</h3>
                <p className="text-text-primary font-medium text-base mt-1">You solved it successfully.</p>
                <button
                  onClick={fetchPuzzle}
                  className="mt-4 btn-primary w-full py-3 text-xs uppercase tracking-wider"
                >
                  Next Puzzle →
                </button>
              </div>
            )}

            {status === 'wrong' && (
              <div className="glass-card border-red-500/30 p-5 shadow-lg bg-red-500/[0.02] flex-1 flex flex-col justify-center animate-slide-up">
                <h3 className="text-accent-red font-bold text-sm tracking-wide uppercase">✗ Incorrect</h3>
                <p className="text-text-primary font-medium text-base mt-1">You failed the puzzle solution.</p>
                <div className="flex flex-col gap-2.5 mt-4">
                  <button
                    onClick={showSolution}
                    className="btn-secondary w-full py-3 text-xs uppercase tracking-wider"
                  >
                    Show Solution
                  </button>
                  <button
                    onClick={fetchPuzzle}
                    className="btn-primary w-full py-3 text-xs uppercase tracking-wider"
                  >
                    Next Puzzle →
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="glass-card p-6 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-accent-blue animate-spin mb-3" />
                <p className="text-text-muted text-sm font-light">Loading next tactical puzzle...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
