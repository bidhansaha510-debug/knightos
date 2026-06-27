import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, getUserFromRequest } from '../middleware/auth.js';

export async function messageRoutes(app: FastifyInstance) {
  // Get chat history with another user
  app.get('/messages/:userId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId: currentUserId } = getUserFromRequest(request);
    const { userId: targetUserId } = request.params as { userId: string };

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return reply.send(messages);
  });

  // Post a new direct message
  app.post('/messages', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId: currentUserId } = getUserFromRequest(request);
    const { receiverId, content } = request.body as { receiverId: string; content: string };

    if (!receiverId || !content || content.trim().length === 0) {
      return reply.status(400).send({ error: 'Receiver ID and content are required' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!targetUser) {
      return reply.status(404).send({ error: 'Receiver not found' });
    }

    const dm = await prisma.directMessage.create({
      data: {
        senderId: currentUserId,
        receiverId,
        content: content.slice(0, 1000)
      }
    });

    return reply.send(dm);
  });
}
