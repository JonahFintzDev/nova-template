<script setup lang="ts">
// node_modules
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { Home, Settings, UserCog, LogOut, X, Menu } from 'lucide-vue-next';

// stores
import { useAuthStore } from '@/stores/auth';

// -------------------------------------------------- Data --------------------------------------------------
const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const bDrawerOpen = ref(false);

// -------------------------------------------------- Computed --------------------------------------------------
const navItems = computed(() => [
  { to: '/', icon: Home, label: t('nav.home') },
  { to: '/settings', icon: Settings, label: t('nav.settings') },
  ...(authStore.bIsAdmin ? [{ to: '/admin', icon: UserCog, label: t('nav.admin') }] : []),
]);

// -------------------------------------------------- Methods --------------------------------------------------
const openDrawer = (): void => {
  bDrawerOpen.value = true;
};

const closeDrawer = (): void => {
  bDrawerOpen.value = false;
};

const logout = async (): Promise<void> => {
  authStore.logout();
  await router.push({ name: 'login' });
  closeDrawer();
};

// Expose methods for parent
defineExpose({ openDrawer });
</script>

<template>
  <!-- Mobile drawer button -->
  <button
    type="button"
    class="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg border border-border bg-surface text-text-primary hover:bg-bg"
    @click="openDrawer"
  >
    <Menu :size="20" />
  </button>

  <!-- Sidebar overlay (mobile) -->
  <div v-if="bDrawerOpen" class="lg:hidden fixed inset-0 z-40 bg-black/50" @click="closeDrawer" />

  <!-- Sidebar -->
  <aside
    class="fixed top-0 left-0 z-50 h-full w-64 transform bg-surface border-r border-border lg:translate-x-0 lg:static lg:z-auto transition-transform duration-200 ease-in-out"
    :class="bDrawerOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border p-4">
        <div class="flex items-center gap-3">
          <img src="/icon.svg" alt="Nova Template" class="h-8 w-8" />
          <span class="font-semibold text-text-primary">Nova Template</span>
        </div>
        <button type="button" class="lg:hidden p-1 rounded-md hover:bg-bg" @click="closeDrawer">
          <X :size="20" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-3">
        <ul class="space-y-1">
          <li v-for="item in navItems" :key="item.to">
            <router-link
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary hover:bg-bg transition-colors"
              active-class="bg-primary/10 text-primary font-medium"
              @click="closeDrawer"
            >
              <component :is="item.icon" :size="18" />
              <span>{{ item.label }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Footer -->
      <div class="border-t border-border p-3">
        <button
          type="button"
          class="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:bg-bg hover:text-text-primary transition-colors"
          @click="logout"
        >
          <LogOut :size="18" />
          <span>{{ t('nav.logout') }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>
