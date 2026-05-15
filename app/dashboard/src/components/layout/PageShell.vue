<script setup lang="ts">
// node_modules
import { computed } from 'vue';

// props
interface Props {
  narrow?: boolean;
}

const props = defineProps<Props>();

const containerClass = computed(() => {
  return props.narrow ? 'max-w-2xl' : 'max-w-4xl';
});
</script>

<template>
  <div class="mx-auto w-full px-4 py-6 sm:px-6 md:py-8" :class="containerClass">
    <slot />
  </div>
</template>
