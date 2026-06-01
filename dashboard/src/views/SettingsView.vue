<script setup lang="ts">
// node_modules
import dayjs from 'dayjs';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Copy, Eye, EyeOff, RefreshCw, ShieldCheck, ShieldX } from 'lucide-vue-next';

// classes
import { apiKeysApi, avatarApi, twoFactorApi } from '@/classes/api';
import type { TwoFactorSetupInfo, TwoFactorGenerateResponse } from '@/classes/api';

// types
import type { ApiKey, ApiKeyWithPlainKey } from '@/@types/index';

// lib
import {
  applyUserThemePreferences,
  deriveAppearanceChoice,
  settingsPatchForAppearance,
  type AppearanceChoice,
} from '@/lib/themes';
import { setLocale, type LocaleCode } from '@/lib/i18n';

// components
import PageHeader from '@/components/layout/PageHeader.vue';
import PageShell from '@/components/layout/PageShell.vue';

// stores
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';

// -------------------------------------------------- Data --------------------------------------------------
const { t, locale } = useI18n();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const tab = ref<'general' | 'security' | 'apiKeys'>('general');
const appearance = ref<AppearanceChoice>('auto');
const language = ref<LocaleCode>('en');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const bSaving = ref(false);
const message = ref('');

// Avatar
const bAvatarSaving = ref(false);
const avatarMessage = ref('');
const avatarError = ref('');
const avatarFileInput = ref<HTMLInputElement | null>(null);

// API Keys
const bApiKeysLoading = ref(false);
const bApiKeyGenerating = ref(false);
const apiKeysMessage = ref('');
const apiKeysError = ref('');
const apiKeysList = ref<ApiKey[]>([]);
const newKeyName = ref('');
const newKeyValue = ref<ApiKeyWithPlainKey | null>(null);

// 2FA
const bTwoFactorLoading = ref(false);
const twoFactorErrorMessage = ref('');
const twoFactorSuccessMessage = ref('');
const bShowBackupCodes = ref(false);
const bShowNewBackupCodes = ref(false);
const bShowRegenerateForm = ref(false);
const twoFactorPassword = ref('');
const regeneratePassword = ref('');

const setupInfo = ref<TwoFactorSetupInfo>({
  enabled: false,
  qrCodeUrl: null,
  secret: null,
  backupCodes: null,
});

const newSetupInfo = ref<TwoFactorGenerateResponse | null>(null);
const verificationCode = ref('');
const bVerifying = ref(false);

const apiBaseUrl = computed(() => {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? '';
  if (!configured) {
    return window.location.origin;
  }
  return configured.startsWith('http') ? configured : `${window.location.origin}${configured}`;
});

// -------------------------------------------------- Lifecycle --------------------------------------------------
onMounted(async () => {
  const settings = await settingsStore.load({ force: true });
  appearance.value = deriveAppearanceChoice({
    autoTheme: settings.autoTheme,
    darkTheme: settings.darkTheme,
    lightTheme: settings.lightTheme,
  });
  language.value = settings.language === 'de' ? 'de' : 'en';
  locale.value = language.value;
  dayjs.locale(language.value);
  await fetchTwoFactorSetupInfo();
  applyUserThemePreferences({
    autoTheme: settings.autoTheme,
    darkTheme: settings.darkTheme,
    lightTheme: settings.lightTheme,
  });
});

// -------------------------------------------------- Methods --------------------------------------------------
const onAvatarFileChange = async (event: Event): Promise<void> => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  avatarMessage.value = '';
  avatarError.value = '';
  bAvatarSaving.value = true;
  try {
    const result = await avatarApi.upload(file);
    authStore.avatarUrl = result.avatarUrl + '?t=' + Date.now();
    avatarMessage.value = t('settings.avatarSaved');
  } catch {
    avatarError.value = t('common.error');
  } finally {
    bAvatarSaving.value = false;
    if (avatarFileInput.value) avatarFileInput.value.value = '';
  }
};

