import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/Board/ChessBoard';
import GameClock from '../components/Clock/GameClock';
import MoveList from '../components/MoveList/MoveList';
import EvalBar from '../components/EvalBar/EvalBar';
import { useChessGame } from '../hooks/useChessGame';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { useStockfish } from '../hooks/useStockfish';
import { getOpeningName } from '../utils/openings';

function getTitleForName(name: string): string | undefined {
  if (!name) return undefined;
  if (name.startsWith('GM ')) return 'GM';
  if (name.startsWith('IM ')) return 'IM';
  if (name.startsWith('FM ')) return 'FM';
  const upper = name.toUpperCase();
  if (upper.includes('CARLSEN') || upper.includes('NAKAMURA') || upper.includes('KASPAROV') || upper.includes('KARPOV') || upper.includes('FISCHER') || upper.includes('SPASSKY')) {
    return 'GM';
  }
  return undefined;
}

interface PlayerRowProps {
  name: string;
  rating: number;
  timeMs: number;
  isActive: boolean;
  isPlayerTurn: boolean;
  ratingDiff?: number | null;
}

function PlayerRow({
  name, rating, timeMs, isActive, isPlayerTurn, ratingDiff
}: PlayerRowProps) {
  const title = getTitleForName(name);
  const displayName = title && name.startsWith(title + ' ') ? name.slice(title.length + 1) : name;
  const opacity = (isPlayerTurn && isActive) ? 1 : 0.35;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      padding: 'var(--sp-2) var(--sp-4)',
      opacity,
      transition: 'opacity var(--dur-base) var(--ease-out)',
    }}>
      {/* Avatar icon */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--c-elevated)',
        fontFamily: 'var(--font-ui)', fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-medium)',
        color: 'var(--c-text-2)', flexShrink: 0,
      }}>
        {(displayName || '?')[0].toUpperCase()}
      </div>

      {/* Title badge */}
      {title && (
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '10px',
          fontWeight: 'var(--wt-bold)',
          background: 'var(--c-gold)',
          color: 'var(--c-base)',
          padding: '1px 4px',
          borderRadius: 'var(--radius-sm)',
          lineHeight: 1.1,
          textTransform: 'uppercase',
          userSelect: 'none',
        }}>
          {title}
        </span>
      )}

      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text)' }}>
        {displayName || '—'}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)' }}>
        {rating || 1500}
      </span>

      {/* Rating Change Badge (+12 / -8) */}
      {ratingDiff !== undefined && ratingDiff !== null && (
        <span
          className="rating-change-badge"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--tx-xs)',
            fontWeight: 'var(--wt-bold)',
            color: ratingDiff >= 0 ? 'var(--c-win)' : 'var(--c-loss)',
            marginLeft: 'var(--sp-1)',
            userSelect: 'none',
          }}
        >
          {ratingDiff >= 0 ? `+${ratingDiff}` : ratingDiff}
        </span>
      )}

      <span style={{ flex: 1 }} />
      <GameClock timeMs={timeMs} isActive={isActive} isPlayerTurn={isPlayerTurn} />
    </div>
  );
}

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const { isFlipped, lastMove, toggleFlipped } = useGameStore();
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [ratingDiff, setRatingDiff] = useState<number | null>(null);
  const [isEngineOn, setIsEngineOn] = useState(false);

  const { isReady, evals, analyze, stop } = useStockfish();

  const handleGameOver = useCallback((result: string, termination: string) => {
    const messages: Record<string, string> = {
      checkmate: 'Checkmate',
      resignation: 'Resignation',
      timeout: 'Time out',
      stalemate: 'Stalemate',
      draw: 'Draw',
      agreement: 'Draw by agreement',
      abandoned: 'Game abandoned',
    };
    setGameOverMessage(`${messages[termination] || termination} — ${result}`);

    // Calculate rating difference
    const activeUser = useUserStore.getState().user;
    const currentGameState = useGameStore.getState().gameState;
    if (activeUser && currentGameState) {
      const isWhitePlayer = activeUser.id === currentGameState.whiteId;
      const isBlackPlayer = activeUser.id === currentGameState.blackId;
      if (isWhitePlayer || isBlackPlayer) {
        if (result === '1/2-1/2') {
          setRatingDiff(0);
        } else if ((result === '1-0' && isWhitePlayer) || (result === '0-1' && isBlackPlayer)) {
          setRatingDiff(12);
        } else {
          setRatingDiff(-8);
        }
      }
    }
  }, []);

  const { gameState, makeMove, resign, offerDraw, acceptDraw, declineDraw, drawOffer, isConnected } = useChessGame({
    gameId: id || null,
    onGameOver: handleGameOver,
  });

  const isWhite = user?.id === gameState?.whiteId;
  const isBlack = user?.id === gameState?.blackId;
  const isPlayer = isWhite || isBlack;
  const playerColor = isWhite ? 'white' : 'black';
  const isDrawOfferFromOpponent = drawOffer !== null && drawOffer !== playerColor;
  const isDrawOfferFromUs = drawOffer !== null && drawOffer === playerColor;

  // Run stockfish engine for analysis if engine is on and game is not active
  const isGameActive = gameState?.status === 'active';

  useEffect(() => {
    if (isEngineOn && isReady && gameState?.fen) {
      analyze(gameState.fen);
    }
    return () => {
      stop();
    };
  }, [isEngineOn, isReady, gameState?.fen, analyze, stop]);

  let checkSquare: string | null = null;
  let turnColor: 'w' | 'b' = 'w';
  if (gameState?.fen) {
    try {
      const tempChess = new Chess(gameState.fen);
      turnColor = tempChess.turn();
      if (tempChess.isCheck()) {
        const turn = tempChess.turn();
        const board = tempChess.board();
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === 'k' && piece.color === turn) {
              checkSquare = 'abcdefgh'[c] + String(8 - r);
            }
          }
        }
      }
    } catch {}
  }

  const currentEval = evals.length > 0 ? evals[0] : null;
  const rawEvalCp = currentEval?.score.type === 'cp' ? currentEval.score.value : null;
  const rawEvalMate = currentEval?.score.type === 'mate' ? currentEval.score.value : null;

  const evalCp = rawEvalCp !== null ? (turnColor === 'b' ? -rawEvalCp : rawEvalCp) : null;
  const evalMate = rawEvalMate !== null ? (turnColor === 'b' ? -rawEvalMate : rawEvalMate) : null;

  const openingName = useMemo(() => {
    return getOpeningName(gameState?.moves || []);
  }, [gameState?.moves]);

  if (!id) {
    return (
      <div style={{ minHeight: 'calc(100vh - 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--c-text-2)' }}>No game ID specified</p>
      </div>
    );
  }

  const topName = isFlipped ? gameState?.whiteUsername : gameState?.blackUsername;
  const topRating = isFlipped ? gameState?.whiteRating : gameState?.blackRating;
  const topClock = isFlipped ? (gameState?.whiteClock ?? 300000) : (gameState?.blackClock ?? 300000);
  const topTurn = isFlipped ? gameState?.turn === 'w' : gameState?.turn === 'b';

  const botName = isFlipped ? gameState?.blackUsername : gameState?.whiteUsername;
  const botRating = isFlipped ? gameState?.blackRating : gameState?.whiteRating;
  const botClock = isFlipped ? (gameState?.blackClock ?? 300000) : (gameState?.whiteClock ?? 300000);
  const botTurn = isFlipped ? gameState?.turn === 'b' : gameState?.turn === 'w';

  const isTopUs = user && ((isFlipped && user.id === gameState?.whiteId) || (!isFlipped && user.id === gameState?.blackId));
  const isBotUs = user && ((!isFlipped && user.id === gameState?.whiteId) || (isFlipped && user.id === gameState?.blackId));

  return (
    <>
      {/* Desktop layout */}
      <div className="game-desktop" style={{
        display: 'flex',
        height: 'calc(100vh - 48px)',
        background: 'var(--c-base)',
      }}>
        {/* Board — takes all remaining width, no padding between it and sidebar */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            width: '100%',
            maxWidth: 700,
            padding: 'var(--sp-4)',
          }}>
            {/* Eval Bar flush to the left edge of the board */}
            {isEngineOn && (
              <EvalBar eval={evalCp} mate={evalMate} />
            )}
            <div style={{ flex: 1, aspectRatio: '1' }}>
              <ChessBoard
                fen={gameState?.fen}
                flipped={isBlack || isFlipped}
                interactive={isPlayer && isGameActive}
                onMove={(from, to, promotion) => { makeMove(from, to, promotion); return true; }}
                lastMove={lastMove}
                checkSquare={checkSquare}
                size={680}
              />
            </div>
          </div>
        </div>

        {/* Sidebar — 280px, contains player cards + move list + controls */}
        <div style={{
          width: 280,
          background: 'var(--c-surface)',
          borderLeft: '1px solid var(--c-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          {/* Opponent (top of sidebar) */}
          <div style={{ borderBottom: '1px solid var(--c-border)' }}>
            <PlayerRow
              name={topName || 'Opponent'}
              rating={topRating || 1500}
              timeMs={topClock}
              isActive={isGameActive}
              isPlayerTurn={topTurn}
              ratingDiff={isTopUs ? ratingDiff : null}
            />
          </div>

          {/* Game meta */}
          <div style={{
            padding: 'var(--sp-2) var(--sp-4)',
            borderBottom: '1px solid var(--c-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', fontWeight: 'var(--wt-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {gameState?.timeControl || '—'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? 'var(--c-win)' : 'var(--c-loss)' }} />
              {gameState?.rated && (
                <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-warn)', fontWeight: 'var(--wt-medium)' }}>Rated</span>
              )}
            </div>
          </div>

          {/* Opening name display */}
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

          {/* Local Stockfish Engine Toggle for spectators/post-game */}
          {(!isPlayer || !isGameActive) && (
            <div style={{
              padding: 'var(--sp-2) var(--sp-4)',
              borderBottom: '1px solid var(--c-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--c-elevated)',
            }}>
              <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)', fontWeight: 'var(--wt-medium)' }}>
                Stockfish Engine
              </span>
              <button
                onClick={() => setIsEngineOn(!isEngineOn)}
                className="btn-secondary"
                style={{ padding: '2px 8px', fontSize: 'var(--tx-2xs)' }}
              >
                {isEngineOn ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {/* Move list */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <MoveList moves={gameState?.moves || []} />
          </div>

          {/* Player (bottom of sidebar) */}
          <div style={{ borderTop: '1px solid var(--c-border)' }}>
            <PlayerRow
              name={botName || 'You'}
              rating={botRating || 1500}
              timeMs={botClock}
              isActive={isGameActive}
              isPlayerTurn={botTurn}
              ratingDiff={isBotUs ? ratingDiff : null}
            />
          </div>

          {/* Draw offer */}
          {isDrawOfferFromOpponent && isGameActive && (
            <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderTop: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}>
              <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text)', marginBottom: 'var(--sp-2)' }}>Opponent offers a draw</p>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                <button onClick={acceptDraw} className="btn-play" style={{ flex: 1, padding: '8px var(--sp-3)', fontSize: 'var(--tx-xs)' }}>Accept</button>
                <button onClick={declineDraw} className="btn-secondary" style={{ flex: 1, padding: '8px' }}>Decline</button>
              </div>
            </div>
          )}

          {/* Game over */}
          {gameOverMessage && (
            <div style={{ padding: 'var(--sp-4)', borderTop: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}>
              <p style={{ fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text)', marginBottom: 'var(--sp-1)' }}>Game Over</p>
              <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)', marginBottom: 'var(--sp-3)' }}>{gameOverMessage}</p>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                <button onClick={() => { setGameOverMessage(null); setRatingDiff(null); navigate('/play'); }} className="btn-play" style={{ flex: 1, padding: '8px var(--sp-3)', fontSize: 'var(--tx-xs)' }}>New Game</button>
                <button onClick={() => navigate(`/games/${id}`, { state: { moves: gameState?.moves } })} className="btn-secondary" style={{ flex: 1 }}>Analyze</button>
              </div>
            </div>
          )}

          {/* Controls */}
          {isPlayer && isGameActive && !gameOverMessage && (
            <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 'var(--sp-2)' }}>
              <button onClick={toggleFlipped} className="btn-ghost" style={{ flex: 1 }}>Flip</button>
              <button
                onClick={offerDraw}
                disabled={isDrawOfferFromUs}
                className="btn-ghost"
                style={{ flex: 1, color: isDrawOfferFromUs ? 'var(--c-warn)' : undefined, opacity: isDrawOfferFromUs ? 0.6 : 1 }}
              >
                {isDrawOfferFromUs ? 'Pending' : 'Draw'}
              </button>
              <button onClick={() => { if (confirm('Resign this game?')) resign(); }} className="btn-ghost" style={{ flex: 1 }}>
                Resign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile layout styles injected via <style> tag */}
      <style>{`
        @media (max-width: 768px) {
          .game-desktop {
            flex-direction: column !important;
            height: auto !important;
            min-height: calc(100vh - 48px);
          }
          .game-desktop > div:first-child {
            padding: 0 !important;
          }
          .game-desktop > div:last-child {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid var(--c-border);
          }
        }
      `}</style>
    </>
  );
}
