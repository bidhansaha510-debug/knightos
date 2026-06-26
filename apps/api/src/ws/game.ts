import { FastifyInstance } from 'fastify';
import { Chess } from 'chess.js';
import { redis } from '../config/redis.js';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { parseTimeControl, getTimeControlCategory } from '@knightos/shared';
import { updateGameRatings } from '../services/glicko.service.js';
import type { JwtPayload } from '../middleware/auth.js';
import type { WebSocket } from 'ws';

interface GameConnection {
  ws: WebSocket;
  userId: string;
  username: string;
  color: 'white' | 'black' | 'spectator';
}

// Active game connections: gameId -> connections[]
const gameConnections = new Map<string, GameConnection[]>();

// Clock intervals: gameId -> interval
const clockIntervals = new Map<string, NodeJS.Timeout>();

function broadcast(gameId: string, message: object, excludeUserId?: string) {
  const conns = gameConnections.get(gameId) || [];
  const data = JSON.stringify(message);
  for (const conn of conns) {
    if (conn.userId !== excludeUserId && conn.ws.readyState === 1) {
      conn.ws.send(data);
    }
  }
}

function sendTo(gameId: string, userId: string, message: object) {
  const conns = gameConnections.get(gameId) || [];
  const data = JSON.stringify(message);
  for (const conn of conns) {
    if (conn.userId === userId && conn.ws.readyState === 1) {
      conn.ws.send(data);
    }
  }
}

function broadcastAll(gameId: string, message: object) {
  const conns = gameConnections.get(gameId) || [];
  const data = JSON.stringify(message);
  for (const conn of conns) {
    if (conn.ws.readyState === 1) {
      conn.ws.send(data);
    }
  }
}

