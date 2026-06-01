import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { randomBytes } from "crypto";
import { db } from "../classes/database";
import type { ApiKeyWithPlainKey } from "../@types";
import { Type } from "@sinclair/typebox";

export const keysRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // List API keys for user
  fastify.route<{
    Reply:
      | Array<{
          id: string;
          name: string;
          keyPrefix: string;
          createdAt: Date;
          lastUsedAt: Date | null;
        }>
      | { error: string };
  }>({
    url: "/api/keys",
    method: "GET",
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
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
          orderBy: { createdAt: "desc" },
        });

        return reply.send(keys);
      } catch (error) {
        console.error("List keys error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });

  // Create new API key
  fastify.route<{
    Body: { name: string };
    Reply: ApiKeyWithPlainKey | { error: string };
  }>({
    url: "/api/keys",
    method: "POST",
    preHandler: fastify.authenticate,
    schema: {
      body: Type.Object({
        name: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      try {
        const user = request.user;
        const { name } = request.body;

        // Generate a secure random key
        const key = randomBytes(64).toString("base64url");
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
        console.error("Create key error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });

  // Delete API key
  fastify.route<{
    Params: { id: string };
    Reply: { success: true } | { error: string };
  }>({
    url: "/api/keys/:id",
    method: "DELETE",
    preHandler: fastify.authenticate,
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      try {
        const user = request.user;
        const { id } = request.params;

        // Check if key exists and belongs to user
        const key = await db.apiKey.findUnique({
          where: { id },
        });

        if (!key) {
          return reply.code(404).send({ error: "Key not found" });
        }

        if (key.userId !== user.userId) {
          return reply.code(403).send({ error: "Forbidden: Not your key" });
        }

        await db.apiKey.delete({
          where: { id },
        });

        return reply.send({ success: true });
      } catch (error) {
        console.error("Delete key error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });
};
