import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { db } from "../classes/database";
import { Type } from "@sinclair/typebox";
import { Theme } from "../../generated/prisma/enums";
import type { User } from "../@types";

export const settingsRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // Get user settings
  fastify.route<{
    Reply:
      | {
          language: string;
          theme: Theme;
          aiFeaturesDisabled: boolean;
        }
      | { error: string };
  }>({
    url: "/api/settings",
    method: "GET",
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const user = request.user;

        // Find or create user settings
        let settings = await db.user.findUnique({
          where: { id: user.userId },
          select: {
            language: true,
            theme: true,
            aiFeaturesDisabled: true,
          },
        });

        if (settings == null) {
          throw new Error("Settings not found");
        }

        return reply.send(settings);
      } catch (error) {
        console.error("Get settings error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });

  // Update user settings
  fastify.route<{
    Body: {
      language?: string;
      theme?: Theme;
      aiFeaturesDisabled?: boolean;
    };
    Reply: User | { error: string };
  }>({
    url: "/api/settings",
    method: "PATCH",
    schema: {
      body: Type.Object({
        language: Type.Optional(Type.String()),
        theme: Type.Optional(Type.String()),
        aiFeaturesDisabled: Type.Optional(Type.Boolean()),
      }),
    },
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const user = request.user;
        const body = request.body;

        // Upsert settings
        const settings = await db.user.update({
          where: { id: user.userId },
          data: body,
        });

        return reply.send(settings);
      } catch (error) {
        console.error("Update settings error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });
};