const removeAvatar = async (): Promise<void> => {
  avatarMessage.value = '';
  avatarError.value = '';
  bAvatarSaving.value = true;
  try {
    await avatarApi.remove();
    authStore.avatarUrl = null;
    avatarMessage.value = t('settings.avatarRemoved');
  } catch {
    avatarError.value = t('common.error');
  } finally {
    bAvatarSaving.value = false;
  }
};

const persistAppearance = async (choice: AppearanceChoice): Promise<void> => {
  appearance.value = choice;
  const patch = settingsPatchForAppearance(choice);
  await settingsStore.update(patch);
  applyUserThemePreferences(patch);
};

const onLanguageChange = async (code: LocaleCode): Promise<void> => {
  language.value = code;
  setLocale(code);
  locale.value = code;
  dayjs.locale(code);
  await settingsStore.update({ language: code });
};

const changePassword = async (): Promise<void> => {
  message.value = '';
  if (newPassword.value !== confirmPassword.value) {
    message.value = t('settings.passwordMismatch');
    return;
  }
  bSaving.value = true;
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value);
    message.value = t('settings.passwordSuccess');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch {
    message.value = t('common.error');
  } finally {
    bSaving.value = false;
  }
};

// -------------------------------------------------- 2FA --------------------------------------------------

const fetchTwoFactorSetupInfo = async (): Promise<void> => {
  try {
    bTwoFactorLoading.value = true;
    twoFactorErrorMessage.value = '';
    setupInfo.value = await twoFactorApi.getSetupInfo();
  } catch {
    twoFactorErrorMessage.value = t('common.error');
  } finally {
    bTwoFactorLoading.value = false;
  }
};

const startTwoFactorSetup = async (): Promise<void> => {
  try {
    bTwoFactorLoading.value = true;
    twoFactorErrorMessage.value = '';
    twoFactorSuccessMessage.value = '';
    newSetupInfo.value = await twoFactorApi.generateSecret();
  } catch {
    twoFactorErrorMessage.value = t('common.error');
  } finally {
    bTwoFactorLoading.value = false;
  }
};

const enableTwoFactor = async (): Promise<void> => {
  try {
    bVerifying.value = true;
    twoFactorErrorMessage.value = '';

    if (!newSetupInfo.value) {
      twoFactorErrorMessage.value = t('common.error');
      return;
    }

    await twoFactorApi.enableTwoFactor(verificationCode.value);
    twoFactorSuccessMessage.value = t('auth.twoFactorEnabled');
    verificationCode.value = '';
    newSetupInfo.value = null;
    authStore.bTwoFactorEnabled = true;
    await fetchTwoFactorSetupInfo();
  } catch (error: unknown) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    twoFactorErrorMessage.value = response?.data?.error || t('common.error');
  } finally {
    bVerifying.value = false;
  }
};

const disableTwoFactor = async (): Promise<void> => {
  try {
    bTwoFactorLoading.value = true;
    twoFactorErrorMessage.value = '';
    twoFactorSuccessMessage.value = '';

    if (!twoFactorPassword.value) {
      twoFactorErrorMessage.value = t('settings.currentPassword');
      return;
    }

    await twoFactorApi.disableTwoFactor(twoFactorPassword.value);
    twoFactorPassword.value = '';
    twoFactorSuccessMessage.value = t('auth.twoFactorDisabled');
    authStore.bTwoFactorEnabled = false;
    await fetchTwoFactorSetupInfo();
  } catch (error: unknown) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    twoFactorErrorMessage.value = response?.data?.error || t('common.error');
  } finally {
    bTwoFactorLoading.value = false;
  }
};

