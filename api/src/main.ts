// node_modules
import Fastify from "fastify";
import fastifyAuth from "@fastify/auth";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyWebsocket from "@fastify/websocket";
import { existsSync } from "node:fs";

// classes
import { registerAuth } from "./classes/auth";
import { config, ensureConfig } from "./classes/config";
import { db, initializeDatabase } from "./classes/database";

// routes
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { keysRoutes } from "./routes/keys";
import { settingsRoutes } from "./routes/settings";
import { twoFactorRoutes } from "./routes/twofactor";

const main = async (): Promise<void> => {
  ensureConfig();

  // Initialize database
  await initializeDatabase();

  const fastify = Fastify({ logger: config.isProduction });

  // Register plugins
  await fastify.register(fastifyCors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  });

  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Nova Template API",
        description:
          "REST API for Nova Template.\n\n" +
          "**Authentication:** All endpoints require `Authorization: Bearer <jwt>` header. " +
          "Obtain JWT from POST /api/auth/login or POST /api/auth/register.\n\n" +
          "API Keys for external integrations can be generated in Settings → API Keys.",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            description: "JWT obtained from POST /api/auth/login or POST /api/auth/register.",
          },
          apiKey: {
            type: "http",
            scheme: "bearer",
            description: "API key generated in Settings → API Keys.",
          },
        },
      },
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/api/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
  });

  await fastify.register(fastifyAuth);
  await fastify.register(fastifyJwt, { secret: config.jwtSecret });
  await fastify.register(fastifyWebsocket);
  await fastify.register(fastifyMultipart, { limits: { fileSize: 100 * 1024 * 1024 } });

  registerAuth(fastify);

  fastify.decorate("config", config);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(twoFactorRoutes);
  await fastify.register(settingsRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(keysRoutes);

  // Serve dashboard in production
  if (config.isProduction) {
    const staticRoot = "/dashboard";
    if (existsSync(staticRoot)) {
      await fastify.register(fastifyStatic, {
        root: staticRoot,
        prefix: "/",
      });
      fastify.setNotFoundHandler(async (request, reply) => {
        if (request.method === "GET" && !request.url.startsWith("/api")) {
          return reply.sendFile("index.html", staticRoot);
        }
        await reply.code(404).send({ error: "Not found" });
      });
    } else {
      console.error("Dashboard dist path does not exist", staticRoot);
      process.exit(1);
    }
  }

  // Start server
  await fastify.listen({ port: config.port, host: "0.0.0.0" });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await db.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await db.$disconnect();
  process.exit(0);
});
