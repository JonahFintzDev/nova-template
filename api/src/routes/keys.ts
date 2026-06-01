import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { db } from '../classes/database';
import type { ApiKeyWithPlainKey } from '../@types';

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
});

export const keysRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // List API keys for user
  fastify.get('/api/keys', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = request.user;

      const keys = await db.apiKey.findMany({
        where: { userId: user.userId },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          createdAt: true,
          lastUsedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(keys);
    } catch (error) {
      console.error('List keys error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create new API key
  fastify.post('/api/keys', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = request.user;
      const body = createKeySchema.parse(request.body);
      const { name } = body;

      // Generate a secure random key
      const key = randomBytes(64).toString('base64url');
      const keyPrefix = key.substring(0, 8);

      const newKey = await db.apiKey.create({
        data: {
          name,
          key,
          keyPrefix,
          userId: user.userId,
        },
      });

      // Return the key (this is the only time it will be shown)
      const response: ApiKeyWithPlainKey = {
        id: newKey.id,
        name: newKey.name,
        key: newKey.key,
        keyPrefix: newKey.keyPrefix,
        createdAt: newKey.createdAt,
        lastUsedAt: newKey.lastUsedAt,
      };

      return reply.send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Create key error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete API key
  fastify.delete('/api/keys/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = request.user;
      const { id } = request.params as { id: string };

      // Check if key exists and belongs to user
      const key = await db.apiKey.findUnique({
        where: { id },
      });

      if (!key) {
        return reply.code(404).send({ error: 'Key not found' });
      }

      if (key.userId !== user.userId) {
        return reply.code(403).send({ error: 'Forbidden: Not your key' });
      }

      await db.apiKey.delete({
        where: { id },
      });

      return reply.send({ success: true });
    } catch (error) {
      console.error('Delete key error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
};
