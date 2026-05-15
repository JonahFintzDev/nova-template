import { User, ApiKey, UserSettings, AppSettings } from '@prisma/client';

export type { User, ApiKey, UserSettings, AppSettings };

export interface JwtPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  token: string;
}

export interface ValidateResponse {
  valid: boolean;
  username: string | null;
  userId: string | null;
  isAdmin: boolean;
  avatarUrl?: string | null;
}

export interface HealthResponse {
  ok: boolean;
  needsSetup: boolean;
  registrationEnabled: boolean;
  commentsEnabled: boolean;
}