const regenerateBackupCodes = async (): Promise<void> => {
  try {
    bTwoFactorLoading.value = true;
    twoFactorErrorMessage.value = '';
    twoFactorSuccessMessage.value = '';

    if (!regeneratePassword.value) {
      twoFactorErrorMessage.value = t('settings.currentPassword');
      return;
    }

    const response = await twoFactorApi.regenerateBackupCodes(regeneratePassword.value);
    regeneratePassword.value = '';
    bShowRegenerateForm.value = false;
    bShowNewBackupCodes.value = true;
    if (setupInfo.value) {
      setupInfo.value.backupCodes = response.backupCodes;
    }
    twoFactorSuccessMessage.value = t('common.success');
  } catch (error: unknown) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    twoFactorErrorMessage.value = response?.data?.error || t('common.error');
  } finally {
    bTwoFactorLoading.value = false;
  }
};

const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    twoFactorSuccessMessage.value = t('common.copied');
    setTimeout(() => {
      twoFactorSuccessMessage.value = '';
    }, 2000);
  } catch {
    twoFactorErrorMessage.value = t('common.error');
  }
};

const copyAllBackupCodes = async (): Promise<void> => {
  if (setupInfo.value.backupCodes) {
    await copyToClipboard(setupInfo.value.backupCodes.join('\n'));
  }
};

const toggleBackupCodes = (): void => {
  bShowBackupCodes.value = !bShowBackupCodes.value;
};

// -------------------------------------------------- API Keys --------------------------------------------------

const apiErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as {
      response?: { status?: number; data?: { error?: string; message?: string } };
      message?: string;
    };
    if (e.response) {
      const status = e.response.status ?? '?';
      const body = e.response.data?.error ?? e.response.data?.message;
      return body ? `${status}: ${body}` : `HTTP ${status}`;
    }
    if (e.message) {
      return e.message;
    }
  }
  return t('common.error');
};

const loadApiKeys = async (): Promise<void> => {
  bApiKeysLoading.value = true;
  try {
    apiKeysList.value = await apiKeysApi.list();
  } catch (error) {
    apiKeysError.value = apiErrorMessage(error);
  } finally {
    bApiKeysLoading.value = false;
  }
};

const generateApiKey = async (): Promise<void> => {
  if (!newKeyName.value.trim()) {
    return;
  }
  apiKeysMessage.value = '';
  apiKeysError.value = '';
  bApiKeyGenerating.value = true;
  try {
    const created = await apiKeysApi.create(newKeyName.value.trim());
    newKeyValue.value = created;
    newKeyName.value = '';
    apiKeysMessage.value = t('apiKeys.keyGenerated');
    await loadApiKeys();
  } catch (error) {
    apiKeysError.value = apiErrorMessage(error);
  } finally {
    bApiKeyGenerating.value = false;
  }
};

const revokeApiKey = async (key: ApiKey): Promise<void> => {
  if (!confirm(t('apiKeys.confirmDeleteKey', { name: key.name }))) {
    return;
  }
  apiKeysMessage.value = '';
  apiKeysError.value = '';
  try {
    await apiKeysApi.delete(key.id);
    apiKeysList.value = apiKeysList.value.filter((item) => item.id !== key.id);
    if (newKeyValue.value?.id === key.id) {
      newKeyValue.value = null;
    }
    apiKeysMessage.value = t('apiKeys.keyDeleted');
  } catch (error) {
    apiKeysError.value = apiErrorMessage(error);
  }
};

const copyValue = async (value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
    apiKeysMessage.value = t('apiKeys.copied');
  } catch {
    apiKeysError.value = t('common.error');
  }
};

watch(tab, (newTab) => {
  if (newTab === 'apiKeys') {
    apiKeysMessage.value = '';
    apiKeysError.value = '';
    loadApiKeys();
  }
});
</script>

