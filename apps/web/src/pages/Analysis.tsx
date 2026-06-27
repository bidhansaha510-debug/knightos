import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/Board/ChessBoard';
import MoveList from '../components/MoveList/MoveList';
import EvalBar from '../components/EvalBar/EvalBar';
import { useStockfish } from '../hooks/useStockfish';
import { getOpeningName } from '../utils/openings';
import { API_BASE } from '../config';
import type { GameMove } from '@knightos/shared';

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [inputFen, setInputFen] = useState('');
  const [inputPgn, setInputPgn] = useState('');
  const [chess, setChess] = useState(new Chess());
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isEngineOn, setIsEngineOn] = useState(false);

  const { isReady, isAnalyzing, evals, depth, analyze, stop } = useStockfish();

  // Fetch game from API if game ID is present in the URL
  useEffect(() => {
    if (!id) return;
    let active = true;
    const fetchGame = async () => {
      try {
        const response = await fetch(`${API_BASE}/games/${id}`);
        if (!response.ok) throw new Error('Failed to fetch game');
        const data = await response.json();
        if (!active) return;

        if (data.moves && data.moves.length > 0) {
          setMoves(data.moves);
          setCurrentMoveIndex(data.moves.length - 1);
          const lastMoveFen = data.moves[data.moves.length - 1].fen;
          setChess(new Chess(lastMoveFen));
          const lastUci = data.moves[data.moves.length - 1].uci;
          setLastMove({ from: lastUci.slice(0, 2), to: lastUci.slice(2, 4) });
          if (isEngineOn && isReady) {
            analyze(lastMoveFen);
          }
        } else if (data.fen) {
          const newChess = new Chess(data.fen);
          setChess(newChess);
          setMoves([]);
          setCurrentMoveIndex(-1);
          setLastMove(null);
          if (isEngineOn && isReady) analyze(data.fen);
        }
      } catch (err) {
        console.error('Error fetching game for analysis:', err);
      }
    };
    fetchGame();
    return () => {
      active = false;
    };
  }, [id, isReady, isEngineOn, analyze]);

  // Load from location.state fallback
  useEffect(() => {
    const state = location.state as { moves?: GameMove[], fen?: string } | null;
    if (!id && state) {
      if (state.moves && state.moves.length > 0) {
        setMoves(state.moves);
        setCurrentMoveIndex(state.moves.length - 1);
        const lastMoveFen = state.moves[state.moves.length - 1].fen;
        setChess(new Chess(lastMoveFen));
        const lastUci = state.moves[state.moves.length - 1].uci;
        setLastMove({ from: lastUci.slice(0, 2), to: lastUci.slice(2, 4) });
        if (isEngineOn && isReady) analyze(lastMoveFen);
      } else if (state.fen) {
        try {
          const newChess = new Chess(state.fen);
          setChess(newChess);
          setMoves([]);
          setCurrentMoveIndex(-1);
          setLastMove(null);
          if (isEngineOn && isReady) analyze(state.fen);
        } catch {}
      }
    }
  }, [location.state, id, isReady, isEngineOn, analyze]);

  const turnColor = chess.turn();
  const currentEval = evals.length > 0 ? evals[0] : null;
  const rawEvalCp = currentEval?.score.type === 'cp' ? currentEval.score.value : null;
  const rawEvalMate = currentEval?.score.type === 'mate' ? currentEval.score.value : null;

  const evalCp = rawEvalCp !== null ? (turnColor === 'b' ? -rawEvalCp : rawEvalCp) : null;
  const evalMate = rawEvalMate !== null ? (turnColor === 'b' ? -rawEvalMate : rawEvalMate) : null;

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

        const newMoves = [...moves.slice(0, currentMoveIndex + 1), newMove];
        setMoves(newMoves);
        setCurrentMoveIndex(newMoves.length - 1);

        if (isEngineOn && isReady) analyze(newChess.fen());

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

  const openingName = useMemo(() => {
    return getOpeningName(moves);
  }, [moves]);

  return (
    <div className="analysis-layout" style={{ background: 'var(--c-base)' }}>
      {/* Board section */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-4)',
        minWidth: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          width: '100%',
          maxWidth: 610,
        }}>
          {isEngineOn && (
            <EvalBar eval={evalCp} mate={evalMate} />
          )}
          <div style={{ flex: 1, aspectRatio: '1' }}>
            <ChessBoard
              fen={chess.fen()}
              flipped={flipped}
              interactive={true}
              onMove={handleMove}
              lastMove={lastMove}
              size={600}
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{
        width: 300,
        background: 'var(--c-surface)',
        borderLeft: '1px solid var(--c-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Engine toggle */}
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          borderBottom: '1px solid var(--c-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text)' }}>
              Stockfish
            </span>
            {isAnalyzing && (
              <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', marginLeft: 'var(--sp-2)' }}>
                d{depth}
              </span>
            )}
          </div>
          <button
            onClick={toggleEngine}
            disabled={!isReady}
            className={isEngineOn ? 'btn-play' : 'btn-secondary'}
            style={{ padding: '2px var(--sp-3)', fontSize: 'var(--tx-2xs)' }}
          >
            {isEngineOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Opening Name display */}
        {openingName && (
          <div
            className="opening-name-fade"
            style={{
              padding: 'var(--sp-2) var(--sp-4)',
              borderBottom: '1px solid var(--c-border)',
              background: 'var(--c-elevated)',
              fontSize: 'var(--tx-xs)',
              color: 'var(--c-gold)',
              fontWeight: 'var(--wt-medium)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={openingName}
          >
            📖 {openingName}
          </div>
        )}

        {/* Engine lines */}
        {isEngineOn && evals.length > 0 && (
          <div style={{
            padding: 'var(--sp-2) var(--sp-4)',
            borderBottom: '1px solid var(--c-border)',
          }}>
            {evals.map((ev) => {
              const displayCp = ev.score.type === 'cp' ? (turnColor === 'b' ? -ev.score.value : ev.score.value) : null;
              const displayMate = ev.score.type === 'mate' ? (turnColor === 'b' ? -ev.score.value : ev.score.value) : null;
              const isMate = ev.score.type === 'mate';
              const scoreVal = isMate ? displayMate! : displayCp!;

              const scoreColor = isMate
                ? (scoreVal > 0 ? 'var(--c-win)' : 'var(--c-loss)')
                : scoreVal > 50 ? 'var(--c-win)'
                : scoreVal < -50 ? 'var(--c-loss)'
                : 'var(--c-text-2)';

              const scoreText = isMate
                ? (scoreVal > 0 ? `M${scoreVal}` : `-M${Math.abs(scoreVal)}`)
                : (scoreVal >= 0 ? '+' : '') + (scoreVal / 100).toFixed(1);

              return (
                <div key={ev.multipv} style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 'var(--sp-2)',
                  fontSize: 'var(--tx-xs)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 2,
                }}>
                  <span style={{
                    minWidth: 40,
                    textAlign: 'right',
                    fontWeight: 'var(--wt-bold)',
                    color: scoreColor,
                  }}>
                    {scoreText}
                  </span>
                  <span style={{ color: 'var(--c-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.pv.slice(0, 8).join(' ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Move list */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MoveList
            moves={moves}
            currentMoveIndex={currentMoveIndex}
            onMoveClick={goToMove}
          />
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          borderTop: '1px solid var(--c-border)',
        }}>
          <button onClick={goFirst} className="btn-ghost" style={{ flex: 1, borderRadius: 0 }}>⟨⟨</button>
          <button onClick={goBack} className="btn-ghost" style={{ flex: 1, borderRadius: 0 }}>⟨</button>
          <button onClick={goForward} className="btn-ghost" style={{ flex: 1, borderRadius: 0 }}>⟩</button>
          <button onClick={goLast} className="btn-ghost" style={{ flex: 1, borderRadius: 0 }}>⟩⟩</button>
          <button onClick={() => setFlipped((f) => !f)} className="btn-ghost" style={{ borderRadius: 0 }}>⟳</button>
        </div>

        {/* FEN/PGN input */}
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          borderTop: '1px solid var(--c-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-2)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
            <input
              type="text"
              placeholder="Paste FEN…"
              value={inputFen}
              onChange={(e) => setInputFen(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-xs)', flex: 1, padding: '6px var(--sp-2)' }}
            />
            <button onClick={loadFen} className="btn-ghost" style={{ fontSize: 'var(--tx-xs)' }}>Load</button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
            <textarea
              placeholder="Paste PGN…"
              value={inputPgn}
              onChange={(e) => setInputPgn(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-xs)', flex: 1, padding: '6px var(--sp-2)', resize: 'none', height: 48 }}
            />
            <button onClick={loadPgn} className="btn-ghost" style={{ fontSize: 'var(--tx-xs)' }}>Load</button>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--c-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {chess.fen()}
          </div>
        </div>
      </div>
    </div>
  );
}
