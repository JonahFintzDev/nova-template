// node_modules
import axios from 'axios';
const TOKEN_KEY = 'nova-template-token';
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '',
    timeout: 30000,
});
let bApiReachable = true;
const reachabilityListeners = new Set();
export const getApiReachable = () => {
    return bApiReachable;
};
export const subscribeApiReachable = (listener) => {
    reachabilityListeners.add(listener);
    return () => {
        reachabilityListeners.delete(listener);
    };
};
const setApiReachable = (online) => {
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
api.interceptors.response.use((response) => {
    setApiReachable(true);
    return response;
}, (error) => {
    if (!error.response && error.code !== 'ERR_CANCELED') {
        setApiReachable(false);
    }
    else if (error.response) {
        setApiReachable(true);
    }
    return Promise.reject(error);
});
export const getStoredToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};
export const setStoredToken = (token) => {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
    else {
        localStorage.removeItem(TOKEN_KEY);
    }
};
// -------------------------------------------------- Health --------------------------------------------------
export const healthApi = {
    async check() {
        const response = await api.get('/api/health');
        return response.data;
    },
};
export const authApi = {
    async register(username, email, password) {
        const response = await api.post('/api/auth/register', {
            username,
            email,
            password,
        });
        return response.data;
    },
    async login(username, password) {
        const response = await api.post('/api/auth/login', { username, password });
        return response.data;
    },
    async loginWithEmail(email, password) {
        const response = await api.post('/api/auth/login/email', { email, password });
        return response.data;
    },
    async validate() {
        const response = await api.post('/api/auth/validate');
        return response.data;
    },
    async verifyTwoFactor(userId, code) {
        const response = await api.post('/api/auth/verify-twofactor', { userId, code });
        return response.data;
    },
    async changePassword(currentPassword, newPassword) {
        await api.patch('/api/auth/password', { currentPassword, newPassword });
    },
};
export const twoFactorApi = {
    async getSetupInfo() {
        const response = await api.get('/api/auth/2fa/setup');
        return response.data;
    },
    async generateSecret() {
        const response = await api.post('/api/auth/2fa/generate');
        return response.data;
    },
    async enableTwoFactor(code) {
        const response = await api.post('/api/auth/2fa/enable', {
            code,
        });
        return response.data;
    },
    async disableTwoFactor(password) {
        const response = await api.post('/api/auth/2fa/disable', { password });
        return response.data;
    },
    async regenerateBackupCodes(password) {
        const response = await api.post('/api/auth/2fa/backup-codes/regenerate', { password });
        return response.data;
    },
};
// -------------------------------------------------- Settings --------------------------------------------------
export const settingsApi = {
    async get() {
        const response = await api.get('/api/settings');
        return response.data;
    },
    async update(payload) {
        const response = await api.patch('/api/settings', payload);
        return response.data;
    },
};
// -------------------------------------------------- Admin --------------------------------------------------
export const adminApi = {
    async listUsers() {
        const response = await api.get('/api/admin/users');
        return response.data;
    },
    async updateUser(id, payload) {
        const response = await api.patch(`/api/admin/users/${id}`, payload);
        return response.data;
    },
    async deleteUser(id) {
        await api.delete(`/api/admin/users/${id}`);
    },
    async getSettings() {
        const response = await api.get('/api/admin/settings');
        return response.data;
    },
    async updateSettings(payload) {
        const response = await api.patch('/api/admin/settings', payload);
        return response.data;
    },
};
// -------------------------------------------------- API Keys --------------------------------------------------
export const apiKeysApi = {
    async list() {
        const response = await api.get('/api/keys');
        return response.data;
    },
    async create(name) {
        const response = await api.post('/api/keys', { name });
        return response.data;
    },
    async delete(id) {
        await api.delete(`/api/keys/${id}`);
    },
};
// -------------------------------------------------- Avatar --------------------------------------------------
export const avatarApi = {
    async upload(file) {
        const form = new FormData();
        form.append('avatar', file);
        const response = await api.post('/api/users/avatar', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    async remove() {
        await api.delete('/api/users/avatar');
    },
};
