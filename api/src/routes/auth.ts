import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { compare, hash } from 'bcrypt';
import { sign, verify as verifyJwt } from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../classes/database';
import { config } from '../classes/config';
import { verifyTwoFactorCode, validateBackupCode, useBackupCode } from '../classes/twofactor';
import type { AuthResponse, ValidateResponse, JwtPayload } from '../@types';

// Input validation schemas
const registerSchema = z.object({
  username: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const loginWithEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

const verifyTwoFactorLoginSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
});

// JWT token generation
const generateToken = (userId: string, username: string, isAdmin: boolean): string => {
  return sign({ userId, username, isAdmin }, config.jwtSecret, { expiresIn: '7d' });
};

// Generate token with 2FA pending flag
const generateTokenWith2FAPending = (
  userId: string,
  username: string,
  isAdmin: boolean,
): string => {
  return sign(
    { userId, username, isAdmin, twoFactorPending: true },
    config.jwtSecret,
    { expiresIn: '5m' }, // Short expiry for 2FA pending tokens
  );
};

// Helper to get user by username or email with password
const getUserWithPassword = async (usernameOrEmail: string) => {
  return db.user.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      isAdmin: true,
      avatarUrl: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      backupCodes: true,
    },
  });
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return verifyJwt(token, config.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
};

export const authRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // Register a new user
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const { username, email, password } = body;

      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });

      if (existingUser) {
        if (existingUser.username === username) {
          return reply.code(409).send({ error: 'Username already taken' });
        }
        if (existingUser.email === email) {
          return reply.code(409).send({ error: 'Email already registered' });
        }
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
          email,
          password: hashedPassword,
          isAdmin: false,
          emailVerified: new Date(), // Auto-verify for now
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

      // Find user by username or email
      const user = await getUserWithPassword(username);

      if (!user) {
        return reply.code(401).send({ error: 'Invalid username or password' });
      }

      // Check password
      const isValidPassword = user.password ? await compare(password, user.password) : false;

      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid username or password' });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Generate a token with 2FA pending flag
        const token = generateTokenWith2FAPending(user.id, user.username, user.isAdmin);

        return reply.send({
          token,
          requiresTwoFactor: true,
          userId: user.id,
        });
      }

      // Generate regular token
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

  // Login with email
  fastify.post('/api/auth/login/email', async (request, reply) => {
    try {
      const body = loginWithEmailSchema.parse(request.body);
      const { email, password } = body;

      // Find user by email
      const user = await getUserWithPassword(email);

      if (!user) {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      // Check password
      const isValidPassword = user.password ? await compare(password, user.password) : false;

      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Generate a token with 2FA pending flag
        const token = generateTokenWith2FAPending(user.id, user.username, user.isAdmin);

        return reply.send({
          token,
          requiresTwoFactor: true,
          userId: user.id,
        });
      }

      // Generate regular token
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

  // Verify 2FA and complete login
  fastify.post('/api/auth/verify-twofactor', async (request, reply) => {
    try {
      const body = verifyTwoFactorLoginSchema.parse(request.body);
      const { userId, code } = body;

      // Get user's 2FA info
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          isAdmin: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
          backupCodes: true,
        },
      });

      if (!user || !user.twoFactorEnabled) {
        return reply.code(400).send({ error: '2FA is not enabled for this user' });
      }

      if (!user.twoFactorSecret) {
        return reply.code(400).send({ error: '2FA secret is missing' });
      }

      // First, try to verify with the TOTP code
      let isValid = verifyTwoFactorCode(code, user.twoFactorSecret);

      // If TOTP fails, try backup codes
      if (!isValid) {
        const backupCodeValidation = validateBackupCode(code, user.backupCodes);
        if (backupCodeValidation.valid && backupCodeValidation.index !== null) {
          // Use the backup code
          await useBackupCode(userId, backupCodeValidation.index);
          isValid = true;
        }
      }

      if (!isValid) {
        return reply.code(400).send({ error: 'Invalid verification code' });
      }

      // Generate a full token
      const token = generateToken(user.id, user.username, user.isAdmin);

      const response: AuthResponse = { token };
      return reply.send(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Verify 2FA error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Validate token
  fastify.post('/api/auth/validate', async (request, reply) => {
    try {
      // Soft auth — set request.user if a valid token is present, but don't reject
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const rawToken = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(rawToken);
        if (decoded) request.user = decoded;
      }

      const user = request.user as JwtPayload | undefined;

      if (!user) {
        const response: ValidateResponse = {
          valid: false,
          username: null,
          userId: null,
          isAdmin: false,
        };
        return reply.send(response);
      }

      // Check if token has pending 2FA
      const isPending2FA = user.twoFactorPending === true;

      if (isPending2FA) {
        const response: ValidateResponse = {
          valid: true,
          username: user.username,
          userId: user.userId,
          isAdmin: user.isAdmin,
          avatarUrl: undefined,
          requiresTwoFactor: true,
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
          twoFactorEnabled: true,
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
        twoFactorEnabled: freshUser.twoFactorEnabled,
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

        if (!currentUser.password) {
          return reply.code(400).send({ error: 'Password not set on account' });
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
