import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { db } from '../classes/database';
import type { UserSettings } from '../@types';

const settingsSchema = z.object({
  language: z.string().optional(),
  autoTheme: z.boolean().optional(),
  darkTheme: z.string().nullable().optional(),
  lightTheme: z.string().nullable().optional(),
  aiFeaturesDisabled: z.boolean().optional(),
});

export const settingsRoutes = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
  // Get user settings
  fastify.get('/api/settings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = request.user;

      // Find or create user settings
      let settings = await db.userSettings.findUnique({
        where: { userId: user.userId },
      });

      if (!settings) {
        // Check if user has settings in the user table
        const userData = await db.user.findUnique({
          where: { id: user.userId },
          select: {
            language: true,
            autoTheme: true,
            darkTheme: true,
            lightTheme: true,
            aiFeaturesDisabled: true,
          },
        });

        if (userData) {
          settings = await db.userSettings.create({
            data: {
              userId: user.userId,
              language: userData.language,
              autoTheme: userData.autoTheme,
              darkTheme: userData.darkTheme,
              lightTheme: userData.lightTheme,
              aiFeaturesDisabled: userData.aiFeaturesDisabled,
            },
          });
        } else {
          settings = await db.userSettings.create({
            data: {
              userId: user.userId,
              language: 'en',
              autoTheme: true,
              darkTheme: 'deep-space',
              lightTheme: 'taskscape',
              aiFeaturesDisabled: false,
            },
          });
        }
      }

      return reply.send(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update user settings
  fastify.patch('/api/settings', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = request.user;
      const body = settingsSchema.parse(request.body);

      // Upsert settings
      const settings = await db.userSettings.upsert({
        where: { userId: user.userId },
        update: body,
        create: {
          userId: user.userId,
          ...body,
        },
      });

      // Also update user table for backward compatibility
      await db.user.update({
        where: { id: user.userId },
        data: {
          language: body.language ?? undefined,
          autoTheme: body.autoTheme ?? undefined,
          darkTheme: body.darkTheme ?? undefined,
          lightTheme: body.lightTheme ?? undefined,
          aiFeaturesDisabled: body.aiFeaturesDisabled ?? undefined,
        },
      });

      return reply.send(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Update settings error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
};
