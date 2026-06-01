<script setup lang="ts">
import { ref } from 'vue';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  sub?: string;
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);
let nextId = 1;

const iconMap: Record<ToastKind, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const add = (item: Omit<ToastItem, 'id'>): void => {
  const id = nextId++;
  const duration = item.duration ?? 5000;
  toasts.value.push({ ...item, id });
  if (duration > 0) {
    setTimeout(() => remove(id), duration);
  }
};

const remove = (id: number): void => {
  const idx = toasts.value.findIndex((t) => t.id === id);
  if (idx !== -1) toasts.value.splice(idx, 1);
};

defineExpose({ add, remove });
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind" role="alert">
          <component :is="iconMap[t.kind]" :size="18" class="toast-icon" :class="t.kind" />
          <div class="toast-body">
            <div class="toast-title">{{ t.title }}</div>
            <div v-if="t.sub" class="toast-sub">{{ t.sub }}</div>
          </div>
          <button class="toast-close" aria-label="Dismiss" @click="remove(t.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  animation: slideUp 0.2s ease-out;
}
.toast-leave-active {
  animation: fadeIn 0.15s ease-out reverse;
}
.toast-move {
  transition: transform 0.2s ease;
}
</style>
