<script setup lang="ts">
// -------------------------------------------------- Props --------------------------------------------------
withDefaults(
  defineProps<{
    message?: string;
    subMessage?: string;
  }>(),
  {
    message: 'You are working offline.',
    subMessage: '',
  },
);
</script>

<template>
  <div
    class="flex flex-col gap-0.5 border-b border-[var(--border)] bg-[var(--bg-hover)] px-4 py-2 text-center text-xs text-2"
    role="status"
  >
    <span>{{ message }}</span>
    <span v-if="subMessage" class="text-[11px] text-3">{{ subMessage }}</span>
  </div>
</template>
