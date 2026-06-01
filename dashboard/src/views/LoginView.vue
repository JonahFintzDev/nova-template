<script setup lang="ts">
// node_modules
import { nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { Lock, LogIn, User, UserPlus, ShieldCheck } from 'lucide-vue-next';

// classes
import { healthApi } from '@/classes/api';

// lib
import { fadeInElement } from '@/lib/gsap';

// stores
import { useAuthStore } from '@/stores/auth';

// -------------------------------------------------- Store --------------------------------------------------
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// -------------------------------------------------- Data --------------------------------------------------
const usernameOrEmail = ref('');
const password = ref('');
const twoFactorCode = ref('');
const bRegisterMode = ref(false);
const bLoading = ref(false);
const bTwoFactorMode = ref(false);
const errorMessage = ref('');
const bRegistrationEnabled = ref(true);
const cardRef = ref<HTMLElement | null>(null);

// -------------------------------------------------- Watchers --------------------------------------------------
watch(bRegistrationEnabled, (enabled) => {
  if (!enabled) {
    bRegisterMode.value = false;
  }
});

// -------------------------------------------------- Lifecycle --------------------------------------------------
onMounted(async () => {
  const health = await healthApi.check();
  bRegistrationEnabled.value = health.registrationEnabled;
  if (route.query['register'] === '1' && bRegistrationEnabled.value) {
    bRegisterMode.value = true;
  }
  await nextTick();
  fadeInElement(cardRef.value);
});

// -------------------------------------------------- Methods --------------------------------------------------
const submit = async (): Promise<void> => {
  errorMessage.value = '';
  bLoading.value = true;

  try {
    let loginSuccess = false;

    if (bRegisterMode.value) {
      // For now, we need email for registration. We'll use username as email if it looks like one.
      const email = usernameOrEmail.value.includes('@')
        ? usernameOrEmail.value
        : `${usernameOrEmail.value}@example.com`;
      await authStore.register(usernameOrEmail.value, email, password.value);
      loginSuccess = true;
    } else {
      // Try to detect if it's an email
      if (usernameOrEmail.value.includes('@')) {
        loginSuccess = await authStore.loginWithEmail(usernameOrEmail.value, password.value);
      } else {
        loginSuccess = await authStore.login(usernameOrEmail.value, password.value);
      }
    }

    // Check if 2FA is required
    if (!loginSuccess && authStore.pendingTwoFactorUserId) {
      bTwoFactorMode.value = true;
      bLoading.value = false;
      return;
    }

    const redirect = typeof route.query['redirect'] === 'string' ? route.query['redirect'] : '/';
    await router.push(redirect);
  } catch (error: unknown) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    errorMessage.value =
      response?.data?.error === 'Registration disabled'
        ? t('auth.registrationDisabled')
        : response?.data?.error === 'Invalid username or password' ||
            response?.data?.error === 'Invalid email or password'
          ? t('auth.errorInvalid')
          : response?.data?.error || t('auth.errorInvalid');
  } finally {
    bLoading.value = false;
  }
};

const submitTwoFactor = async (): Promise<void> => {
  errorMessage.value = '';
  bLoading.value = true;

  try {
    const success = await authStore.verifyTwoFactor(twoFactorCode.value);
    if (success) {
      bTwoFactorMode.value = false;
      twoFactorCode.value = '';
      const redirect = typeof route.query['redirect'] === 'string' ? route.query['redirect'] : '/';
      await router.push(redirect);
    } else {
      errorMessage.value = t('auth.errorInvalidTwoFactor');
    }
  } catch {
    errorMessage.value = t('auth.errorInvalidTwoFactor');
  } finally {
    bLoading.value = false;
  }
};

const cancelTwoFactor = (): void => {
  bTwoFactorMode.value = false;
  twoFactorCode.value = '';
  errorMessage.value = '';
  authStore.pendingTwoFactorUserId = null;
};
</script>