async function endGame(
  gameId: string,
  result: string,
  termination: string
) {
  // Clear clock interval
  const interval = clockIntervals.get(gameId);
  if (interval) {
    clearInterval(interval);
    clockIntervals.delete(gameId);
  }

  // Get game state from Redis
  const state = await redis.hgetall(`game:${gameId}`);
  if (!state || !state.whiteId) return;

  // Persist to database
  try {
    await prisma.game.create({
      data: {
        id: gameId,
        whiteId: state.whiteId,
        blackId: state.blackId,
        pgn: state.pgn || '',
        fen: state.fen,
        result,
        termination,
        timeControl: state.timeControl,
        rated: state.rated === 'true',
        moves: JSON.parse(state.moves || '[]'),
        endedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('Failed to persist game:', err);
  }

  // Update ratings if the game was rated
  if (state.rated === 'true') {
    try {
      await updateGameRatings(state.whiteId, state.blackId, result, state.timeControl);
    } catch (err) {
      console.error('Failed to update ratings:', err);
    }
  }

  // Set game status to ended in Redis
  await redis.hset(`game:${gameId}`, 'status', 'ended');

  // Broadcast game over
  broadcastAll(gameId, { type: 'game_over', result, termination });

  // Clean up Redis after a delay (let clients read final state)
  setTimeout(async () => {
    await redis.del(`game:${gameId}`);
  }, 60000);
}

function startClock(gameId: string) {
  if (clockIntervals.has(gameId)) return;

  const interval = setInterval(async () => {
    const state = await redis.hgetall(`game:${gameId}`);
    if (!state || state.status !== 'active') {
      clearInterval(interval);
      clockIntervals.delete(gameId);
      return;
    }

    const now = Date.now();
    const lastMoveAt = parseInt(state.lastMoveAt || String(now));
    const elapsed = now - lastMoveAt;

    // Determine whose clock is running
    const chess = new Chess(state.fen);
    const turn = chess.turn(); // 'w' or 'b'

    if (turn === 'w') {
      const remaining = parseInt(state.whiteClock) - elapsed;
      if (remaining <= 0) {
        await endGame(gameId, '0-1', 'timeout');
      }
    } else {
      const remaining = parseInt(state.blackClock) - elapsed;
      if (remaining <= 0) {
        await endGame(gameId, '1-0', 'timeout');
      }
    }
  }, 100); // Check every 100ms

  clockIntervals.set(gameId, interval);
}

export async function gameWs(app: FastifyInstance) {
  app.get('/ws/game/:id', { websocket: true }, async (socket, request) => {
    const { id: gameId } = request.params as { id: string };
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    let user: JwtPayload | null = null;
    if (token) {
      try {
        user = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
        socket.close();
        return;
      }
    }

    // Get game state
    const state = await redis.hgetall(`game:${gameId}`);
    if (!state || !state.fen) {
      socket.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
      socket.close();
      return;
    }

    // Determine connection role
    let color: 'white' | 'black' | 'spectator' = 'spectator';
    if (user) {
      if (user.userId === state.whiteId) color = 'white';
      else if (user.userId === state.blackId) color = 'black';
    }

    const conn: GameConnection = {
      ws: socket,
      userId: user?.userId || 'spectator-' + Date.now(),
      username: user?.username || 'Spectator',
      color,
    };

    // Add to connections
    if (!gameConnections.has(gameId)) {
      gameConnections.set(gameId, []);
    }
    gameConnections.get(gameId)!.push(conn);

    // Send current game state
    const now = Date.now();
    const lastMoveAt = parseInt(state.lastMoveAt || String(now));
    const elapsed = now - lastMoveAt;
    const chess = new Chess(state.fen);
    const turn = chess.turn();

    socket.send(
      JSON.stringify({
        type: 'game_state',
        gameState: {
          id: gameId,
          fen: state.fen,
          pgn: state.pgn || '',
          moves: JSON.parse(state.moves || '[]'),
          turn,
          whiteClock:
            turn === 'w'
              ? Math.max(0, parseInt(state.whiteClock) - elapsed)
              : parseInt(state.whiteClock),
          blackClock:
            turn === 'b'
              ? Math.max(0, parseInt(state.blackClock) - elapsed)
              : parseInt(state.blackClock),
          status: state.status,
          whiteId: state.whiteId,
          blackId: state.blackId,
          whiteUsername: state.whiteUsername,
          blackUsername: state.blackUsername,
          whiteRating: parseInt(state.whiteRating || '1500'),
          blackRating: parseInt(state.blackRating || '1500'),
          timeControl: state.timeControl,
          rated: state.rated === 'true',
        },
      })
    );

    // Start clock if game is active
    if (state.status === 'active') {
      startClock(gameId);
    }

    socket.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (color === 'spectator') {
          // Spectators can only receive, not send game commands
          return;
        }

        switch (msg.type) {
          case 'move': {
            const currentState = await redis.hgetall(`game:${gameId}`);
            if (!currentState || currentState.status !== 'active') break;

            const chess = new Chess(currentState.fen);

            // Verify it's this player's turn
            const isWhiteTurn = chess.turn() === 'w';
            if ((isWhiteTurn && color !== 'white') || (!isWhiteTurn && color !== 'black')) {
              socket.send(JSON.stringify({ type: 'illegal_move' }));
              break;
            }

            // Validate move
            let move;
            try {
              move = chess.move({
                from: msg.from,
                to: msg.to,
                promotion: msg.promotion || undefined,
              });
            } catch {
              socket.send(JSON.stringify({ type: 'illegal_move' }));
              break;
            }

            if (!move) {
              socket.send(JSON.stringify({ type: 'illegal_move' }));
              break;
            }

            // Calculate clocks
            const now = Date.now();
            const lastMoveAt = parseInt(currentState.lastMoveAt || String(now));
            const elapsed = now - lastMoveAt;
            const { increment } = parseTimeControl(currentState.timeControl);
            const incrementMs = increment * 1000;

            let whiteClock = parseInt(currentState.whiteClock);
            let blackClock = parseInt(currentState.blackClock);

            if (isWhiteTurn) {
              whiteClock = Math.max(0, whiteClock - elapsed) + incrementMs;
            } else {
              blackClock = Math.max(0, blackClock - elapsed) + incrementMs;
            }

            // Update moves array
            const moves = JSON.parse(currentState.moves || '[]');
            moves.push({
              san: move.san,
              uci: msg.from + msg.to + (msg.promotion || ''),
              fen: chess.fen(),
              clock: isWhiteTurn ? whiteClock : blackClock,
            });

            // Update Redis
            await redis.hset(`game:${gameId}`, {
              fen: chess.fen(),
              pgn: chess.pgn(),
              whiteClock: String(whiteClock),
              blackClock: String(blackClock),
              lastMoveAt: String(now),
              moves: JSON.stringify(moves),
            });

            // Broadcast move to all
            broadcastAll(gameId, {
              type: 'move',
              san: move.san,
              uci: msg.from + msg.to + (msg.promotion || ''),
              fen: chess.fen(),
              whiteClock,
              blackClock,
            });

            // Check for game over conditions
            if (chess.isCheckmate()) {
              await endGame(gameId, isWhiteTurn ? '1-0' : '0-1', 'checkmate');
            } else if (chess.isStalemate()) {
              await endGame(gameId, '1/2-1/2', 'stalemate');
            } else if (chess.isDraw()) {
              await endGame(gameId, '1/2-1/2', 'draw');
            } else if (chess.isThreefoldRepetition()) {
              await endGame(gameId, '1/2-1/2', 'draw');
            } else if (chess.isInsufficientMaterial()) {
              await endGame(gameId, '1/2-1/2', 'draw');
            }

            break;
          }

          case 'resign': {
            const result = color === 'white' ? '0-1' : '1-0';
            await endGame(gameId, result, 'resignation');
            break;
          }

          case 'draw_offer': {
            await redis.hset(`game:${gameId}`, 'drawOffer', color);
            broadcast(gameId, { type: 'draw_offered', by: color }, conn.userId);
            break;
          }

          case 'draw_accept': {
            const drawState = await redis.hget(`game:${gameId}`, 'drawOffer');
            if (drawState && drawState !== color) {
              await endGame(gameId, '1/2-1/2', 'agreement');
            }
            break;
          }

          case 'draw_decline': {
            await redis.hdel(`game:${gameId}`, 'drawOffer');
            broadcast(gameId, { type: 'draw_declined' }, conn.userId);
            break;
          }

          case 'chat': {
            const message = String(msg.message || '').slice(0, 200).replace(/<[^>]*>/g, '');
            if (message.length > 0) {
              broadcastAll(gameId, {
                type: 'chat',
                from: conn.username,
                message,
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('Game WS message error:', err);
      }
    });

    socket.on('close', () => {
      const conns = gameConnections.get(gameId);
      if (conns) {
        const idx = conns.indexOf(conn);
        if (idx !== -1) conns.splice(idx, 1);
        if (conns.length === 0) {
          gameConnections.delete(gameId);
        }
      }

      // Notify opponent of disconnect
      if (color !== 'spectator') {
        broadcast(gameId, { type: 'opponent_disconnected' }, conn.userId);
      }
    });
  });
}
