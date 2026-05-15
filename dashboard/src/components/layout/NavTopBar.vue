<script setup lang="ts">
// node_modules
import { useI18n } from 'vue-i18n';

// props
interface Props {
  title: string;
}

const props = defineProps<Props>();
const { t } = useI18n();

// emits
const emit = defineEmits<{
  (e: 'search'): void;
  (e: 'menu'): void;
}>();
</script>

<template>
  <header
    class="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm px-4 py-3 lg:px-6"
  >
    <div class="flex items-center gap-4">
      <button type="button" class="lg:hidden p-2 rounded-lg hover:bg-bg" @click="emit('menu')">
        <slot name="menu-icon" />
      </button>
      <h1 class="text-lg font-semibold text-text-primary truncate">{{ title }}</h1>
    </div>

    <div class="flex items-center gap-2">
      <slot />
    </div>
  </header>
</template>
