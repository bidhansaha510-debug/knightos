import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, getUserFromRequest } from '../middleware/auth.js';

export async function puzzleRoutes(app: FastifyInstance) {
  // Get next puzzle for user
  app.get('/puzzles/next', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = getUserFromRequest(request);
    const { rating: ratingStr } = request.query as { rating?: string };

    // Get user's puzzle rating
    const userRating = await prisma.rating.findUnique({
      where: { userId_timeControl: { userId, timeControl: 'puzzle' } },
    });
    const targetRating = ratingStr ? parseInt(ratingStr) : (userRating?.rating ?? 1500);

    // Get recently attempted puzzle IDs to avoid repeats
    const recentAttempts = await prisma.puzzleAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      take: 100,
      select: { puzzleId: true },
    });
    const recentIds = recentAttempts.map((a) => a.puzzleId);

    // Find a puzzle within ±200 of target rating
    const puzzle = await prisma.puzzle.findFirst({
      where: {
        rating: { gte: targetRating - 200, lte: targetRating + 200 },
        id: { notIn: recentIds.length > 0 ? recentIds : undefined },
      },
      orderBy: { popularity: 'desc' },
    });

    if (!puzzle) {
      // Fallback: any puzzle
      const fallback = await prisma.puzzle.findFirst({
        where: { id: { notIn: recentIds.length > 0 ? recentIds : undefined } },
      });
      if (!fallback) {
        return reply.status(404).send({ error: 'No puzzles available' });
      }
      return reply.send({
        id: fallback.id,
        fen: fallback.fen,
        moves: fallback.moves.split(' '),
        rating: fallback.rating,
        themes: fallback.themes,
      });
    }

    return reply.send({
      id: puzzle.id,
      fen: puzzle.fen,
      moves: puzzle.moves.split(' '),
      rating: puzzle.rating,
      themes: puzzle.themes,
    });
  });

  // Get batch of puzzles for storm mode
  app.get('/puzzles/storm', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = getUserFromRequest(request);

    const userRating = await prisma.rating.findUnique({
      where: { userId_timeControl: { userId, timeControl: 'puzzle' } },
    });
    const targetRating = userRating?.rating ?? 1500;

    const puzzles = await prisma.puzzle.findMany({
      where: {
        rating: { gte: targetRating - 300, lte: targetRating + 300 },
      },
      take: 50,
      orderBy: { popularity: 'desc' },
    });

    return reply.send(
      puzzles.map((p) => ({
        id: p.id,
        fen: p.fen,
        moves: p.moves.split(' '),
        rating: p.rating,
        themes: p.themes,
      }))
    );
  });

  // Submit puzzle attempt
  app.post('/puzzles/:id/attempt', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = getUserFromRequest(request);
    const { id: puzzleId } = request.params as { id: string };
    const { solved, timeTaken } = request.body as { solved: boolean; timeTaken: number };

    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    if (!puzzle) {
      return reply.status(404).send({ error: 'Puzzle not found' });
    }

    await prisma.puzzleAttempt.create({
      data: {
        userId,
        puzzleId,
        solved,
        timeTaken: Math.max(0, Math.min(timeTaken, 600000)), // cap at 10min
      },
    });

    // Rating update would be handled by the Glicko service (Phase 3)
    return reply.send({ ok: true });
  });

  // Get puzzle by ID
  app.get('/puzzles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const puzzle = await prisma.puzzle.findUnique({ where: { id } });
    if (!puzzle) {
      return reply.status(404).send({ error: 'Puzzle not found' });
    }
    return reply.send({
      id: puzzle.id,
      fen: puzzle.fen,
      moves: puzzle.moves.split(' '),
      rating: puzzle.rating,
      themes: puzzle.themes,
    });
  });
}
