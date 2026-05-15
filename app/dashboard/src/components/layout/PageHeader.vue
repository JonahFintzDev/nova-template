<script setup lang="ts">
// node_modules
import { useSlots } from 'vue';

// props
interface Props {
  title: string;
}

const props = defineProps<Props>();
const slots = useSlots();
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4 py-4">
    <h1 class="text-xl font-semibold text-text-primary">{{ title }}</h1>
    <div v-if="slots.default" class="flex items-center gap-2">
      <slot />
    </div>
  </header>
</template>
