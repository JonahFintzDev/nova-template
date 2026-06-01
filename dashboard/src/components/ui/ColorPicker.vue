<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | null): void;
}>();

const palette = [
  ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'],
  ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  ['#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
  ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  ['#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'],
  ['#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'],
  ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'],
  ['#a16207', '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a'],
  ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
  ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],
];

const selected = ref(props.modelValue ?? '#4f46e5');

watch(
  () => props.modelValue,
  (v) => {
    if (v) selected.value = v;
  },
);

const pick = (color: string) => {
  selected.value = color;
  emit('update:modelValue', color);
};
</script>

<template>
  <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4">
    <div class="flex gap-2">
      <div v-for="(column, ci) in palette" :key="ci" class="flex-1 flex flex-col gap-1">
        <button
          v-for="color in column"
          :key="color"
          type="button"
          class="w-full aspect-square rounded-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
          :style="{ backgroundColor: color }"
          :title="color"
          @click="pick(color)"
        >
          <svg
            v-if="selected === color"
            class="w-4 h-4 mx-auto text-white drop-shadow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
