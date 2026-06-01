<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView, useRoute } from 'vue-router';

import { pageEnter, pageLeave } from '@/lib/gsap';
import NavSidebar from '@/components/layout/NavSidebar.vue';
import NavTopBar from '@/components/layout/NavTopBar.vue';

const route = useRoute();
const { t } = useI18n();
const navSidebarRef = ref<{ openDrawer: () => void } | null>(null);
const bSearchOpen = ref(false);

const pageTitle = computed(() => {
  const name = route.name;
  if (name === 'home') return t('home.title');
  if (name === 'settings') return t('settings.title');
  if (name === 'admin') return t('admin.title');
  return 'Nova Template';
});

const openNavDrawer = (): void => {
  navSidebarRef.value?.openDrawer();
};

const onGlobalKey = (event: KeyboardEvent): void => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    bSearchOpen.value = true;
  }
};

onMounted(() => window.addEventListener('keydown', onGlobalKey));
onUnmounted(() => window.removeEventListener('keydown', onGlobalKey));
</script>

<template>
  <div class="app-shell" style="color: var(--text-1); background: var(--bg-base)">
    <NavSidebar ref="navSidebarRef" />
    <div style="display: flex; flex-direction: column; flex: 1; min-width: 0; overflow: hidden">
      <NavTopBar :title="pageTitle" @search="bSearchOpen = true" @menu="openNavDrawer" />
      <main style="position: relative; z-index: 0; flex: 1; min-height: 0; overflow-y: auto">
        <RouterView v-slot="{ Component }">
          <Transition mode="out-in" :css="false" @enter="pageEnter" @leave="pageLeave">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
