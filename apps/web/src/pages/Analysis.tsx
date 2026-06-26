import { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../components/Board/ChessBoard';
import MoveList from '../components/MoveList/MoveList';
import EvalBar from '../components/EvalBar/EvalBar';
import { useStockfish } from '../hooks/useStockfish';
import type { GameMove } from '@knightos/shared';

export default function Analysis() {
  const [inputFen, setInputFen] = useState('');
  const [inputPgn, setInputPgn] = useState('');
  const [chess, setChess] = useState(new Chess());
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isEngineOn, setIsEngineOn] = useState(false);

  const { isReady, isAnalyzing, evals, bestMove, depth, analyze, stop } = useStockfish();

  // Current eval for the eval bar
  const currentEval = evals.length > 0 ? evals[0] : null;
  const evalCp = currentEval?.score.type === 'cp' ? currentEval.score.value : null;
  const evalMate = currentEval?.score.type === 'mate' ? currentEval.score.value : null;

  // Auto-analyze on position change
  const currentFen = chess.fen();
  const prevFen = useMemo(() => currentFen, [currentFen]);

  const toggleEngine = useCallback(() => {
    if (isEngineOn) {
      stop();
      setIsEngineOn(false);
    } else {
      if (isReady) {
        analyze(chess.fen());
        setIsEngineOn(true);
      }
    }
  }, [isEngineOn, isReady, analyze, stop, chess]);

  const handleMove = useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      try {
        const newChess = new Chess(chess.fen());
        const move = newChess.move({ from, to, promotion });
        if (!move) return false;

        setChess(new Chess(newChess.fen()));
        setLastMove({ from, to });

        const newMove: GameMove = {
          san: move.san,
          uci: from + to + (promotion || ''),
          fen: newChess.fen(),
        };

        // Truncate moves after current index and add new move
        const newMoves = [...moves.slice(0, currentMoveIndex + 1), newMove];
        setMoves(newMoves);
        setCurrentMoveIndex(newMoves.length - 1);

        if (isEngineOn && isReady) {
          analyze(newChess.fen());
        }

        return true;
      } catch {
        return false;
      }
    },
    [chess, moves, currentMoveIndex, isEngineOn, isReady, analyze]
  );

  const goToMove = useCallback(
    (index: number) => {
      if (index < 0) {
        // Go to initial position
        const initial = moves.length > 0 ? new Chess() : chess;
        setChess(new Chess(initial.fen()));
        setCurrentMoveIndex(-1);
        setLastMove(null);
        if (isEngineOn && isReady) analyze(initial.fen());
      } else if (index < moves.length) {
        setChess(new Chess(moves[index].fen));
        setCurrentMoveIndex(index);
        if (index > 0) {
          const uci = moves[index].uci;
          setLastMove({ from: uci.slice(0, 2), to: uci.slice(2, 4) });
        }
        if (isEngineOn && isReady) analyze(moves[index].fen);
      }
    },
    [moves, chess, isEngineOn, isReady, analyze]
  );

  const goBack = () => goToMove(currentMoveIndex - 1);
  const goForward = () => goToMove(currentMoveIndex + 1);
  const goFirst = () => goToMove(-1);
  const goLast = () => goToMove(moves.length - 1);

  const loadFen = useCallback(() => {
    try {
      const newChess = new Chess(inputFen);
      setChess(newChess);
      setMoves([]);
      setCurrentMoveIndex(-1);
      setLastMove(null);
      if (isEngineOn && isReady) analyze(inputFen);
    } catch {
      alert('Invalid FEN');
    }
  }, [inputFen, isEngineOn, isReady, analyze]);

  const loadPgn = useCallback(() => {
    try {
      const newChess = new Chess();
      newChess.loadPgn(inputPgn);
      const history = newChess.history({ verbose: true });

      const loadedMoves: GameMove[] = [];
      const replay = new Chess();
      for (const move of history) {
        replay.move(move.san);
        loadedMoves.push({
          san: move.san,
          uci: move.from + move.to + (move.promotion || ''),
          fen: replay.fen(),
        });
      }

      setChess(new Chess(newChess.fen()));
      setMoves(loadedMoves);
      setCurrentMoveIndex(loadedMoves.length - 1);
      if (loadedMoves.length > 0) {
        const last = loadedMoves[loadedMoves.length - 1];
        setLastMove({ from: last.uci.slice(0, 2), to: last.uci.slice(2, 4) });
      }
      if (isEngineOn && isReady) analyze(newChess.fen());
    } catch {
      alert('Invalid PGN');
    }
  }, [inputPgn, isEngineOn, isReady, analyze]);

  // Best move arrow
  const bestMoveArrow = bestMove && bestMove.length >= 4
    ? [{ from: bestMove.slice(0, 2), to: bestMove.slice(2, 4), color: 'rgba(34, 197, 94, 0.7)' }]
    : [];

  return (
    <div className="min-h-screen bg-base p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold font-display text-text-primary mb-6">Analysis Board</h1>

        <div className="flex gap-4 items-start">
          {/* Eval bar */}
          {isEngineOn && (
            <EvalBar
              eval={evalCp}
              mate={evalMate}
              height={560}
            />
          )}

          {/* Board */}
          <div className="flex-shrink-0">
            <ChessBoard
              fen={chess.fen()}
              flipped={flipped}
              interactive={true}
              onMove={handleMove}
              lastMove={lastMove}
              arrows={isEngineOn ? bestMoveArrow : []}
              size={560}
            />
          </div>

          {/* Side panel */}
          <div className="flex-1 space-y-3 min-w-[280px]">
            {/* Engine toggle */}
            <div className="bg-surface border border-border p-3 flex items-center justify-between">
              <div>
                <span className="text-text-primary text-sm font-semibold">Stockfish 16</span>
                {isAnalyzing && (
                  <span className="text-text-muted text-xs ml-2">Depth {depth}</span>
                )}
              </div>
              <button
                onClick={toggleEngine}
                disabled={!isReady}
                className={`
                  px-3 py-1 text-sm font-semibold transition-colors
                  ${isEngineOn
                    ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                    : 'bg-surface border border-border text-text-muted hover:text-text-primary'
                  }
                `}
              >
                {isEngineOn ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Engine lines */}
            {isEngineOn && evals.length > 0 && (
              <div className="bg-surface border border-border p-3 space-y-1">
                {evals.map((ev) => (
                  <div key={ev.multipv} className="flex items-start gap-2 text-xs">
                    <span className={`
                      font-mono font-bold min-w-[48px] text-right
                      ${ev.score.type === 'mate'
                        ? ev.score.value > 0 ? 'text-accent-green' : 'text-accent-red'
                        : ev.score.value > 50 ? 'text-accent-green'
                        : ev.score.value < -50 ? 'text-accent-red'
                        : 'text-text-muted'
                      }
                    `}>
                      {ev.score.type === 'mate'
                        ? `M${Math.abs(ev.score.value)}`
                        : (ev.score.value >= 0 ? '+' : '') + (ev.score.value / 100).toFixed(1)
                      }
                    </span>
                    <span className="text-text-muted font-mono truncate">
                      {ev.pv.slice(0, 8).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Move list */}
            <div className="bg-surface border border-border min-h-[200px] max-h-[300px]">
              <MoveList
                moves={moves}
                currentMoveIndex={currentMoveIndex}
                onMoveClick={goToMove}
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-1">
              <button onClick={goFirst} className="flex-1 bg-surface border border-border py-2 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors text-sm">⟨⟨</button>
              <button onClick={goBack} className="flex-1 bg-surface border border-border py-2 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors text-sm">⟨</button>
              <button onClick={goForward} className="flex-1 bg-surface border border-border py-2 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors text-sm">⟩</button>
              <button onClick={goLast} className="flex-1 bg-surface border border-border py-2 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors text-sm">⟩⟩</button>
              <button onClick={() => setFlipped((f) => !f)} className="bg-surface border border-border px-3 py-2 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors text-sm">⟳</button>
            </div>

            {/* FEN / PGN input */}
            <div className="space-y-2">
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Paste FEN..."
                  value={inputFen}
                  onChange={(e) => setInputFen(e.target.value)}
                  className="flex-1 bg-base border border-border text-text-primary px-2 py-1.5 font-mono text-xs"
                />
                <button
                  onClick={loadFen}
                  className="bg-surface border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
                >
                  Load
                </button>
              </div>
              <div className="flex gap-1">
                <textarea
                  placeholder="Paste PGN..."
                  value={inputPgn}
                  onChange={(e) => setInputPgn(e.target.value)}
                  className="flex-1 bg-base border border-border text-text-primary px-2 py-1.5 font-mono text-xs resize-none h-16"
                />
                <button
                  onClick={loadPgn}
                  className="bg-surface border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
                >
                  Load
                </button>
              </div>
              <div className="text-xs text-text-muted font-mono truncate px-1">
                {chess.fen()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
