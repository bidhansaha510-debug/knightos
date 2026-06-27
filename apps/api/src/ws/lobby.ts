import { FastifyInstance } from 'fastify';
import { redis } from '../config/redis.js';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { parseTimeControl, getTimeControlCategory } from '@knightos/shared';
import type { JwtPayload } from '../middleware/auth.js';
import type { WebSocket } from 'ws';
import type { Seek } from '@knightos/shared';

interface LobbyConnection {
  ws: WebSocket;
  userId: string;
  username: string;
}

const lobbyConnections = new Map<string, Set<LobbyConnection>>();

function broadcastSeeks(seeks: Seek[]) {
  const data = JSON.stringify({ type: 'seeks_update', seeks });
  for (const conns of lobbyConnections.values()) {
    for (const conn of conns) {
      if (conn.ws.readyState === 1) {
        conn.ws.send(data);
      }
    }
  }
}

function sendToUser(userId: string, message: object) {
  const conns = lobbyConnections.get(userId);
  if (conns) {
    for (const conn of conns) {
      if (conn.ws.readyState === 1) {
        conn.ws.send(JSON.stringify(message));
      }
    }
  }
}

async function getSeeks(): Promise<Seek[]> {
  const seekKeys = await redis.keys('seek:*');
  const seeks: Seek[] = [];
  for (const key of seekKeys) {
    const data = await redis.hgetall(key);
    if (data && data.userId) {
      seeks.push({
        id: key.replace('seek:', ''),
        userId: data.userId,
        username: data.username,
        rating: parseInt(data.rating || '1500'),
        timeControl: data.timeControl,
        rated: data.rated === 'true',
        color: (data.color as any) || 'random',
        createdAt: parseInt(data.createdAt || '0'),
      });
    }
  }
  return seeks.sort((a, b) => b.createdAt - a.createdAt);
}

async function createGameRoom(
  whiteId: string, whiteUsername: string, whiteRating: number,
  blackId: string, blackUsername: string, blackRating: number,
  timeControl: string, rated: boolean
): Promise<string> {
  const gameId = crypto.randomUUID();
  const { baseTime } = parseTimeControl(timeControl);
  const clockMs = baseTime * 1000;

  await redis.hset(`game:${gameId}`, {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn: '',
    whiteClock: String(clockMs),
    blackClock: String(clockMs),
    lastMoveAt: String(Date.now()),
    status: 'active',
    whiteId,
    blackId,
    whiteUsername,
    blackUsername,
    whiteRating: String(whiteRating),
    blackRating: String(blackRating),
    timeControl,
    rated: String(rated),
    moves: '[]',
  });

  // Set TTL for game (auto-cleanup after 24h)
  await redis.expire(`game:${gameId}`, 86400);

  return gameId;
}

