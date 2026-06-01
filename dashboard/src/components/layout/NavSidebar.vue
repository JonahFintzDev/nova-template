<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { Home, Layers, Settings, UserCog, X } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const { t } = useI18n();

const bOpen = ref(false);

const navItems = computed(() => [
  { to: '/', icon: Home, label: t('nav.home') },
  { to: '/ux-framework', icon: Layers, label: 'UX Framework' },
]);

const showAdmin = computed(() => authStore.bIsAdmin);

const isActive = (path: string): boolean => route.path === path;

const openDrawer = (): void => {
  bOpen.value = true;
};
const closeMobileDrawer = (): void => {
  bOpen.value = false;
};

defineExpose({ openDrawer });
</script>

<template>
  <aside class="sidebar" :class="{ 'is-open': bOpen }">
    <div class="sidebar-header">
      <router-link to="/" class="sidebar-logo" @click="closeMobileDrawer">
        <span class="sidebar-logo-title">
          <img src="/icon.svg" alt="" aria-hidden="true" />
          Nova Template
        </span>
        <span class="sidebar-logo-sub">Dashboard</span>
      </router-link>
      <button type="button" class="sidebar-close-btn" @click="bOpen = false">
        <X :size="18" />
      </button>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ 'is-active': isActive(item.to) }"
        @click="closeMobileDrawer"
      >
        <component :is="item.icon" :size="18" class="nav-icon" />
        {{ item.label }}
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <router-link
        to="/settings"
        class="nav-item"
        :class="{ 'is-active': isActive('/settings') }"
        @click="closeMobileDrawer"
      >
        <Settings :size="18" class="nav-icon" />
        {{ t('nav.settings') }}
      </router-link>
      <router-link
        v-if="showAdmin"
        to="/admin"
        class="nav-item"
        :class="{ 'is-active': isActive('/admin') }"
        @click="closeMobileDrawer"
      >
        <UserCog :size="18" class="nav-icon" />
        {{ t('nav.admin') }}
      </router-link>
    </div>
  </aside>

  <div v-if="bOpen" class="sidebar-overlay" @click="bOpen = false" />
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 256px;
  flex-shrink: 0;
  height: 100%;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  position: static;
  z-index: auto;
}

@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 200ms ease;
  }
  .sidebar.is-open {
    transform: translateX(0);
  }
}

.sidebar-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
}

.sidebar-logo {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 6px 8px;
  border-radius: var(--r-md);
  text-decoration: none;
  min-width: 0;
  transition: background 120ms ease;
}
.sidebar-logo:hover {
  background: var(--bg-translucent);
}

.sidebar-logo-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  color: var(--text-1);
  line-height: 1.25;
}
.sidebar-logo-title img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-logo-sub {
  padding-left: 28px;
  font-size: 11px;
  color: var(--text-2);
  line-height: 1.25;
}

.sidebar-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-2);
  border-radius: var(--r-md);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 120ms ease,
    color 120ms ease;
}
.sidebar-close-btn:hover {
  background: var(--bg-translucent);
  color: var(--text-1);
}

@media (min-width: 1024px) {
  .sidebar-close-btn {
    display: none;
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px;
}

.sidebar-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  padding: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 6px 12px;
  border-radius: var(--r-lg);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-2);
  text-decoration: none;
  margin-bottom: 2px;
  transition:
    background 120ms ease,
    color 120ms ease;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  font-family: var(--font);
}
.nav-item:hover {
  background: var(--bg-translucent);
  color: var(--text-1);
}
.nav-item.is-active {
  background: var(--primary-bg);
  color: var(--primary);
}
.nav-item.is-active:hover {
  background: var(--primary-bg);
  color: var(--primary);
}
.nav-item:last-child {
  margin-bottom: 0;
}

.nav-icon {
  flex-shrink: 0;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(0, 0, 0, 0.5);
}

@media (min-width: 1024px) {
  .sidebar-overlay {
    display: none;
  }
}
</style>
