import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/leaderboard/:timeControl', async (request, reply) => {
    const { timeControl } = request.params as { timeControl: string };
    const { page = '1', limit = '100' } = request.query as { page?: string; limit?: string };

    const validControls = ['bullet', 'blitz', 'rapid', 'classical', 'puzzle'];
    if (!validControls.includes(timeControl)) {
      return reply.status(400).send({ error: 'Invalid time control category' });
    }

    const take = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * take;

    const ratings = await prisma.rating.findMany({
      where: {
        timeControl,
        rd: { lt: 200 }, // Only show players with enough games
      },
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { rating: 'desc' },
      take,
      skip,
    });

    const entries = ratings.map((r, i) => ({
      rank: skip + i + 1,
      userId: r.user.id,
      username: r.user.username,
      rating: Math.round(r.rating),
    }));

    return reply.send({ timeControl, entries });
  });
}
