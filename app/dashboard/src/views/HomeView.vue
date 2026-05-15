<script setup lang="ts">
// node_modules
import { useI18n } from 'vue-i18n';

// components
import PageHeader from '@/components/layout/PageHeader.vue';
import PageShell from '@/components/layout/PageShell.vue';

// stores
import { useAuthStore } from '@/stores/auth';

// -------------------------------------------------- Data --------------------------------------------------
const { t } = useI18n();
const authStore = useAuthStore();
</script>

<template>
  <PageShell>
    <PageHeader :title="t('home.title')" />
    <div class="rounded-lg border border-border bg-surface p-6">
      <h2 class="mb-2 text-xl font-semibold text-text-primary">{{ t('home.subtitle') }}</h2>
      <p class="text-text-muted">{{ t('home.description') }}</p>
      <div v-if="authStore.username" class="mt-4 p-4 rounded-lg bg-bg">
        <p class="text-sm text-text-muted">
          Logged in as: <span class="font-medium text-text-primary">{{ authStore.username }}</span>
        </p>
      </div>
    </div>
  </PageShell>
</template>