export async function lobbyWs(app: FastifyInstance) {
  app.get('/ws/lobby', { websocket: true }, async (socket, request) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    let user: JwtPayload;
    try {
      user = jwt.verify(token || '', env.JWT_SECRET) as JwtPayload;
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
      socket.close();
      return;
    }

    const conn: LobbyConnection = {
      ws: socket,
      userId: user.userId,
      username: user.username,
    };
    
    let conns = lobbyConnections.get(user.userId);
    if (!conns) {
      conns = new Set();
      lobbyConnections.set(user.userId, conns);
    }
    conns.add(conn);

    // Send current seeks
    const seeks = await getSeeks();
    socket.send(JSON.stringify({ type: 'seeks_update', seeks }));

    socket.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'seek': {
            const { timeControl, rated, color } = msg;

            // Get user's rating for this time control
            const category = getTimeControlCategory(
              ...Object.values(parseTimeControl(timeControl)) as [number, number]
            );
            const rating = await prisma.rating.findUnique({
              where: {
                userId_timeControl: {
                  userId: user.userId,
                  timeControl: category,
                },
              },
            });
            const userRating = Math.round(rating?.rating ?? 1500);

            // Remove any existing seek from this user
            const existingKeys = await redis.keys('seek:*');
            for (const key of existingKeys) {
              const seekUserId = await redis.hget(key, 'userId');
              if (seekUserId === user.userId) {
                await redis.del(key);
              }
            }

            // Check for compatible seeks to match
            const seeks = await getSeeks();
            let matched = false;
            for (const seek of seeks) {
              if (seek.userId === user.userId) continue;
              if (seek.timeControl !== timeControl) continue;
              if (seek.rated !== (rated ?? true)) continue;

              // Color compatibility
              const seekerWantsColor = color || 'random';
              const matchWantsColor = seek.color || 'random';
              if (seekerWantsColor !== 'random' && matchWantsColor !== 'random' &&
                  seekerWantsColor === matchWantsColor) continue;

              // Match found! Determine colors
              let whiteId: string, whiteName: string, whiteR: number;
              let blackId: string, blackName: string, blackR: number;

              if (seekerWantsColor === 'white' || matchWantsColor === 'black') {
                whiteId = user.userId; whiteName = user.username; whiteR = userRating;
                blackId = seek.userId; blackName = seek.username; blackR = seek.rating;
              } else if (seekerWantsColor === 'black' || matchWantsColor === 'white') {
                whiteId = seek.userId; whiteName = seek.username; whiteR = seek.rating;
                blackId = user.userId; blackName = user.username; blackR = userRating;
              } else {
                // Random
                if (Math.random() < 0.5) {
                  whiteId = user.userId; whiteName = user.username; whiteR = userRating;
                  blackId = seek.userId; blackName = seek.username; blackR = seek.rating;
                } else {
                  whiteId = seek.userId; whiteName = seek.username; whiteR = seek.rating;
                  blackId = user.userId; blackName = user.username; blackR = userRating;
                }
              }

              // Remove the matched seek
              await redis.del(`seek:${seek.id}`);

              // Create game
              const gameId = await createGameRoom(
                whiteId, whiteName, whiteR,
                blackId, blackName, blackR,
                timeControl, rated ?? true
              );

              // Notify both players
              sendToUser(whiteId, { type: 'game_start', gameId, color: 'white' });
              sendToUser(blackId, { type: 'game_start', gameId, color: 'black' });

              matched = true;
              break;
            }

            if (!matched) {
              // Post seek
              const seekId = crypto.randomUUID();
              await redis.hset(`seek:${seekId}`, {
                userId: user.userId,
                username: user.username,
                rating: String(userRating),
                timeControl,
                rated: String(rated ?? true),
                color: color || 'random',
                createdAt: String(Date.now()),
              });
              await redis.expire(`seek:${seekId}`, 3600); // 1h TTL
            }

            // Broadcast updated seeks
            const updatedSeeks = await getSeeks();
            broadcastSeeks(updatedSeeks);
            break;
          }

          case 'seek_cancel': {
            const keys = await redis.keys('seek:*');
            for (const key of keys) {
              const seekUserId = await redis.hget(key, 'userId');
              if (seekUserId === user.userId) {
                await redis.del(key);
              }
            }
            const updatedSeeks = await getSeeks();
            broadcastSeeks(updatedSeeks);
            break;
          }

          case 'challenge': {
            const { toUserId, timeControl, rated } = msg;
            const category = getTimeControlCategory(
              ...Object.values(parseTimeControl(timeControl)) as [number, number]
            );
            const rating = await prisma.rating.findUnique({
              where: {
                userId_timeControl: { userId: user.userId, timeControl: category },
              },
            });

            const challengeId = crypto.randomUUID();
            await redis.hset(`challenge:${challengeId}`, {
              fromUserId: user.userId,
              fromUsername: user.username,
              fromRating: String(Math.round(rating?.rating ?? 1500)),
              toUserId,
              timeControl,
              rated: String(rated ?? true),
              createdAt: String(Date.now()),
            });
            await redis.expire(`challenge:${challengeId}`, 300); // 5min TTL

            sendToUser(toUserId, {
              type: 'challenged_by',
              challenge: {
                id: challengeId,
                fromUserId: user.userId,
                fromUsername: user.username,
                fromRating: Math.round(rating?.rating ?? 1500),
                toUserId,
                timeControl,
                rated: rated ?? true,
                createdAt: Date.now(),
              },
            });
            break;
          }

          case 'challenge_accept': {
            const { challengeId } = msg;
            const challenge = await redis.hgetall(`challenge:${challengeId}`);
            if (!challenge || challenge.toUserId !== user.userId) break;

            const myCategory = getTimeControlCategory(
              ...Object.values(parseTimeControl(challenge.timeControl)) as [number, number]
            );
            const myRating = await prisma.rating.findUnique({
              where: {
                userId_timeControl: { userId: user.userId, timeControl: myCategory },
              },
            });

            // Random color assignment
            let whiteId: string, whiteName: string, whiteR: number;
            let blackId: string, blackName: string, blackR: number;

            if (Math.random() < 0.5) {
              whiteId = challenge.fromUserId; whiteName = challenge.fromUsername;
              whiteR = parseInt(challenge.fromRating);
              blackId = user.userId; blackName = user.username;
              blackR = Math.round(myRating?.rating ?? 1500);
            } else {
              whiteId = user.userId; whiteName = user.username;
              whiteR = Math.round(myRating?.rating ?? 1500);
              blackId = challenge.fromUserId; blackName = challenge.fromUsername;
              blackR = parseInt(challenge.fromRating);
            }

            const gameId = await createGameRoom(
              whiteId, whiteName, whiteR,
              blackId, blackName, blackR,
              challenge.timeControl, challenge.rated === 'true'
            );

            sendToUser(whiteId, { type: 'game_start', gameId, color: 'white' });
            sendToUser(blackId, { type: 'game_start', gameId, color: 'black' });

            await redis.del(`challenge:${challengeId}`);
            break;
          }

          case 'challenge_decline': {
            const { challengeId } = msg;
            await redis.del(`challenge:${challengeId}`);
            break;
          }

          case 'direct_message': {
            const { toUserId, content } = msg;
            if (!toUserId || !content || content.trim().length === 0) break;

            // Create message in DB
            const dm = await prisma.directMessage.create({
              data: {
                senderId: user.userId,
                receiverId: toUserId,
                content: content.slice(0, 1000)
              }
            });

            // Push to target user if online
            sendToUser(toUserId, {
              type: 'direct_message',
              id: dm.id,
              senderId: user.userId,
              senderUsername: user.username,
              content: dm.content,
              createdAt: dm.createdAt
            });

            // Confirm to sender
            sendToUser(user.userId, {
              type: 'direct_message_sent',
              id: dm.id,
              receiverId: toUserId,
              content: dm.content,
              createdAt: dm.createdAt
            });
            break;
          }
        }
      } catch (err) {
        console.error('Lobby WS message error:', err);
      }
    });

    socket.on('close', async () => {
      const conns = lobbyConnections.get(user.userId);
      if (conns) {
        conns.delete(conn);
        if (conns.size === 0) {
          lobbyConnections.delete(user.userId);
        }
      }

      // Only clean up seeks and broadcast if the user has no remaining active connections
      if (!lobbyConnections.has(user.userId)) {
        const keys = await redis.keys('seek:*');
        for (const key of keys) {
          const seekUserId = await redis.hget(key, 'userId');
          if (seekUserId === user.userId) {
            await redis.del(key);
          }
        }

        const updatedSeeks = await getSeeks();
        broadcastSeeks(updatedSeeks);
      }
    });
  });
}
