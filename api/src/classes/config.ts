import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

dotenvConfig({ path: resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
  nextauthSecret: process.env.NEXTAUTH_SECRET || 'your-secure-nextauth-secret-change-this',
  nextauthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  databaseUrl:
    process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/runnova?schema=public',
  dashboardDistPath: resolve(__dirname, '../../../dashboard/dist'),
  isProduction: process.env.NODE_ENV === 'production',
};

export const ensureConfig = (): void => {
  if (!config.jwtSecret || config.jwtSecret === 'your-super-secret-jwt-key-change-this') {
    console.warn('WARNING: Using default JWT secret. Please set JWT_SECRET in your .env file.');
  }
  if (
    !config.nextauthSecret ||
    config.nextauthSecret === 'your-secure-nextauth-secret-change-this'
  ) {
    console.warn(
      'WARNING: Using default NextAuth secret. Please set NEXTAUTH_SECRET in your .env file.',
    );
  }
};
