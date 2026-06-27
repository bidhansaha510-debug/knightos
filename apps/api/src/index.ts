import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { env } from './config/env.js';
import { authRoutes } from './routes/auth.js';
import { gameRoutes } from './routes/games.js';
import { puzzleRoutes } from './routes/puzzles.js';
import { userRoutes } from './routes/users.js';
import { messageRoutes } from './routes/messages.js';
import { leaderboardRoutes } from './routes/leaderboard.js';
import { lobbyWs } from './ws/lobby.js';
import { gameWs } from './ws/game.js';
import { prisma } from './lib/prisma.js';

const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

// Plugins
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
await app.register(cors, {
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
});

await app.register(cookie);
await app.register(websocket);

// REST Routes
await app.register(authRoutes);
await app.register(gameRoutes);
await app.register(puzzleRoutes);
await app.register(userRoutes);
await app.register(messageRoutes);
await app.register(leaderboardRoutes);

// WebSocket Routes
await app.register(lobbyWs);
await app.register(gameWs);

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: Date.now() }));

// Graceful shutdown
const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down gracefully...`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start
try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`🏰 KnightOS API running on http://localhost:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
