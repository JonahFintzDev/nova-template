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

export const authApi = {
  async register(username: string, password: string): Promise<{ token: string }> {
    const response = await api.post<{ token: string }>('/api/auth/register', {
      username,
      password,
    });
    return response.data;
  },
  async login(username: string, password: string): Promise<{ token: string }> {
    const response = await api.post<{ token: string }>('/api/auth/login', { username, password });
    return response.data;
  },
  async validate(): Promise<{
    valid: boolean;
    username: string | null;
    userId: string | null;
    isAdmin: boolean;
    avatarUrl?: string | null;
  }> {
    const response = await api.post<{
      valid: boolean;
      username: string | null;
      userId: string | null;
      isAdmin: boolean;
      avatarUrl?: string | null;
    }>('/api/auth/validate');
    return response.data;
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.patch('/api/auth/password', { currentPassword, newPassword });
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

// -------------------------------------------------- WebSocket --------------------------------------------------

export type WsMessage = { type: 'pong' };

type WsListener = (msg: WsMessage) => void;

class AppWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<WsListener>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldConnect = false;

  connect(): void {
    this.shouldConnect = true;
    this.open();
  }

  disconnect(): void {
    this.shouldConnect = false;
    this.cleanup();
  }

  on(listener: WsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private open(): void {
    if (this.ws) return;
    const token = getStoredToken();
    if (!token) return;

    const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
    const wsBase = baseUrl
      ? baseUrl.replace(/^http/, 'ws')
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

    this.ws = new WebSocket(`${wsBase}/api/ws?token=${encodeURIComponent(token)}`);

    this.ws.onopen = () => {
      this.pingInterval = setInterval(() => {
        this.ws?.send(JSON.stringify({ type: 'ping' }));
      }, 30_000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        for (const listener of this.listeners) {
          listener(msg);
        }
      } catch {
        // ignore malformed
      }
    };

    this.ws.onclose = () => {
      this.cleanup();
      if (this.shouldConnect) {
        this.reconnectTimeout = setTimeout(() => this.open(), 5_000);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

export const appWs = new AppWebSocket();
