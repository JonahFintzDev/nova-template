import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this",
  databaseUrl:
    process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/runnova?schema=public",
  isProduction: process.env.NODE_ENV === "production",
};

export const ensureConfig = (): void => {
  if (!config.jwtSecret || config.jwtSecret === "your-super-secret-jwt-key-change-this") {
    console.warn("WARNING: Using default JWT secret. Please set JWT_SECRET in your .env file.");
  }
};
