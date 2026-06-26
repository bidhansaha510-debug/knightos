import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import { getWsUrl } from '../config';
import { useWebSocket } from './useWebSocket';
import { useGameStore } from '../stores/gameStore';
import type {
  ServerGameMessage,
  ClientGameMessage,
  GameState,
} from '@knightos/shared';

interface UseChessGameOptions {
  gameId: string | null;
  onGameOver?: (result: string, termination: string) => void;
}

export function useChessGame({ gameId, onGameOver }: UseChessGameOptions) {
  const {
    gameState,
    setGameState,
    setLastMove,
    addMove,
    updateClocks,
    reset,
  } = useGameStore();

  const chessRef = useRef(new Chess());

  const wsUrl = gameId
    ? getWsUrl(`/ws/game/${gameId}`)
    : '';

  const handleMessage = useCallback(
    (msg: ServerGameMessage) => {
      switch (msg.type) {
        case 'game_state': {
          const gs = (msg as any).gameState as GameState;
          setGameState(gs);
          try {
            chessRef.current = new Chess(gs.fen);
          } catch {}
          break;
        }
        case 'move': {
          const moveMsg = msg as any;
          try {
            chessRef.current.load(moveMsg.fen);
          } catch {}
          updateClocks(moveMsg.whiteClock, moveMsg.blackClock);
          addMove({
            san: moveMsg.san,
            uci: moveMsg.uci,
            fen: moveMsg.fen,
          });
          // Extract last move from UCI
          if (moveMsg.uci && moveMsg.uci.length >= 4) {
            setLastMove({
              from: moveMsg.uci.slice(0, 2),
              to: moveMsg.uci.slice(2, 4),
            });
          }
          break;
        }
        case 'game_over': {
          const overMsg = msg as any;
          onGameOver?.(overMsg.result, overMsg.termination);
          break;
        }
        case 'illegal_move': {
          // Could show a notification
          break;
        }
        case 'draw_offered': {
          // Could show a notification
          break;
        }
        case 'opponent_disconnected': {
          break;
        }
        case 'opponent_reconnected': {
          break;
        }
      }
    },
    [setGameState, setLastMove, addMove, updateClocks, onGameOver]
  );

  const { send, isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    reconnect: true,
  });

  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      send({
        type: 'move',
        from,
        to,
        promotion,
      } satisfies ClientGameMessage);
      return true;
    },
    [send]
  );

  const resign = useCallback(() => {
    send({ type: 'resign' } satisfies ClientGameMessage);
  }, [send]);

  const offerDraw = useCallback(() => {
    send({ type: 'draw_offer' } satisfies ClientGameMessage);
  }, [send]);

  const acceptDraw = useCallback(() => {
    send({ type: 'draw_accept' } satisfies ClientGameMessage);
  }, [send]);

  const declineDraw = useCallback(() => {
    send({ type: 'draw_decline' } satisfies ClientGameMessage);
  }, [send]);

  const sendChat = useCallback(
    (message: string) => {
      send({ type: 'chat', message } satisfies ClientGameMessage);
    },
    [send]
  );

  useEffect(() => {
    return () => {
      reset();
    };
  }, [gameId]);

  return {
    gameState,
    chess: chessRef.current,
    isConnected,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    sendChat,
  };
}
