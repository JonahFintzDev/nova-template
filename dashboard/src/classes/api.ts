// node_modules
import axios, { type AxiosInstance } from 'axios';

// types
import type { ApiKey, ApiKeyWithPlainKey, AppSettings, User, UserSettings } from '@/@types/index';

const TOKEN_KEY = 'nova-template-token';

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 30000,
});

let bApiReachable = true;
const reachabilityListeners = new Set<(online: boolean) => void>();

export const getApiReachable = (): boolean => {
  return bApiReachable;
};

export const subscribeApiReachable = (listener: (online: boolean) => void): (() => void) => {
  reachabilityListeners.add(listener);
  return () => {
    reachabilityListeners.delete(listener);
  };
};

const setApiReachable = (online: boolean): void => {
  if (bApiReachable === online) {
    return;
  }
  bApiReachable = online;
  for (const listener of reachabilityListeners) {
    listener(online);
  }
};

api.interceptors.request.use((configuration) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    configuration.headers.Authorization = `Bearer ${token}`;
  }
  return configuration;
});

api.interceptors.response.use(
  (response) => {
    setApiReachable(true);
    return response;
  },
  (error) => {
    if (!error.response && error.code !== 'ERR_CANCELED') {
      setApiReachable(false);
    } else if (error.response) {
      setApiReachable(true);
    }
    return Promise.reject(error);
  },
);

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// -------------------------------------------------- Health --------------------------------------------------

export const healthApi = {
  async check(): Promise<{
    ok: boolean;
    needsSetup: boolean;
    registrationEnabled: boolean;
    commentsEnabled: boolean;
  }> {
    const response = await api.get<{
      ok: boolean;
      needsSetup: boolean;
      registrationEnabled: boolean;
      commentsEnabled: boolean;
    }>('/api/health');
    return response.data;
  },
};

// -------------------------------------------------- Auth --------------------------------------------------

export interface AuthResponse {
  token: string;
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

export const authApi = {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', { username, password });
    return response.data;
  },
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login/email', { email, password });
    return response.data;
  },
  async validate(): Promise<ValidateResponse> {
    const response = await api.post<ValidateResponse>('/api/auth/validate');
    return response.data;
  },
  async verifyTwoFactor(userId: string, code: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/verify-twofactor', { userId, code });
    return response.data;
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.patch('/api/auth/password', { currentPassword, newPassword });
  },
};

// -------------------------------------------------- 2FA --------------------------------------------------

export interface TwoFactorSetupInfo {
  enabled: boolean;
  qrCodeUrl?: string | null;
  secret?: string | null;
  backupCodes?: string[] | null;
}

export interface TwoFactorGenerateResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export const twoFactorApi = {
  async getSetupInfo(): Promise<TwoFactorSetupInfo> {
    const response = await api.get<TwoFactorSetupInfo>('/api/auth/2fa/setup');
    return response.data;
  },
  async generateSecret(): Promise<TwoFactorGenerateResponse> {
    const response = await api.post<TwoFactorGenerateResponse>('/api/auth/2fa/generate');
    return response.data;
  },
  async enableTwoFactor(code: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/api/auth/2fa/enable', {
      code,
    });
    return response.data;
  },
  async disableTwoFactor(password: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      '/api/auth/2fa/disable',
      { password },
    );
    return response.data;
  },
  async regenerateBackupCodes(
    password: string,
  ): Promise<{ success: boolean; backupCodes: string[] }> {
    const response = await api.post<{ success: boolean; backupCodes: string[] }>(
      '/api/auth/2fa/backup-codes/regenerate',
      { password },
    );
    return response.data;
  },
};

// -------------------------------------------------- Settings --------------------------------------------------

export const settingsApi = {
  async get(): Promise<UserSettings> {
    const response = await api.get<UserSettings>('/api/settings');
    return response.data;
  },
  async update(payload: Partial<UserSettings>): Promise<UserSettings> {
    const response = await api.patch<UserSettings>('/api/settings', payload);
    return response.data;
  },
};

// -------------------------------------------------- Admin --------------------------------------------------

export const adminApi = {
  async listUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/api/admin/users');
    return response.data;
  },
  async updateUser(id: string, payload: { isAdmin?: boolean }): Promise<User> {
    const response = await api.patch<User>(`/api/admin/users/${id}`, payload);
    return response.data;
  },
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/api/admin/users/${id}`);
  },
  async getSettings(): Promise<AppSettings> {
    const response = await api.get<AppSettings>('/api/admin/settings');
    return response.data;
  },
  async updateSettings(payload: Partial<AppSettings>): Promise<AppSettings> {
    const response = await api.patch<AppSettings>('/api/admin/settings', payload);
    return response.data;
  },
};

// -------------------------------------------------- API Keys --------------------------------------------------

export const apiKeysApi = {
  async list(): Promise<ApiKey[]> {
    const response = await api.get<ApiKey[]>('/api/keys');
    return response.data;
  },
  async create(name: string): Promise<ApiKeyWithPlainKey> {
    const response = await api.post<ApiKeyWithPlainKey>('/api/keys', { name });
    return response.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/keys/${id}`);
  },
};

// -------------------------------------------------- Avatar --------------------------------------------------

export const avatarApi = {
  async upload(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('avatar', file);
    const response = await api.post<{ avatarUrl: string }>('/api/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  async remove(): Promise<void> {
    await api.delete('/api/users/avatar');
  },
};
