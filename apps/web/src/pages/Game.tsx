import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import ChessBoard from '../components/Board/ChessBoard';
import GameClock from '../components/Clock/GameClock';
import MoveList from '../components/MoveList/MoveList';
import { useChessGame } from '../hooks/useChessGame';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const { isFlipped, lastMove, toggleFlipped } = useGameStore();
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);

  const handleGameOver = useCallback((result: string, termination: string) => {
    const messages: Record<string, string> = {
      checkmate: 'Checkmate!',
      resignation: 'Resignation',
      timeout: 'Time out',
      stalemate: 'Stalemate',
      draw: 'Draw',
      agreement: 'Draw by agreement',
      abandoned: 'Game abandoned',
    };
    setGameOverMessage(`${messages[termination] || termination} — ${result}`);
  }, []);

  const { gameState, makeMove, resign, offerDraw, isConnected } = useChessGame({
    gameId: id || null,
    onGameOver: handleGameOver,
  });

  const isWhite = user?.id === gameState?.whiteId;
  const isBlack = user?.id === gameState?.blackId;
  const isPlayer = isWhite || isBlack;
  const playerColor = isWhite ? 'w' : 'b';

  // Determine check square
  let checkSquare: string | null = null;
  if (gameState?.fen) {
    try {
      const tempChess = new Chess(gameState.fen);
      if (tempChess.isCheck()) {
        // Find the king that's in check
        const turn = tempChess.turn();
        const board = tempChess.board();
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === 'k' && piece.color === turn) {
              const files = 'abcdefgh';
              checkSquare = files[c] + String(8 - r);
            }
          }
        }
      }
    } catch {}
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-text-muted">No game ID specified</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="flex gap-4 items-start max-w-5xl">
        {/* Board area */}
        <div className="flex flex-col gap-2">
          {/* Opponent info + clock */}
          <div className="flex items-center justify-between bg-surface border border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${isFlipped ? 'bg-white' : 'bg-[#333]'}`} />
              <span className="text-text-primary font-semibold text-sm">
                {isFlipped ? gameState?.whiteUsername : gameState?.blackUsername}
              </span>
              <span className="text-text-muted text-xs font-mono">
                ({isFlipped ? gameState?.whiteRating : gameState?.blackRating})
              </span>
            </div>
            <GameClock
              timeMs={isFlipped ? (gameState?.whiteClock ?? 300000) : (gameState?.blackClock ?? 300000)}
              isActive={gameState?.status === 'active'}
              isPlayerTurn={isFlipped ? gameState?.turn === 'w' : gameState?.turn === 'b'}
            />
          </div>

          {/* Chess Board */}
          <ChessBoard
            fen={gameState?.fen}
            flipped={isBlack || isFlipped}
            interactive={isPlayer && gameState?.status === 'active'}
            onMove={(from, to, promotion) => {
              makeMove(from, to, promotion);
              return true;
            }}
            lastMove={lastMove}
            checkSquare={checkSquare}
            size={560}
          />

          {/* Player info + clock */}
          <div className="flex items-center justify-between bg-surface border border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${isFlipped ? 'bg-[#333]' : 'bg-white'}`} />
              <span className="text-text-primary font-semibold text-sm">
                {isFlipped ? gameState?.blackUsername : gameState?.whiteUsername}
              </span>
              <span className="text-text-muted text-xs font-mono">
                ({isFlipped ? gameState?.blackRating : gameState?.whiteRating})
              </span>
            </div>
            <GameClock
              timeMs={isFlipped ? (gameState?.blackClock ?? 300000) : (gameState?.whiteClock ?? 300000)}
              isActive={gameState?.status === 'active'}
              isPlayerTurn={isFlipped ? gameState?.turn === 'b' : gameState?.turn === 'w'}
            />
          </div>
        </div>

        {/* Side panel */}
        <div className="w-64 flex flex-col gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-2 px-3 py-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent-green' : 'bg-accent-red'}`} />
            <span className="text-text-muted text-xs">
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>

          {/* Game info */}
          <div className="bg-surface border border-border px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-xs uppercase">Time Control</span>
              <span className="text-text-primary font-mono text-sm">{gameState?.timeControl}</span>
            </div>
            {gameState?.rated && (
              <span className="text-accent-amber text-xs">Rated</span>
            )}
          </div>

          {/* Move list */}
          <div className="bg-surface border border-border flex-1 min-h-[200px]">
            <MoveList moves={gameState?.moves || []} />
          </div>

          {/* Game over overlay */}
          {gameOverMessage && (
            <div className="bg-surface border border-accent-blue px-4 py-3 animate-slide-up">
              <p className="text-text-primary font-semibold text-center">{gameOverMessage}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigate('/play')}
                  className="flex-1 bg-accent-blue text-white py-1.5 text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  New Game
                </button>
                <button
                  onClick={() => navigate(`/games/${id}`)}
                  className="flex-1 bg-surface border border-border text-text-primary py-1.5 text-sm hover:bg-elevated transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Game controls */}
          {isPlayer && gameState?.status === 'active' && !gameOverMessage && (
            <div className="flex gap-2">
              <button
                onClick={toggleFlipped}
                className="flex-1 bg-surface border border-border text-text-muted py-2 text-sm
                         hover:bg-elevated hover:text-text-primary transition-colors"
                title="Flip board"
              >
                ⟳
              </button>
              <button
                onClick={offerDraw}
                className="flex-1 bg-surface border border-border text-text-muted py-2 text-sm
                         hover:bg-elevated hover:text-accent-amber transition-colors"
                title="Offer draw"
              >
                ½
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to resign?')) {
                    resign();
                  }
                }}
                className="flex-1 bg-surface border border-border text-text-muted py-2 text-sm
                         hover:bg-elevated hover:text-accent-red transition-colors"
                title="Resign"
              >
                ⚑
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
