// node_modules
import { defineStore } from 'pinia';
import { ref } from 'vue';
// classes
import { authApi, getStoredToken, setStoredToken } from '@/classes/api';
export const useAuthStore = defineStore('auth', () => {
    const token = ref(getStoredToken());
    const username = ref(null);
    const userId = ref(null);
    const bIsAdmin = ref(false);
    const bValidated = ref(false);
    const avatarUrl = ref(null);
    const bTwoFactorEnabled = ref(false);
    const pendingTwoFactorUserId = ref(null);
    const login = async (user, password) => {
        const response = await authApi.login(user, password);
        token.value = response.token;
        setStoredToken(response.token);
        username.value = user;
        if (response.requiresTwoFactor && response.userId) {
            pendingTwoFactorUserId.value = response.userId;
            return false; // 2FA required
        }
        await validate();
        return true;
    };
    const loginWithEmail = async (email, password) => {
        const response = await authApi.loginWithEmail(email, password);
        token.value = response.token;
        setStoredToken(response.token);
        if (response.requiresTwoFactor && response.userId) {
            pendingTwoFactorUserId.value = response.userId;
            return false; // 2FA required
        }
        await validate();
        return true;
    };
    const verifyTwoFactor = async (code) => {
        if (!pendingTwoFactorUserId.value) {
            return false;
        }
        try {
            const response = await authApi.verifyTwoFactor(pendingTwoFactorUserId.value, code);
            token.value = response.token;
            setStoredToken(response.token);
            pendingTwoFactorUserId.value = null;
            await validate();
            return true;
        }
        catch {
            return false;
        }
    };
    const register = async (user, email, password) => {
        const response = await authApi.register(user, email, password);
        token.value = response.token;
        setStoredToken(response.token);
        username.value = user;
        await validate();
    };
    const logout = () => {
        token.value = null;
        username.value = null;
        userId.value = null;
        bIsAdmin.value = false;
        bValidated.value = false;
        avatarUrl.value = null;
        bTwoFactorEnabled.value = false;
        pendingTwoFactorUserId.value = null;
        setStoredToken(null);
    };
    const validate = async () => {
        if (!token.value) {
            bValidated.value = false;
            return false;
        }
        const response = await authApi.validate();
        if (!response.valid || !response.username) {
            logout();
            return false;
        }
        username.value = response.username;
        userId.value = response.userId ?? null;
        bIsAdmin.value = response.isAdmin;
        avatarUrl.value = response.avatarUrl ?? null;
        bTwoFactorEnabled.value = response.twoFactorEnabled ?? false;
        if (response.requiresTwoFactor) {
            bValidated.value = false;
            return false;
        }
        bValidated.value = true;
        return true;
    };
    const changePassword = async (currentPassword, newPassword) => {
        await authApi.changePassword(currentPassword, newPassword);
    };
    return {
        token,
        username,
        userId,
        bIsAdmin,
        bValidated,
        avatarUrl,
        bTwoFactorEnabled,
        pendingTwoFactorUserId,
        login,
        loginWithEmail,
        verifyTwoFactor,
        register,
        logout,
        validate,
        changePassword,
    };
});
