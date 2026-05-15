<script setup lang="ts">
// node_modules
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView, useRoute } from 'vue-router';

// lib
import { pageEnter, pageLeave } from '@/lib/gsap';

// components
import NavSidebar from '@/components/layout/NavSidebar.vue';
import NavTopBar from '@/components/layout/NavTopBar.vue';

// -------------------------------------------------- Data --------------------------------------------------
const route = useRoute();
const { t } = useI18n();
const navSidebarRef = ref<{ openDrawer: () => void } | null>(null);

// -------------------------------------------------- Computed --------------------------------------------------
const pageTitle = computed(() => {
  const name = route.name;
  if (name === 'home') {
    return t('home.title');
  }
  if (name === 'settings') {
    return t('settings.title');
  }
  if (name === 'admin') {
    return t('admin.title');
  }
  return 'Nova Template';
});

// -------------------------------------------------- Methods --------------------------------------------------
const openNavDrawer = (): void => {
  navSidebarRef.value?.openDrawer();
};

// -------------------------------------------------- Lifecycle --------------------------------------------------
onMounted(() => {
  window.addEventListener('keydown', onGlobalKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKey);
});

const onGlobalKey = (event: KeyboardEvent): void => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    // Could trigger search here
  }
};
</script>

<template>
  <div class="app-shell relative z-10 flex bg-bg text-text-primary">
    <NavSidebar ref="navSidebarRef" />
    <div class="flex min-w-0 flex-1 flex-col lg:ms-0">
      <NavTopBar :title="pageTitle" @menu="openNavDrawer">
        <template #menu-icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </template>
      </NavTopBar>
      <main class="relative z-0 min-h-0 flex-1 overflow-y-auto">
        <RouterView v-slot="{ Component }">
          <Transition mode="out-in" :css="false" @enter="pageEnter" @leave="pageLeave">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
