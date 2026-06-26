import { FastifyInstance } from 'fastify';
import { Chess } from 'chess.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../config/redis.js';
import { authMiddleware, getUserFromRequest } from '../middleware/auth.js';
import type { GameState, GameMove } from '@knightos/shared';


export async function gameRoutes(app: FastifyInstance) {
  // Get game by ID (completed game from DB or active game from Redis)
  app.get('/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Check Redis first (active game)
    const redisGame = await redis.hgetall(`game:${id}`);
    if (redisGame && redisGame.fen) {
      return reply.send({
        id,
        fen: redisGame.fen,
        pgn: redisGame.pgn || '',
        whiteClock: Number(redisGame.whiteClock),
        blackClock: Number(redisGame.blackClock),
        status: redisGame.status,
        whiteId: redisGame.whiteId,
        blackId: redisGame.blackId,
        whiteUsername: redisGame.whiteUsername,
        blackUsername: redisGame.blackUsername,
        timeControl: redisGame.timeControl,
        rated: redisGame.rated === 'true',
        moves: JSON.parse(redisGame.moves || '[]'),
      });
    }

    // Check DB (completed game)
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        white: { select: { id: true, username: true } },
        black: { select: { id: true, username: true } },
      },
    });

    if (!game) {
      return reply.status(404).send({ error: 'Game not found' });
    }

    return reply.send({
      id: game.id,
      fen: game.fen,
      pgn: game.pgn,
      result: game.result,
      termination: game.termination,
      timeControl: game.timeControl,
      rated: game.rated,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      moves: game.moves,
      analysisJson: game.analysisJson,
      white: game.white,
      black: game.black,
    });
  });

  // Get user's game history
  app.get('/users/:userId/games', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };

    const take = Math.min(parseInt(limit), 50);
    const skip = (parseInt(page) - 1) * take;

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where: {
          OR: [{ whiteId: userId }, { blackId: userId }],
          result: { not: '*' },
        },
        include: {
          white: { select: { id: true, username: true } },
          black: { select: { id: true, username: true } },
        },
        orderBy: { startedAt: 'desc' },
        take,
        skip,
      }),
      prisma.game.count({
        where: {
          OR: [{ whiteId: userId }, { blackId: userId }],
          result: { not: '*' },
        },
      }),
    ]);

    return reply.send({
      games: games.map((g) => ({
        id: g.id,
        result: g.result,
        termination: g.termination,
        timeControl: g.timeControl,
        rated: g.rated,
        startedAt: g.startedAt,
        endedAt: g.endedAt,
        white: g.white,
        black: g.black,
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take),
    });
  });
}
