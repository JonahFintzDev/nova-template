import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { db } from "../classes/database";
import { isAdmin } from "../classes/auth";
import type { AppSettings } from "../@types";
import { Type } from "@sinclair/typebox";
import { Theme } from "../../generated/prisma/enums";

export const adminRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // List all users
  fastify.route<{
    Reply:
      | Array<{
          id: string;
          username: string;
          isAdmin: boolean;
          createdAt: Date;
          updatedAt: Date;
        }>
      | { error: string };
  }>({
    url: "/api/admin/users",
    method: "GET",
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: "Forbidden: Admin access required" });
        }

        const users = await db.user.findMany({
          select: {
            id: true,
            username: true,
            isAdmin: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
        });

        return reply.send(users);
      } catch (error) {
        console.error("List users error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });

  // Update user
  fastify.route<{
    Params: { id: string };
    Body: {
      isAdmin?: boolean;
      username?: string;
      email?: string;
      name?: string;
      avatarUrl?: string | null;
      twoFactorEnabled?: boolean;
      theme?: Theme;
      language?: string;
      aiFeaturesDisabled?: boolean;
    };
    Reply:
      | {
          id: string;
          username: string;
          isAdmin: boolean;
          createdAt: Date;
          updatedAt: Date;
        }
      | { error: string };
  }>({
    url: "/api/admin/users/:id",
    method: "PATCH",
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
      body: Type.Object({
        isAdmin: Type.Optional(Type.Boolean()),
        username: Type.Optional(Type.String()),
        email: Type.Optional(Type.String({ format: "email" })),
        name: Type.Optional(Type.String()),
        avatarUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        twoFactorEnabled: Type.Optional(Type.Boolean()),
        theme: Type.Optional(Type.String()),
        language: Type.Optional(Type.String()),
        aiFeaturesDisabled: Type.Optional(Type.Boolean()),
      }),
    },
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: "Forbidden: Admin access required" });
        }

        const { id } = request.params;
        const body = request.body;

        const user = await db.user.findUnique({
          where: { id },
        });

        if (!user) {
          return reply.code(404).send({ error: "User not found" });
        }

        // Prevent self-modification
        if (request.user.userId === id && body.isAdmin === false) {
          return reply.code(400).send({ error: "Cannot remove admin rights from yourself" });
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
        console.error("Update user error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });

  // Delete user
  fastify.route<{
    Params: { id: string };
    Reply: { success: true } | { error: string };
  }>({
    url: "/api/admin/users/:id",
    method: "DELETE",
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: "Forbidden: Admin access required" });
        }

        const { id } = request.params;

        // Prevent self-deletion
        if (request.user.userId === id) {
          return reply.code(400).send({ error: "Cannot delete yourself" });
        }

        await db.user.delete({
          where: { id },
        });

        return reply.send({ success: true });
      } catch (error) {
        console.error("Delete user error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });

  // Get app settings
  fastify.route<{
    Reply: AppSettings | { error: string };
  }>({
    url: "/api/admin/settings",
    method: "GET",
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: "Forbidden: Admin access required" });
        }

        let settings = await db.appSettings.findFirst();

        if (!settings) {
          settings = await db.appSettings.create({
            data: {
              registrationEnabled: true,
            },
          });
        }

        return reply.send(settings);
      } catch (error) {
        console.error("Get admin settings error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });

  // Update app settings
  fastify.route<{
    Body: {
      registrationEnabled?: boolean;
      aiApiUrl?: string | null;
      aiApiKey?: string | null;
      aiModel?: string | null;
    };
    Reply: AppSettings | { error: string };
  }>({
    url: "/api/admin/settings",
    method: "PATCH",
    schema: {
      body: Type.Object({
        registrationEnabled: Type.Optional(Type.Boolean()),
        aiApiUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        aiApiKey: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        aiModel: Type.Optional(Type.Union([Type.String(), Type.Null()])),
      }),
    },
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        if (!isAdmin(request)) {
          return reply.code(403).send({ error: "Forbidden: Admin access required" });
        }

        const body = request.body;

        // Get existing settings
        let settings = await db.appSettings.findFirst();

        if (!settings) {
          settings = await db.appSettings.create({
            data: {
              registrationEnabled: true,
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
        console.error("Update admin settings error:", error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    },
  });
};