<template>
  <div class="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-4">
    <!-- Gradient orb — top-right -->
    <div
      class="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full opacity-25"
      style="background: radial-gradient(circle, #4f46e5 0%, transparent 65%); filter: blur(48px)"
    />
    <!-- Gradient orb — bottom-left -->
    <div
      class="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-20"
      style="background: radial-gradient(circle, #7c3aed 0%, transparent 65%); filter: blur(60px)"
    />

    <div
      ref="cardRef"
      class="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-2xl"
    >
      <!-- Logo + brand -->
      <div class="mb-7 flex flex-col items-center gap-3">
        <img src="/icon.svg" alt="Nova Template logo" class="h-14 w-14 drop-shadow-sm" />
        <div class="text-center">
          <h1 class="text-2xl font-bold tracking-tight text-text-primary">Nova Template</h1>
          <p class="mt-0.5 text-sm text-text-muted">Base for Nova applications</p>
        </div>
      </div>

      <!-- Login / Register tab switcher -->
      <div v-if="bRegistrationEnabled && !bTwoFactorMode" class="mb-5 flex justify-center">
        <div
          class="inline-flex flex-wrap items-stretch gap-0.5 rounded-md border border-border p-0.5"
        >
          <button
            type="button"
            class="button !h-9 !max-h-9 !min-h-9 shrink-0 border-0 px-4 py-0 text-sm"
            :class="!bRegisterMode ? 'is-primary' : 'is-transparent'"
            @click="bRegisterMode = false"
          >
            {{ t('auth.login') }}
          </button>
          <button
            type="button"
            class="button !h-9 !max-h-9 !min-h-9 shrink-0 border-0 px-4 py-0 text-sm"
            :class="bRegisterMode ? 'is-primary' : 'is-transparent'"
            @click="bRegisterMode = true"
          >
            {{ t('auth.register') }}
          </button>
        </div>
      </div>

      <!-- 2FA Mode -->
      <div v-if="bTwoFactorMode" class="mb-5 text-center">
        <div
          class="inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 p-2 text-primary"
        >
          <ShieldCheck :size="16" />
          <span class="text-sm font-medium">{{ t('auth.twoFactorRequired') }}</span>
        </div>
        <p class="mt-2 text-sm text-text-muted">{{ t('auth.enterTwoFactorCode') }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="bTwoFactorMode ? submitTwoFactor() : submit()">
        <template v-if="!bTwoFactorMode">
          <div class="field">
            <label class="label">{{
              bRegisterMode ? t('auth.username') : t('auth.usernameOrEmail')
            }}</label>
            <div class="input-wrap">
              <span class="icon"><User :size="15" /></span>
              <input
                v-model="usernameOrEmail"
                type="text"
                autocomplete="username"
                required
                :placeholder="bRegisterMode ? t('auth.username') : t('auth.usernameOrEmail')"
              />
            </div>
          </div>
          <div class="field">
            <label class="label">{{ t('auth.password') }}</label>
            <div class="input-wrap">
              <span class="icon"><Lock :size="15" /></span>
              <input
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                :placeholder="t('auth.password')"
              />
            </div>
          </div>
        </template>

        <template v-if="bTwoFactorMode">
          <div class="field">
            <label class="label">{{ t('auth.twoFactorCode') }}</label>
            <div class="input-wrap">
              <span class="icon"><ShieldCheck :size="15" /></span>
              <input
                v-model="twoFactorCode"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                autocomplete="one-time-code"
                required
                :placeholder="t('auth.enterCode')"
              />
            </div>
          </div>
        </template>

        <p v-if="errorMessage" class="message is-error">{{ errorMessage }}</p>

        <div v-if="bTwoFactorMode" class="flex gap-2">
          <button type="button" class="button is-transparent flex-1" @click="cancelTwoFactor">
            {{ t('auth.cancel') }}
          </button>
          <button type="submit" class="button is-primary flex-1" :disabled="bLoading">
            <ShieldCheck :size="16" />
            {{ t('auth.verify') }}
          </button>
        </div>

        <button
          v-if="!bTwoFactorMode"
          type="submit"
          class="button is-primary w-full"
          :disabled="bLoading"
        >
          <LogIn v-if="!bRegisterMode" :size="16" />
          <UserPlus v-else :size="16" />
          {{ bRegisterMode ? t('auth.submitRegister') : t('auth.submitLogin') }}
        </button>
      </form>
    </div>
  </div>
</template>
