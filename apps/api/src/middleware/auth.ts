import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  username: string;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (request as any).user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export function getUserFromRequest(request: FastifyRequest): JwtPayload {
  return (request as any).user;
}
