import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, getUserFromRequest } from '../middleware/auth.js';

export async function userRoutes(app: FastifyInstance) {
  // Get user profile
  app.get('/users/:username', async (request, reply) => {
    const { username } = request.params as { username: string };

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        createdAt: true,
        ratings: {
          select: { timeControl: true, rating: true, rd: true },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            gamesAsWhite: true,
            gamesAsBlack: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Get game stats
    const [wins, losses, draws] = await Promise.all([
      prisma.game.count({
        where: {
          OR: [
            { whiteId: user.id, result: '1-0' },
            { blackId: user.id, result: '0-1' },
          ],
        },
      }),
      prisma.game.count({
        where: {
          OR: [
            { whiteId: user.id, result: '0-1' },
            { blackId: user.id, result: '1-0' },
          ],
        },
      }),
      prisma.game.count({
        where: {
          OR: [{ whiteId: user.id }, { blackId: user.id }],
          result: '1/2-1/2',
        },
      }),
    ]);

    const ratings: Record<string, { rating: number; rd: number }> = {};
    for (const r of user.ratings) {
      ratings[r.timeControl] = { rating: r.rating, rd: r.rd };
    }

    return reply.send({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      ratings,
      stats: {
        totalGames: user._count.gamesAsWhite + user._count.gamesAsBlack,
        wins,
        losses,
        draws,
      },
      followerCount: user._count.followers,
      followingCount: user._count.following,
    });
  });

  // Follow user
  app.post('/users/:username/follow', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = getUserFromRequest(request);
    const { username } = request.params as { username: string };

    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) return reply.status(404).send({ error: 'User not found' });
    if (target.id === userId) return reply.status(400).send({ error: 'Cannot follow yourself' });

    try {
      await prisma.follow.create({
        data: { followerId: userId, followedId: target.id },
      });
    } catch {
      // Already following
    }

    return reply.send({ ok: true });
  });

  // Unfollow user
  app.delete('/users/:username/follow', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = getUserFromRequest(request);
    const { username } = request.params as { username: string };

    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) return reply.status(404).send({ error: 'User not found' });

    await prisma.follow.deleteMany({
      where: { followerId: userId, followedId: target.id },
    });

    return reply.send({ ok: true });
  });

  // Get followers
  app.get('/users/:username/followers', async (request, reply) => {
    const { username } = request.params as { username: string };
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const followers = await prisma.follow.findMany({
      where: { followedId: user.id },
      include: { follower: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(followers.map((f) => f.follower));
  });

  // Get following
  app.get('/users/:username/following', async (request, reply) => {
    const { username } = request.params as { username: string };
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: { followed: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(following.map((f) => f.followed));
  });
}
