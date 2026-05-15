// node_modules
import { defineStore } from 'pinia';
import { ref } from 'vue';

// classes
import { appWs, authApi, getStoredToken, setStoredToken } from '@/classes/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStoredToken());
  const username = ref<string | null>(null);
  const userId = ref<string | null>(null);
  const bIsAdmin = ref(false);
  const bValidated = ref(false);
  const avatarUrl = ref<string | null>(null);

  const login = async (user: string, password: string): Promise<void> => {
    const response = await authApi.login(user, password);
    token.value = response.token;
    setStoredToken(response.token);
    username.value = user;
    await validate();
  };

  const register = async (user: string, password: string): Promise<void> => {
    const response = await authApi.register(user, password);
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
    setStoredToken(null);
    appWs.disconnect();
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
    bValidated.value = true;
    appWs.connect();
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
    login,
    register,
    logout,
    validate,
    changePassword,
  };
});
