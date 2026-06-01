import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../classes/database';
import { config } from '../classes/config';
import {
  generateTwoFactorSecret,
  generateQRCodeDataURL,
  verifyTwoFactorCode,
  generateBackupCodes,
  validateBackupCode,
  enableTwoFactor,
  disableTwoFactor,
  useBackupCode,
  getTwoFactorSetupInfo,
} from '../classes/twofactor';
import type { AuthResponse } from '../@types';

// Input validation schemas
const enableTwoFactorSchema = z.object({
  code: z.string().length(6),
});

const verifyTwoFactorSchema = z.object({
  code: z.string().length(6),
});

const disableTwoFactorSchema = z.object({
  password: z.string().min(1),
});

export const twoFactorRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // Get 2FA setup info (for displaying QR code)
  fastify.get(
    '/api/auth/2fa/setup',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user;
        const setupInfo = await getTwoFactorSetupInfo(user.userId);

        if (!setupInfo) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // If user already has a secret but 2FA is not enabled, return it
        // If 2FA is already enabled, return the info
        return reply.send({
          enabled: setupInfo.enabled,
          qrCodeUrl: setupInfo.qrCodeUrl,
          secret: setupInfo.secret,
          backupCodes: setupInfo.backupCodes,
        });
      } catch (error) {
        console.error('Get 2FA setup error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Generate a new 2FA secret (start setup)
  fastify.post(
    '/api/auth/2fa/generate',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user;

        // Generate a new secret
        const secret = generateTwoFactorSecret();

        // Store the secret temporarily in the user record
        await db.user.update({
          where: { id: user.userId },
          data: { twoFactorSecret: secret },
        });

        // Generate QR code URL
        const otpAuthUrl = `otpauth://totp/Nova:${user.username}?secret=${secret}&issuer=Nova`;
        const qrCodeUrl = await generateQRCodeDataURL(otpAuthUrl);

        // Generate backup codes
        const backupCodes = generateBackupCodes(10);

        return reply.send({
          secret,
          qrCodeUrl,
          backupCodes,
        });
      } catch (error) {
        console.error('Generate 2FA secret error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Enable 2FA (verify the code and enable)
  fastify.post(
    '/api/auth/2fa/enable',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user;
        const body = enableTwoFactorSchema.parse(request.body);
        const { code } = body;

        // Get user's current 2FA secret
        const userRecord = await db.user.findUnique({
          where: { id: user.userId },
          select: { twoFactorSecret: true, backupCodes: true },
        });

        if (!userRecord || !userRecord.twoFactorSecret) {
          return reply.code(400).send({ error: 'No 2FA secret found. Please generate one first.' });
        }

        // Verify the code
        const isValid = verifyTwoFactorCode(code, userRecord.twoFactorSecret);

        if (!isValid) {
          return reply.code(400).send({ error: 'Invalid verification code' });
        }

        // Enable 2FA
        await enableTwoFactor(
          user.userId,
          userRecord.twoFactorSecret,
          userRecord.backupCodes || [],
        );

        return reply.send({
          success: true,
          message: '2FA enabled successfully',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        console.error('Enable 2FA error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Verify 2FA code (for login flow)
  fastify.post('/api/auth/2fa/verify', async (request, reply) => {
    try {
      const body = verifyTwoFactorSchema.parse(request.body);
      const { code } = body;

      // Get the user ID from the request (this would be set after successful credentials auth)
      // For now, we expect a userId in the request body or headers
      const userId = request.headers['x-user-id'] as string | undefined;

      if (!userId) {
        return reply.code(400).send({ error: 'User ID is required' });
      }

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

      // Generate a full JWT token for the user
      const token = sign(
        { userId: user.id, username: user.username, isAdmin: user.isAdmin },
        config.jwtSecret,
        { expiresIn: '7d' },
      );

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

  // Disable 2FA
  fastify.post(
    '/api/auth/2fa/disable',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user;
        const body = disableTwoFactorSchema.parse(request.body);
        const { password } = body;

        // Verify the user's password before disabling 2FA
        const userRecord = await db.user.findUnique({
          where: { id: user.userId },
          select: { password: true },
        });

        if (!userRecord || !userRecord.password) {
          return reply.code(400).send({ error: 'Password verification failed' });
        }

        // Compare passwords
        const { compare } = await import('bcrypt');
        const isValidPassword = await compare(password, userRecord.password);

        if (!isValidPassword) {
          return reply.code(400).send({ error: 'Password is incorrect' });
        }

        // Disable 2FA
        await disableTwoFactor(user.userId);

        return reply.send({
          success: true,
          message: '2FA disabled successfully',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        console.error('Disable 2FA error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Regenerate backup codes
  fastify.post(
    '/api/auth/2fa/backup-codes/regenerate',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user;

        // Verify the user's password before regenerating backup codes
        const body = disableTwoFactorSchema.parse(request.body);
        const { password } = body;

        const userRecord = await db.user.findUnique({
          where: { id: user.userId },
          select: { password: true },
        });

        if (!userRecord || !userRecord.password) {
          return reply.code(400).send({ error: 'Password verification failed' });
        }

        // Compare passwords
        const { compare } = await import('bcrypt');
        const isValidPassword = await compare(password, userRecord.password);

        if (!isValidPassword) {
          return reply.code(400).send({ error: 'Password is incorrect' });
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes(10);

        // Update user with new backup codes
        await db.user.update({
          where: { id: user.userId },
          data: { backupCodes },
        });

        return reply.send({
          success: true,
          backupCodes,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        console.error('Regenerate backup codes error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
};
