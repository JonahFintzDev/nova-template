import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../classes/database';
import { config } from '../classes/config';
import type { AuthResponse, ValidateResponse } from '../@types';

// Input validation schemas
const registerSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

// JWT token generation
const generateToken = (userId: string, username: string, isAdmin: boolean): string => {
  return sign({ userId, username, isAdmin }, config.jwtSecret, { expiresIn: '7d' });
};

// Helper to get user by username with password
const getUserWithPassword = async (username: string) => {
  return db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
      isAdmin: true,
      avatarUrl: true,
    },
  });
};

export const authRoutes = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
  // Register a new user
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const { username, password } = body;

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return reply.code(409).send({ error: 'Username already taken' });
      }

      // Check if registration is allowed
      const settings = await db.appSettings.findFirst();
      if (settings && !settings.registrationEnabled) {
        return reply.code(403).send({ error: 'Registration disabled' });
      }

      // Hash password
      const hashedPassword = await hash(password, 10);

      // Create user
      const user = await db.user.create({
        data: {
          username,
          password: hashedPassword,
          isAdmin: false,
        },
      });

      // If this is the first user, make them admin
      const userCount = await db.user.count();
      if (userCount === 1) {
        await db.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        });
      }

      // Generate token
      const token = generateToken(user.id, user.username, user.isAdmin);

      const response: AuthResponse = { token };
      return reply.send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Registration error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const { username, password } = body;

      // Find user
      const user = await getUserWithPassword(username);

      if (!user) {
        return reply.code(401).send({ error: 'Invalid username or password' });
      }

      // Check password
      const isValidPassword = await compare(password, user.password);

      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid username or password' });
      }

      // Generate token
      const token = generateToken(user.id, user.username, user.isAdmin);

      const response: AuthResponse = { token };
      return reply.send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Login error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Validate token
  fastify.post('/api/auth/validate', async (request, reply) => {
    try {
      const user = request.user;

      if (!user) {
        const response: ValidateResponse = {
          valid: false,
          username: null,
          userId: null,
          isAdmin: false,
        };
        return reply.send(response);
      }

      // Get fresh user data
      const freshUser = await db.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          username: true,
          isAdmin: true,
          avatarUrl: true,
        },
      });

      if (!freshUser) {
        const response: ValidateResponse = {
          valid: false,
          username: null,
          userId: null,
          isAdmin: false,
        };
        return reply.send(response);
      }

      const response: ValidateResponse = {
        valid: true,
        username: freshUser.username,
        userId: freshUser.id,
        isAdmin: freshUser.isAdmin,
        avatarUrl: freshUser.avatarUrl ?? undefined,
      };

      return reply.send(response);
    } catch (error) {
      console.error('Validation error:', error);
      const response: ValidateResponse = {
        valid: false,
        username: null,
        userId: null,
        isAdmin: false,
      };
      return reply.send(response);
    }
  });

  // Change password
  fastify.patch(
    '/api/auth/password',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user;
        const body = changePasswordSchema.parse(request.body);
        const { currentPassword, newPassword } = body;

        // Get current user with password
        const currentUser = await getUserWithPassword(user.username);

        if (!currentUser) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await compare(currentPassword, currentUser.password);

        if (!isValidPassword) {
          return reply.code(401).send({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 10);

        // Update password
        await db.user.update({
          where: { id: user.userId },
          data: { password: hashedPassword },
        });

        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        console.error('Change password error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
};
