<script setup lang="ts">
import { LogOut, Menu, Search, Settings } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';

import UserAvatar from '@/components/shared/UserAvatar.vue';
import { dropdownEnter, dropdownLeave } from '@/lib/gsap';
import { useAuthStore } from '@/stores/auth';

defineProps<{ title: string }>();

const emit = defineEmits<{
  (event: 'search'): void;
  (event: 'menu'): void;
}>();

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const bMenu = ref(false);
const menuRoot = ref<HTMLElement | null>(null);

const logout = async (): Promise<void> => {
  bMenu.value = false;
  authStore.logout();
  await router.push({ name: 'login' });
};

const onDocumentClick = (event: MouseEvent): void => {
  if (!bMenu.value || !menuRoot.value) return;
  if (!menuRoot.value.contains(event.target as Node)) {
    bMenu.value = false;
  }
};

onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => document.removeEventListener('click', onDocumentClick));
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button type="button" class="topbar-menu-btn" @click="emit('menu')">
        <Menu :size="20" />
      </button>
      <h2 class="topbar-title">{{ title }}</h2>
    </div>

    <div class="topbar-right">
      <button type="button" class="topbar-search" :title="t('nav.search')" @click="emit('search')">
        <Search :size="15" class="search-icon" />
        <span class="search-label">{{ t('nav.search') }}…</span>
        <kbd class="search-kbd">⌘K</kbd>
      </button>
      <button
        type="button"
        class="topbar-search-mobile"
        :title="t('nav.search')"
        @click="emit('search')"
      >
        <Search :size="20" />
      </button>

      <div ref="menuRoot" class="avatar-wrap">
        <button type="button" class="avatar-btn" @click.stop="bMenu = !bMenu">
          <UserAvatar
            :username="authStore.username ?? ''"
            :avatar-url="authStore.avatarUrl"
            size="md"
          />
        </button>
        <Transition name="gsap-dropdown" :css="false" @enter="dropdownEnter" @leave="dropdownLeave">
          <div v-if="bMenu" class="dropdown">
            <RouterLink to="/settings" class="dropdown-item" @click="bMenu = false">
              <Settings :size="16" />
              {{ t('nav.settings') }}
            </RouterLink>
            <button type="button" class="dropdown-item" @click="logout">
              <LogOut :size="16" />
              {{ t('nav.logout') }}
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: relative;
  z-index: 20;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 56px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-surface) 90%, transparent);
  backdrop-filter: blur(12px);
  padding: 0 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.topbar-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
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
.topbar-menu-btn:hover {
  background: var(--bg-translucent);
  color: var(--text-1);
}

@media (min-width: 1024px) {
  .topbar-menu-btn {
    display: none;
  }
}

.topbar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

@media (min-width: 1024px) {
  .topbar-title {
    font-size: 16px;
  }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.topbar-search {
  display: none;
  align-items: center;
  gap: 8px;
  height: 36px;
  max-width: 288px;
  flex: 1;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--bg-base);
  font-size: 14px;
  color: var(--text-2);
  cursor: pointer;
  font-family: var(--font);
  transition:
    border-color 150ms ease,
    background 150ms ease;
  text-align: left;
}
.topbar-search:hover {
  border-color: var(--primary-border);
  background: var(--bg-base);
}

@media (min-width: 640px) {
  .topbar-search {
    display: flex;
  }
}

.search-icon {
  flex-shrink: 0;
}

.search-label {
  flex: 1;
  text-align: left;
}

.search-kbd {
  display: none;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: var(--r-xs);
  font-size: 10px;
  color: var(--text-3);
  background: transparent;
  font-family: var(--font);
}

@media (min-width: 768px) {
  .search-kbd {
    display: inline-flex;
  }
}

.topbar-search-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
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
.topbar-search-mobile:hover {
  background: var(--bg-translucent);
  color: var(--text-1);
}

@media (min-width: 640px) {
  .topbar-search-mobile {
    display: none;
  }
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-base);
  cursor: pointer;
  overflow: hidden;
  transition: opacity 150ms ease;
}
.avatar-btn:hover {
  opacity: 0.85;
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 50;
  min-width: 176px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: var(--bg-surface);
  box-shadow: var(--shadow-2);
  padding: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-1);
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: var(--font);
  text-align: left;
  transition: background 120ms ease;
}
.dropdown-item:hover {
  background: var(--bg-translucent);
}
</style>
