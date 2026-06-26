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

  const { gameState, makeMove, resign, offerDraw, acceptDraw, declineDraw, drawOffer, isConnected } = useChessGame({
    gameId: id || null,
    onGameOver: handleGameOver,
  });

  const isWhite = user?.id === gameState?.whiteId;
  const isBlack = user?.id === gameState?.blackId;
  const isPlayer = isWhite || isBlack;
  const playerColor = isWhite ? 'white' : 'black';

  // Is the draw offer from the opponent (so we should show accept/decline)?
  const isDrawOfferFromOpponent = drawOffer !== null && drawOffer !== playerColor;
  // Is the draw offer from us (so we should show "pending")?
  const isDrawOfferFromUs = drawOffer !== null && drawOffer === playerColor;

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
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[450px] h-[450px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start max-w-5xl relative z-10 w-full">
         <div className="flex flex-col gap-3 w-full max-w-[580px]">
          {/* Opponent info + clock */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 shadow-md backdrop-blur-md w-full">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isFlipped ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-200 border border-white/5'}`}>
                  {isFlipped ? 'W' : 'B'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#131522] bg-emerald-500" />
              </div>
              <div>
                <span className="text-text-primary font-bold text-sm block">
                  {isFlipped ? gameState?.whiteUsername : gameState?.blackUsername}
                </span>
                <span className="text-text-muted text-[11px] font-mono font-semibold tracking-wide uppercase">
                  Rating: {isFlipped ? gameState?.whiteRating : gameState?.blackRating}
                </span>
              </div>
            </div>
            <GameClock
              timeMs={isFlipped ? (gameState?.whiteClock ?? 300000) : (gameState?.blackClock ?? 300000)}
              isActive={gameState?.status === 'active'}
              isPlayerTurn={isFlipped ? gameState?.turn === 'w' : gameState?.turn === 'b'}
            />
          </div>

          {/* Chess Board Wrapper */}
          <div className="w-full aspect-square relative p-2.5 bg-white/[0.02] border border-white/5 rounded-3xl board-glow backdrop-blur-md">
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
          </div>

          {/* Player info + clock */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 shadow-md backdrop-blur-md w-full">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isFlipped ? 'bg-slate-800 text-slate-200 border border-white/5' : 'bg-slate-200 text-slate-800'}`}>
                  {isFlipped ? 'B' : 'W'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#131522] bg-emerald-500" />
              </div>
              <div>
                <span className="text-text-primary font-bold text-sm block">
                  {isFlipped ? gameState?.blackUsername : gameState?.whiteUsername}
                </span>
                <span className="text-text-muted text-[11px] font-mono font-semibold tracking-wide uppercase">
                  Rating: {isFlipped ? gameState?.blackRating : gameState?.whiteRating}
                </span>
              </div>
            </div>
            <GameClock
              timeMs={isFlipped ? (gameState?.blackClock ?? 300000) : (gameState?.whiteClock ?? 300000)}
              isActive={gameState?.status === 'active'}
              isPlayerTurn={isFlipped ? gameState?.turn === 'b' : gameState?.turn === 'w'}
            />
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-72 flex flex-col gap-3 self-stretch max-w-[580px] lg:max-w-none">
          {/* Connection and Game info */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
              <span className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Time Control</span>
              <span className="text-text-primary font-mono text-sm font-bold bg-white/[0.04] border border-white/5 px-2.5 py-0.5 rounded-lg">{gameState?.timeControl}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-accent-green shadow-[0_0_8px_#10b981]' : 'bg-accent-red animate-pulse'}`} />
                <span className="text-text-muted text-xs font-semibold">
                  {isConnected ? 'Live Match' : 'Reconnecting...'}
                </span>
              </div>
              {gameState?.rated && (
                <span className="text-[10px] text-accent-amber bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Rated</span>
              )}
            </div>
          </div>

          {/* Move list */}
          <div className="glass-card flex-1 min-h-[220px] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01]">
              <span className="text-text-muted text-xs font-bold uppercase tracking-widest">Move Log</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MoveList moves={gameState?.moves || []} />
            </div>
          </div>

          {/* Draw offer notification */}
          {isDrawOfferFromOpponent && gameState?.status === 'active' && (
            <div className="glass-card border-accent-amber/30 p-4 animate-slide-up shadow-lg bg-amber-500/[0.04]">
              <p className="text-text-primary font-bold text-sm text-center mb-3">
                ½ Your opponent offers a draw
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={acceptDraw}
                  className="btn-primary flex-1 py-2.5 text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500"
                >
                  ✓ Accept
                </button>
                <button
                  onClick={declineDraw}
                  className="btn-secondary flex-1 py-2.5 text-xs uppercase tracking-wider hover:text-accent-red hover:border-accent-red/30 hover:bg-red-500/10"
                >
                  ✕ Decline
                </button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {gameOverMessage && (
            <div className="glass-card border-accent-blue/30 p-5 animate-slide-up shadow-lg bg-blue-500/[0.02]">
              <h3 className="text-text-primary font-black text-center text-lg leading-tight mb-1">Game Over</h3>
              <p className="text-blue-400 font-bold text-center text-sm">{gameOverMessage}</p>
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={() => navigate('/play')}
                  className="btn-primary flex-1 py-2.5 text-xs uppercase tracking-wider"
                >
                  New Game
                </button>
                <button
                  onClick={() => navigate(`/games/${id}`)}
                  className="btn-secondary flex-1 py-2.5 text-xs uppercase tracking-wider"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Game controls */}
          {isPlayer && gameState?.status === 'active' && !gameOverMessage && (
            <div className="flex gap-2.5">
              <button
                onClick={toggleFlipped}
                className="btn-secondary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5"
                title="Flip board"
              >
                <span>⟳</span> Flip
              </button>
              <button
                onClick={offerDraw}
                disabled={isDrawOfferFromUs}
                className={`btn-secondary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5
                  ${isDrawOfferFromUs
                    ? 'opacity-50 cursor-not-allowed text-accent-amber border-accent-amber/30 bg-amber-500/10'
                    : 'hover:text-accent-amber hover:border-accent-amber/30 hover:bg-amber-500/10'
                  }`}
                title={isDrawOfferFromUs ? 'Draw offer pending...' : 'Offer draw'}
              >
                <span>½</span> {isDrawOfferFromUs ? 'Pending' : 'Draw'}
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to resign?')) {
                    resign();
                  }
                }}
                className="btn-secondary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 hover:text-accent-red hover:border-accent-red/30 hover:bg-red-500/10"
                title="Resign"
              >
                <span>⚑</span> Resign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
