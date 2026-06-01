import { User, ApiKey, UserSettings, AppSettings } from '@prisma/client';

export type { User, ApiKey, UserSettings, AppSettings };

export interface ApiKeyWithPlainKey {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface JwtPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  twoFactorPending?: boolean;
}

export interface AuthResponse {
  token: string;
  requiresTwoFactor?: boolean;
  userId?: string;
}

export interface LoginResponse extends AuthResponse {
  requiresTwoFactor?: boolean;
  userId?: string;
}

export interface ValidateResponse {
  valid: boolean;
  username: string | null;
  userId: string | null;
  isAdmin: boolean;
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
  requiresTwoFactor?: boolean;
}

export interface HealthResponse {
  ok: boolean;
  needsSetup: boolean;
  registrationEnabled: boolean;
  commentsEnabled: boolean;
}
