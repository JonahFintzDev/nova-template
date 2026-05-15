import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { db } from '../classes/database';
import { isAdmin } from '../classes/auth';
import type { User, AppSettings } from '../@types';

const updateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
});

const updateSettingsSchema = z.object({
  registrationEnabled: z.boolean().optional(),
  commentsEnabled: z.boolean().optional(),
  aiApiUrl: z.string().nullable().optional(),
  aiApiKey: z.string().nullable().optional(),
  aiModel: z.string().nullable().optional(),
});

export const adminRoutes = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
  // List all users
  fastify.get('/api/admin/users', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      if (!isAdmin(request)) {
        return reply.code(403).send({ error: 'Forbidden: Admin access required' });
      }

      const users: User[] = await db.user.findMany({
        select: {
          id: true,
          username: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return reply.send(users);
    } catch (error) {
      console.error('List users error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update user
  fastify.patch(
    '/api/admin/users/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: 'Forbidden: Admin access required' });
        }

        const { id } = request.params as { id: string };
        const body = updateUserSchema.parse(request.body);

        const user = await db.user.findUnique({
          where: { id },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Prevent self-modification
        if (request.user.userId === id && body.isAdmin === false) {
          return reply.code(400).send({ error: 'Cannot remove admin rights from yourself' });
        }

        const updatedUser = await db.user.update({
          where: { id },
          data: body,
          select: {
            id: true,
            username: true,
            isAdmin: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return reply.send(updatedUser);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        console.error('Update user error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Delete user
  fastify.delete(
    '/api/admin/users/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: 'Forbidden: Admin access required' });
        }

        const { id } = request.params as { id: string };

        // Prevent self-deletion
        if (request.user.userId === id) {
          return reply.code(400).send({ error: 'Cannot delete yourself' });
        }

        await db.user.delete({
          where: { id },
        });

        return reply.send({ success: true });
      } catch (error) {
        console.error('Delete user error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Get app settings
  fastify.get(
    '/api/admin/settings',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: 'Forbidden: Admin access required' });
        }

        let settings = await db.appSettings.findFirst();

        if (!settings) {
          settings = await db.appSettings.create({
            data: {
              registrationEnabled: true,
              commentsEnabled: true,
            },
          });
        }

        return reply.send(settings);
      } catch (error) {
        console.error('Get admin settings error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Update app settings
  fastify.patch(
    '/api/admin/settings',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: 'Forbidden: Admin access required' });
        }

        const body = updateSettingsSchema.parse(request.body);

        // Get existing settings
        let settings = await db.appSettings.findFirst();

        if (!settings) {
          settings = await db.appSettings.create({
            data: {
              registrationEnabled: true,
              commentsEnabled: true,
              ...body,
            },
          });
        } else {
          settings = await db.appSettings.update({
            where: { id: settings.id },
            data: body,
          });
        }

        return reply.send(settings);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        console.error('Update admin settings error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
};
