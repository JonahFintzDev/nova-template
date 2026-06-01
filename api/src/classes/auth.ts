import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { verify } from "jsonwebtoken";
import { config } from "./config";
import type { JwtPayload } from "../@types";

interface AuthOptions {
  jwtSecret?: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: JwtPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    config: typeof config;
  }
}

const DEFAULT_OPTIONS: AuthOptions = {
  jwtSecret: config.jwtSecret,
};

export const registerAuth = (fastify: FastifyInstance, options: FastifyPluginOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options } as AuthOptions;

  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        await reply.code(401).send({ error: "Unauthorized: No token provided" });
        return;
      }

      const token = authHeader.replace("Bearer ", "");

      if (!token) {
        await reply.code(401).send({ error: "Unauthorized: Invalid token format" });
        return;
      }

      const decoded = verify(token, opts.jwtSecret!) as JwtPayload;
      request.user = decoded;
    } catch (error) {
      await reply.code(401).send({
        error: "Unauthorized: Invalid token",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
};

export const getUser = (request: FastifyRequest) => {
  return request.user;
};

export const isAdmin = (request: FastifyRequest) => {
  return request.user?.isAdmin === true;
};
