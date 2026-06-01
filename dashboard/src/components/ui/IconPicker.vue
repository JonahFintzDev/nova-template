<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Component } from 'vue';
import {
  Home,
  Briefcase,
  ShoppingCart,
  Plane,
  UtensilsCrossed,
  ShieldCheck,
  Wallet,
  GraduationCap,
  Film,
  Shapes,
  Dumbbell,
  PawPrint,
  BookOpen,
  Car,
  CalendarDays,
  Wrench,
  Music,
  Star,
} from 'lucide-vue-next';

const iconMap: Record<string, Component> = {
  home: Home,
  work: Briefcase,
  shopping_cart: ShoppingCart,
  flight: Plane,
  restaurant: UtensilsCrossed,
  health_and_safety: ShieldCheck,
  account_balance_wallet: Wallet,
  school: GraduationCap,
  movie: Film,
  category: Shapes,
  fitness_center: Dumbbell,
  pets: PawPrint,
  local_library: BookOpen,
  directions_car: Car,
  event: CalendarDays,
  build: Wrench,
  music_note: Music,
  star: Star,
};

const defaultIcons = Object.keys(iconMap);

const { modelValue } = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | null): void;
}>();

const filter = ref('');

const filtered = computed(() => {
  const term = filter.value.trim().toLowerCase();
  if (!term) return defaultIcons;
  return defaultIcons.filter((icon) => icon.toLowerCase().includes(term));
});

const pick = (icon: string) => emit('update:modelValue', icon);
const clear = () => emit('update:modelValue', null);
</script>

<template>
  <div class="space-y-3">
    <input
      v-model="filter"
      type="search"
      placeholder="Filter icons…"
      class="input !h-9 !rounded-lg !px-4 !text-sm w-full"
    />
    <p
      v-if="filtered.length === 0"
      class="rounded-md border border-[var(--border)] bg-[var(--bg-input)] py-6 text-center text-sm text-2"
    >
      No icons found.
    </p>
    <div v-else class="grid grid-cols-9 gap-3 max-sm:grid-cols-5">
      <button
        v-for="icon in filtered.slice(0, 18)"
        :key="icon"
        type="button"
        class="flex h-12 w-12 items-center justify-center rounded-lg border transition-all"
        :class="
          modelValue === icon
            ? 'bg-primary text-white border-primary shadow-sm'
            : 'bg-[var(--bg-surface)] border-transparent text-2 hover:border-primary/40 hover:text-1'
        "
        :title="icon"
        @click="pick(icon)"
      >
        <component :is="iconMap[icon]" :size="20" />
      </button>
    </div>
    <button
      v-if="modelValue"
      type="button"
      class="text-xs text-2 transition-colors hover:text-1"
      @click="clear"
    >
      Clear
    </button>
  </div>
</template>