<template>
  <PageShell narrow>
    <PageHeader :title="t('settings.title')" />
    <nav class="tab-navigation mb-6 overflow-x-auto whitespace-nowrap">
      <button type="button" :class="{ 'is-active': tab === 'general' }" @click="tab = 'general'">
        {{ t('settings.general') }}
      </button>
      <button type="button" :class="{ 'is-active': tab === 'security' }" @click="tab = 'security'">
        {{ t('settings.security') }}
      </button>
      <button type="button" :class="{ 'is-active': tab === 'apiKeys' }" @click="tab = 'apiKeys'">
        {{ t('apiKeys.tabLabel') }}
      </button>
    </nav>

    <!-- General Settings -->
    <div v-if="tab === 'general'" class="rounded-lg border border-border bg-surface p-4 space-y-6">
      <!-- Profile picture -->
      <div class="field">
        <label class="label">{{ t('settings.profilePicture') }}</label>
        <div class="flex items-center gap-4">
          <div
            class="h-16 w-16 flex-shrink-0 rounded-full border-2 border-border bg-bg flex items-center justify-center"
          >
            <span v-if="!authStore.avatarUrl" class="text-2xl text-text-muted">
              {{ authStore.username?.charAt(0).toUpperCase() }}
            </span>
            <img
              v-else
              :src="authStore.avatarUrl"
              alt="Avatar"
              class="h-full w-full rounded-full object-cover"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="button is-primary"
                :disabled="bAvatarSaving"
                @click="avatarFileInput?.click()"
              >
                {{ authStore.avatarUrl ? t('settings.avatarChange') : t('settings.avatarUpload') }}
              </button>
              <button
                v-if="authStore.avatarUrl"
                type="button"
                class="button is-transparent text-destructive hover:bg-destructive/10"
                :disabled="bAvatarSaving"
                @click="removeAvatar"
              >
                {{ t('settings.avatarRemove') }}
              </button>
            </div>
            <p class="text-xs text-text-muted">{{ t('settings.avatarHint') }}</p>
          </div>
        </div>
        <input
          ref="avatarFileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="hidden"
          @change="onAvatarFileChange"
        />
        <p v-if="avatarMessage" class="message is-success mt-2">{{ avatarMessage }}</p>
        <p v-if="avatarError" class="message is-error mt-2">{{ avatarError }}</p>
      </div>

      <!-- Theme -->
      <div class="field">
        <label class="label">{{ t('settings.theme') }}</label>
        <div
          class="inline-flex self-start w-max max-w-full flex-wrap items-stretch gap-0.5 rounded-md border-0 bg-bg p-0.5"
        >
          <button
            type="button"
            class="button !h-9 !max-h-9 !min-h-9 shrink-0 border-0 px-4 py-0 text-sm"
            :class="appearance === 'auto' ? 'is-primary' : 'is-transparent'"
            @click="persistAppearance('auto')"
          >
            {{ t('settings.themeAuto') }}
          </button>
          <button
            type="button"
            class="button !h-9 !max-h-9 !min-h-9 shrink-0 border-0 px-4 py-0 text-sm"
            :class="appearance === 'light' ? 'is-primary' : 'is-transparent'"
            @click="persistAppearance('light')"
          >
            {{ t('settings.themeLight') }}
          </button>
          <button
            type="button"
            class="button !h-9 !max-h-9 !min-h-9 shrink-0 border-0 px-4 py-0 text-sm"
            :class="appearance === 'dark' ? 'is-primary' : 'is-transparent'"
            @click="persistAppearance('dark')"
          >
            {{ t('settings.themeDark') }}
          </button>
        </div>
      </div>

      <!-- Language -->
      <div class="field">
        <label class="label">{{ t('settings.displayLanguage') }}</label>
        <div
          class="inline-flex self-start w-max max-w-full flex-wrap items-stretch gap-0.5 rounded-md border-0 bg-bg p-0.5"
        >
          <button
            type="button"
            class="button !h-9 !max-h-9 !min-h-9 shrink-0 border-0 px-4 py-0 text-sm"
            :class="language === 'en' ? 'is-primary' : 'is-transparent'"
            @click="onLanguageChange('en')"
          >
            {{ t('settings.languageEn') }}
          </button>
          <button
            type="button"
            class="button !h-9 !max-h-9 !min-h-9 shrink-0 border-0 px-4 py-0 text-sm"
            :class="language === 'de' ? 'is-primary' : 'is-transparent'"
            @click="onLanguageChange('de')"
          >
            {{ t('settings.languageDe') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Security Settings -->
    <div v-else-if="tab === 'security'" class="space-y-4">
      <!-- Two-Factor Authentication -->
      <div class="rounded-lg border border-border bg-surface p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-semibold">{{ t('auth.twoFactor') }}</h3>
            <p class="text-sm text-text-muted">
              {{ setupInfo.enabled ? t('auth.twoFactorEnabled') : t('auth.twoFactorDisabled') }}
            </p>
          </div>
          <span v-if="setupInfo.enabled" class="badge is-success">{{ t('common.enabled') }}</span>
          <span v-else class="badge is-muted">{{ t('common.disabled') }}</span>
        </div>

        <div v-if="twoFactorErrorMessage" class="message is-error mb-4">
          {{ twoFactorErrorMessage }}
        </div>
        <div v-if="twoFactorSuccessMessage" class="message is-success mb-4">
          {{ twoFactorSuccessMessage }}
        </div>

        <!-- Enable 2FA -->
        <div v-if="!setupInfo.enabled" class="space-y-4">
          <template v-if="!newSetupInfo">
            <button
              class="button is-primary"
              :disabled="bTwoFactorLoading"
              @click="startTwoFactorSetup"
            >
              <ShieldCheck :size="16" />
              {{ t('auth.enableTwoFactor') }}
            </button>
          </template>

          <template v-if="newSetupInfo">
            <div class="text-center">
              <p class="text-sm text-text-muted mb-2">{{ t('auth.scanQRCode') }}</p>
              <img
                :src="newSetupInfo.qrCodeUrl"
                alt="QR Code for 2FA setup"
                class="mx-auto rounded-lg border border-border p-2 bg-bg"
                style="width: 200px; height: 200px"
              />
              <p class="text-xs text-text-muted mt-2">
                {{ t('auth.twoFactor') }}: {{ newSetupInfo.secret }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="label">{{ t('auth.twoFactorCode') }}</label>
              <div class="flex gap-2">
                <div class="input-wrap flex-1">
                  <input
                    v-model="verificationCode"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="6"
                    :placeholder="t('auth.enterCode')"
                    required
                  />
                </div>
                <button
                  class="button is-primary"
                  :disabled="bVerifying || verificationCode.length !== 6"
                  @click="enableTwoFactor"
                >
                  {{ t('auth.verify') }}
                </button>
              </div>
            </div>

            <button class="button is-transparent w-full" @click="newSetupInfo = null">
              {{ t('common.cancel') }}
            </button>
          </template>
        </div>

        <!-- Disable 2FA -->
        <div v-if="setupInfo.enabled" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium mb-1">{{ t('auth.disableTwoFactor') }}</p>
              <p class="text-xs text-text-muted">{{ t('auth.confirmDisableTwoFactor') }}</p>
            </div>
          </div>
          <div class="flex gap-2 items-end">
            <div class="input-wrap flex-1">
              <input
                v-model="twoFactorPassword"
                type="password"
                autocomplete="current-password"
                :placeholder="t('settings.currentPassword')"
                required
              />
            </div>
            <button
              class="button is-danger shrink-0"
              :disabled="bTwoFactorLoading || !twoFactorPassword"
              @click="disableTwoFactor"
            >
              <ShieldX :size="16" />
              {{ t('auth.disableTwoFactor') }}
            </button>
          </div>
        </div>

        <!-- Backup Codes -->
        <div v-if="setupInfo.enabled" class="mt-4 pt-4 border-t border-border">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-sm font-semibold">{{ t('auth.backupCodes') }}</h4>
              <p class="text-xs text-text-muted">{{ t('auth.backupCodesDesc') }}</p>
            </div>
            <button
              class="button is-transparent !p-2"
              :disabled="bTwoFactorLoading"
              @click="bShowRegenerateForm = !bShowRegenerateForm"
            >
              <RefreshCw :size="16" />
            </button>
          </div>

          <!-- Regenerate form -->
          <div
            v-if="bShowRegenerateForm"
            class="space-y-3 mb-4 p-3 rounded-lg bg-bg border border-border"
          >
            <div class="field">
              <label class="label">{{ t('settings.currentPassword') }}</label>
              <div class="input-wrap">
                <input
                  v-model="regeneratePassword"
                  type="password"
                  autocomplete="current-password"
                  :placeholder="t('settings.currentPassword')"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <button
                class="button is-transparent flex-1"
                @click="
                  bShowRegenerateForm = false;
                  regeneratePassword = '';
                "
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="button is-primary flex-1"
                :disabled="bTwoFactorLoading || !regeneratePassword"
                @click="regenerateBackupCodes"
              >
                <RefreshCw :size="16" />
                {{ t('auth.backupCodes') }}
              </button>
            </div>
          </div>

          <template v-if="bShowNewBackupCodes && setupInfo.backupCodes">
            <div class="message is-info mb-4">
              <div class="mt-2 space-y-2">
                <div
                  v-for="(code, index) in setupInfo.backupCodes"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <span class="font-mono text-sm">{{ code }}</span>
                  <button class="button is-transparent !p-1" @click="copyToClipboard(code)">
                    <Copy :size="14" />
                  </button>
                </div>
              </div>
              <button class="button is-transparent mt-3" @click="bShowNewBackupCodes = false">
                {{ t('common.cancel') }}
              </button>
            </div>
          </template>

          <template
            v-if="setupInfo.backupCodes && setupInfo.backupCodes.length > 0 && !bShowNewBackupCodes"
          >
            <div class="flex items-center gap-2 mb-2">
              <button class="button is-transparent" @click="toggleBackupCodes">
                <template v-if="bShowBackupCodes">
                  <EyeOff :size="16" />
                  {{ t('common.cancel') }}
                </template>
                <template v-else>
                  <Eye :size="16" />
                  {{ t('auth.backupCodes') }} ({{ setupInfo.backupCodes.length }})
                </template>
              </button>
              <button class="button is-transparent" @click="copyAllBackupCodes">
                <Copy :size="16" />
                {{ t('common.copy') }}
              </button>
            </div>

            <div v-if="bShowBackupCodes" class="space-y-2">
              <div
                v-for="(code, index) in setupInfo.backupCodes"
                :key="index"
                class="flex items-center gap-2"
              >
                <span class="font-mono text-sm">{{ code }}</span>
                <button class="button is-transparent !p-1" @click="copyToClipboard(code)">
                  <Copy :size="14" />
                </button>
              </div>
            </div>
          </template>

          <template v-if="setupInfo.backupCodes && setupInfo.backupCodes.length === 0">
            <div class="message is-warning">
              <p class="text-sm">{{ t('auth.generateBackupCodes') }}</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Change Password -->
      <div class="rounded-lg border border-border bg-surface p-4">
        <div class="field">
          <label class="label">{{ t('settings.currentPassword') }}</label>
          <input
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            class="border border-border"
          />
        </div>
        <div class="field">
          <label class="label">{{ t('settings.newPassword') }}</label>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            class="border border-border"
          />
        </div>
        <div class="field">
          <label class="label">{{ t('settings.confirmPassword') }}</label>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="border border-border"
          />
        </div>
        <p
          v-if="message"
          class="message mt-3"
          :class="message.includes('success') ? 'is-success' : 'is-error'"
        >
          {{ message }}
        </p>
        <button
          type="button"
          class="button is-primary mt-3"
          :disabled="bSaving"
          @click="changePassword"
        >
          {{ t('settings.savePassword') }}
        </button>
      </div>
    </div>

    <!-- API Keys Settings -->
    <div v-else-if="tab === 'apiKeys'" class="space-y-6">
      <p class="text-sm text-text-muted">{{ t('apiKeys.desc') }}</p>

      <p v-if="apiKeysMessage" class="message is-success">{{ apiKeysMessage }}</p>
      <p v-if="apiKeysError" class="message is-error">{{ apiKeysError }}</p>

      <!-- API base URL + docs links -->
      <div class="rounded-lg border border-border bg-surface px-4 py-3 space-y-3">
        <div>
          <p class="mb-1 text-xs font-medium text-text-primary">{{ t('apiKeys.endpointLabel') }}</p>
          <p class="mb-2 text-xs text-text-muted">{{ t('apiKeys.endpointDesc') }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <input :value="apiBaseUrl" type="text" readonly class="min-w-0 flex-1 text-xs" />
            <button type="button" class="button is-transparent" @click="copyValue(apiBaseUrl)">
              {{ t('settings.calendarCopy') }}
            </button>
          </div>
        </div>
        <div>
          <p class="mb-1 text-xs font-medium text-text-primary">{{ t('apiKeys.docsLabel') }}</p>
          <p class="text-xs text-text-muted">{{ t('apiKeys.docsDesc') }}</p>
          <a
            :href="`${apiBaseUrl}/api/docs`"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-block text-xs text-primary hover:underline"
          >
            {{ apiBaseUrl }}/api/docs ↗
          </a>
        </div>
      </div>

      <!-- Generated key banner (shown once) -->
      <div v-if="newKeyValue" class="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
        <p class="mb-2 text-xs font-medium text-text-primary">{{ t('apiKeys.keyGenerated') }}</p>
        <div class="flex flex-wrap items-center gap-2">
          <input
            :value="newKeyValue.key"
            type="text"
            readonly
            class="min-w-0 flex-1 font-mono text-xs"
          />
          <button type="button" class="button is-primary" @click="copyValue(newKeyValue!.key)">
            {{ t('apiKeys.copy') }}
          </button>
        </div>
      </div>

      <!-- Generate key form -->
      <div class="rounded-lg border border-border bg-surface px-4 py-3">
        <h3 class="mb-3 text-sm font-semibold text-text-primary">{{ t('apiKeys.keysTitle') }}</h3>
        <p class="mb-3 text-xs text-text-muted">{{ t('apiKeys.keysDesc') }}</p>
        <div class="flex flex-wrap items-end gap-3">
          <div class="field mb-0 min-w-0 flex-1">
            <label class="label">{{ t('apiKeys.keyName') }}</label>
            <input
              v-model="newKeyName"
              type="text"
              :placeholder="t('apiKeys.keyNamePlaceholder')"
              @keydown.enter="generateApiKey"
            />
          </div>
          <button
            type="button"
            class="button is-primary shrink-0"
            :disabled="bApiKeyGenerating || !newKeyName.trim()"
            @click="generateApiKey"
          >
            {{ t('apiKeys.generateKey') }}
          </button>
        </div>
      </div>

      <!-- Keys list -->
      <div class="space-y-2">
        <p v-if="bApiKeysLoading" class="text-sm text-text-muted">{{ t('common.loading') }}</p>
        <p v-else-if="apiKeysList.length === 0" class="text-sm text-text-muted">
          {{ t('apiKeys.noKeys') }}
        </p>
        <article
          v-for="key in apiKeysList"
          :key="key.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-text-primary">{{ key.name }}</p>
            <p class="text-xs text-text-muted">
              {{ t('apiKeys.keyPrefix') }}: <span class="font-mono">{{ key.keyPrefix }}…</span>
              &nbsp;·&nbsp;
              {{ t('apiKeys.keyCreated') }}: {{ dayjs(key.createdAt).format('YYYY-MM-DD') }}
              &nbsp;·&nbsp;
              {{
                key.lastUsedAt
                  ? t('apiKeys.keyLastUsed') + ': ' + dayjs(key.lastUsedAt).format('YYYY-MM-DD')
                  : t('apiKeys.keyNeverUsed')
              }}
            </p>
          </div>
          <button
            type="button"
            class="button is-transparent text-destructive hover:bg-destructive/10"
            @click="revokeApiKey(key)"
          >
            {{ t('common.delete') }}
          </button>
        </article>
      </div>
    </div>
  </PageShell>
</template>
