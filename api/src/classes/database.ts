// node_modules
import { PrismaPg } from "@prisma/adapter-pg";

// generated
import { PrismaClient } from "../../generated/prisma/client";

export const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

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
      },
    });
  }
};

// Close database connection gracefully
export const closeDatabase = async (): Promise<void> => {
  await db.$disconnect();
};
