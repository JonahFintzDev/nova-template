export type Priority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  language: string;
  autoTheme: boolean;
  darkTheme: string | null;
  lightTheme: string | null;
  avatarUrl?: string | null;
}

export interface UserSettings {
  language: string;
  autoTheme: boolean;
  darkTheme: string | null;
  lightTheme: string | null;
  aiFeaturesDisabled: boolean;
}

export interface AppSettings {
  registrationEnabled: boolean;
  commentsEnabled: boolean;
  aiApiUrl: string | null;
  aiApiKey: string | null;
  aiModel: string | null;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiKeyWithPlainKey extends ApiKey {
  key: string;
}

export interface McpConfig {
  mcpServerUrl: string;
  apiBaseUrl: string;
  apiKeyPrefix: string;
  userId: string;
  serverName: string;
  serverVersion: string;
  capabilities: string[];
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
  resources: Array<{
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  }>;
  instructions: string;
}
