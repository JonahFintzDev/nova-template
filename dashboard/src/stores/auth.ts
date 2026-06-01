// node_modules
import { defineStore } from 'pinia';
import { ref } from 'vue';

// classes
import { authApi, getStoredToken, setStoredToken } from '@/classes/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStoredToken());
  const username = ref<string | null>(null);
  const userId = ref<string | null>(null);
  const bIsAdmin = ref(false);
  const bValidated = ref(false);
  const avatarUrl = ref<string | null>(null);
  const bTwoFactorEnabled = ref(false);
  const pendingTwoFactorUserId = ref<string | null>(null);

  const login = async (user: string, password: string): Promise<boolean> => {
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

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
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

  const verifyTwoFactor = async (code: string): Promise<boolean> => {
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
    } catch {
      return false;
    }
  };

  const register = async (user: string, email: string, password: string): Promise<void> => {
    const response = await authApi.register(user, email, password);
    token.value = response.token;
    setStoredToken(response.token);
    username.value = user;
    await validate();
  };

  const logout = (): void => {
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

  const validate = async (): Promise<boolean> => {
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

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
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
