import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { db } from '../classes/database';
import type { HealthResponse } from '../@types';

export const healthRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get('/api/health', async (request, reply) => {
    try {
      // Check database connectivity
      await db.$queryRaw`SELECT 1`;

      // Check if setup is needed (no users exist)
      const userCount = await db.user.count();
      const needsSetup = userCount === 0;

      // Get app settings
      const settings = await db.appSettings.findFirst();

      const response: HealthResponse = {
        ok: true,
        needsSetup,
        registrationEnabled: settings?.registrationEnabled ?? true,
        commentsEnabled: settings?.commentsEnabled ?? true,
      };

      return reply.send(response);
    } catch {
      const response: HealthResponse = {
        ok: false,
        needsSetup: true,
        registrationEnabled: true,
        commentsEnabled: true,
      };
      return reply.code(503).send(response);
    }
  });
};
