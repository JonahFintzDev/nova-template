import * as authenticator from "otplib";
import { db } from "./database";
import { config } from "./config";

// Generate a new TOTP secret
export const generateTwoFactorSecret = (): string => {
  return authenticator.generateSecret();
};

// Verify a TOTP code
export const verifyTwoFactorCode = (code: string, secret: string): boolean => {
  return authenticator.verifySync({ token: code, secret }).valid;
};

// Generate backup codes
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate a random 8-digit code
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.push(code);
  }
  return codes;
};

// Validate backup code
export const validateBackupCode = (
  code: string,
  backupCodes: string[] | null | undefined,
): { valid: boolean; index: number | null } => {
  if (!backupCodes || backupCodes.length === 0) {
    return { valid: false, index: null };
  }

  const index = backupCodes.findIndex((c) => c === code);
  if (index === -1) {
    return { valid: false, index: null };
  }

  return { valid: true, index };
};

// Enable 2FA for a user
export const enableTwoFactor = async (
  userId: string,
  secret: string,
  backupCodes: string[],
): Promise<void> => {
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
      backupCodes: backupCodes,
    },
  });
};

// Disable 2FA for a user
export const disableTwoFactor = async (userId: string): Promise<void> => {
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      backupCodes: [],
    },
  });
};

// Use a backup code (removes it from the list)
export const useBackupCode = async (userId: string, index: number): Promise<void> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true },
  });

  if (!user || !user.backupCodes || index < 0 || index >= user.backupCodes.length) {
    return;
  }

  // Remove the used backup code
  const updatedBackupCodes = [...user.backupCodes];
  updatedBackupCodes.splice(index, 1);

  await db.user.update({
    where: { id: userId },
    data: { backupCodes: updatedBackupCodes },
  });
};

// Get 2FA setup information for a user
export const getTwoFactorSetupInfo = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorSecret: true,
      twoFactorEnabled: true,
      backupCodes: true,
      username: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    enabled: user.twoFactorEnabled,
    secret: user.twoFactorSecret,
    backupCodes: user.backupCodes,
  };
};
