import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ensure only one instance is created
export const db = prisma;

// Health check for database
export const checkDatabase = async (): Promise<boolean> => {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

// Initialize database with default settings if needed
export const initializeDatabase = async (): Promise<void> => {
  // Check if app settings exist
  const settingsCount = await db.appSettings.count();

  if (settingsCount === 0) {
    await db.appSettings.create({
      data: {
        registrationEnabled: true,
        commentsEnabled: true,
      },
    });
  }
};

// Close database connection gracefully
export const closeDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};
