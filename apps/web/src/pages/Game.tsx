import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/Board/ChessBoard';
import GameClock from '../components/Clock/GameClock';
import MoveList from '../components/MoveList/MoveList';
import { useChessGame } from '../hooks/useChessGame';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';

function PlayerRow({
  name, rating, timeMs, isActive, isPlayerTurn
}: {
  name: string; rating: number; timeMs: number; isActive: boolean; isPlayerTurn: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      padding: 'var(--space-2) var(--space-4)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--c-elevated)',
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
        color: 'var(--c-text-2)', flexShrink: 0,
      }}>
        {(name || '?')[0].toUpperCase()}
      </div>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-medium)', color: 'var(--c-text)' }}>
        {name || '—'}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
        {rating || 1500}
      </span>
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

  let checkSquare: string | null = null;
  if (gameState?.fen) {
    try {
      const tempChess = new Chess(gameState.fen);
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

  const isGameActive = gameState?.status === 'active';

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
          <div style={{ width: '100%', maxWidth: 680, aspectRatio: '1', padding: 'var(--space-4)' }}>
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
            />
          </div>

          {/* Game meta */}
          <div style={{
            padding: 'var(--space-2) var(--space-4)',
            borderBottom: '1px solid var(--c-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {gameState?.timeControl || '—'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? 'var(--c-win)' : 'var(--c-loss)' }} />
              {gameState?.rated && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-warning)', fontWeight: 'var(--weight-medium)' }}>Rated</span>
              )}
            </div>
          </div>

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
            />
          </div>

          {/* Draw offer */}
          {isDrawOfferFromOpponent && isGameActive && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text)', marginBottom: 'var(--space-2)' }}>Opponent offers a draw</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button onClick={acceptDraw} className="btn-primary" style={{ flex: 1, padding: '8px' }}>Accept</button>
                <button onClick={declineDraw} className="btn-secondary" style={{ flex: 1, padding: '8px' }}>Decline</button>
              </div>
            </div>
          )}

          {/* Game over */}
          {gameOverMessage && (
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}>
              <p style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-medium)', color: 'var(--c-text)', marginBottom: 'var(--space-1)' }}>Game Over</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', marginBottom: 'var(--space-3)' }}>{gameOverMessage}</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button onClick={() => navigate('/play')} className="btn-primary" style={{ flex: 1 }}>New Game</button>
                <button onClick={() => navigate(`/games/${id}`)} className="btn-secondary" style={{ flex: 1 }}>Analyze</button>
              </div>
            </div>
          )}

          {/* Controls */}
          {isPlayer && isGameActive && !gameOverMessage && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={toggleFlipped} className="btn-ghost" style={{ flex: 1 }}>Flip</button>
              <button
                onClick={offerDraw}
                disabled={isDrawOfferFromUs}
                className="btn-ghost"
                style={{ flex: 1, color: isDrawOfferFromUs ? 'var(--c-warning)' : undefined, opacity: isDrawOfferFromUs ? 0.6 : 1 }}
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
