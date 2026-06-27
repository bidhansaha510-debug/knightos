import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { authMiddleware, getUserFromRequest } from '../middleware/auth.js';
import type { TimeControlCategory } from '@knightos/shared';

const TIME_CONTROLS: TimeControlCategory[] = ['bullet', 'blitz', 'rapid', 'classical', 'puzzle'];
const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

function generateTokens(userId: string, username: string) {
  const accessToken = jwt.sign({ userId, username }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ userId, username }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: false,       // local dev over HTTP — never set true on localhost
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  };
}

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/auth/register', async (request, reply) => {
    const { username, email, password } = request.body as {
      username: string;
      email: string;
      password: string;
    };

    // Validation
    if (!username || username.length < 3 || username.length > 20) {
      return reply.status(400).send({ error: 'Username must be 3–20 characters' });
    }
    if (!email || !email.includes('@')) {
      return reply.status(400).send({ error: 'Invalid email' });
    }
    if (!password || password.length < 6) {
      return reply.status(400).send({ error: 'Password must be at least 6 characters' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return reply.status(400).send({ error: 'Username can only contain letters, numbers, hyphens, and underscores' });
    }

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return reply.status(409).send({
        error: existing.username === username ? 'Username taken' : 'Email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        ratings: {
          create: TIME_CONTROLS.map((tc) => ({
            timeControl: tc,
            rating: 1500,
            rd: 350,
            volatility: 0.06,
          })),
        },
      },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.username);

    reply.setCookie('refreshToken', refreshToken, cookieOptions());

    return reply.status(201).send({
      user,
      accessToken,
    });
  });

  // Login
  app.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, email: true, passwordHash: true, createdAt: true },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.username);

    reply.setCookie('refreshToken', refreshToken, cookieOptions());

    const { passwordHash: _, ...userWithoutPassword } = user;
    return reply.send({ user: userWithoutPassword, accessToken });
  });

  // Refresh token
  app.post('/auth/refresh', async (request, reply) => {
    const token = (request as any).cookies?.refreshToken;
    if (!token) {
      return reply.status(401).send({ error: 'No refresh token' });
    }

    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        userId: string;
        username: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true },
      });

      if (!user) {
        return reply.status(401).send({ error: 'User not found' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id, user.username);

      reply.setCookie('refreshToken', refreshToken, cookieOptions());

      return reply.send({ accessToken });
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Logout
  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('refreshToken', { path: '/' });
    return reply.send({ ok: true });
  });

  // Get current user
  app.get('/auth/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = getUserFromRequest(request);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        ratings: {
          select: { timeControl: true, rating: true, rd: true },
        },
      },
    });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return reply.send(user);
  });
}
