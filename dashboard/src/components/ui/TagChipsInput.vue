<script setup lang="ts">
// node_modules
import { computed, ref } from 'vue';

// -------------------------------------------------- Types --------------------------------------------------
interface Tag {
  id: string;
  name: string;
  color?: string;
}

// -------------------------------------------------- Props --------------------------------------------------
const props = defineProps<{
  modelValue: string[];
  allTags: Tag[];
  disabled?: boolean;
}>();

// -------------------------------------------------- Emits --------------------------------------------------
const emit = defineEmits<{
  (event: 'update:modelValue', value: string[]): void;
  (event: 'create', name: string): void;
}>();

// -------------------------------------------------- Data --------------------------------------------------
const input = ref('');

// -------------------------------------------------- Computed --------------------------------------------------
const selectedTags = computed(() => {
  return props.allTags.filter((tag) => props.modelValue.includes(tag.id));
});

const suggestions = computed(() => {
  const term = input.value.trim().toLowerCase();
  if (!term) {
    return props.allTags.filter((tag) => !props.modelValue.includes(tag.id)).slice(0, 8);
  }
  return props.allTags.filter(
    (tag) => !props.modelValue.includes(tag.id) && tag.name.toLowerCase().includes(term),
  );
});

// -------------------------------------------------- Methods --------------------------------------------------
const addTagId = (tagId: string): void => {
  if (props.disabled || props.modelValue.includes(tagId)) {
    return;
  }
  emit('update:modelValue', [...props.modelValue, tagId]);
  input.value = '';
};

const removeTagId = (tagId: string): void => {
  if (props.disabled) {
    return;
  }
  emit(
    'update:modelValue',
    props.modelValue.filter((id) => id !== tagId),
  );
};

const pillStyle = (tag: Tag): Record<string, string> => {
  if (tag.color) {
    return {
      backgroundColor: tag.color + '22',
      color: tag.color,
      borderColor: tag.color + '44',
    };
  }
  return {
    backgroundColor: 'var(--primary-bg)',
    color: 'var(--primary)',
    borderColor: 'var(--primary-border)',
  };
};

const suggestionStyle = (tag: Tag): Record<string, string> => {
  if (tag.color) {
    return {
      borderColor: tag.color + '55',
      color: tag.color,
      backgroundColor: 'transparent',
    };
  }
  return {
    borderColor: 'var(--border-strong)',
    color: 'var(--text-2)',
    backgroundColor: 'transparent',
  };
};

const onEnter = (): void => {
  if (props.disabled) {
    return;
  }
  const term = input.value.trim();
  if (!term) {
    return;
  }
  const existing = props.allTags.find((tag) => tag.name.toLowerCase() === term.toLowerCase());
  if (existing) {
    addTagId(existing.id);
    return;
  }
  emit('create', term);
  input.value = '';
};
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-1">
      <span
        v-for="tag in selectedTags"
        :key="tag.id"
        class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
        :style="pillStyle(tag)"
      >
        {{ tag.name }}
        <button
          type="button"
          class="opacity-70 hover:opacity-100"
          style="color: inherit"
          :disabled="props.disabled"
          @click="removeTagId(tag.id)"
        >
          &times;
        </button>
      </span>
    </div>
    <input
      v-model="input"
      type="text"
      :disabled="props.disabled"
      placeholder="Tag…"
      class="input"
      @keydown.enter.prevent="onEnter"
    />
    <div v-if="suggestions.length" class="flex flex-wrap gap-1 text-xs">
      <button
        v-for="tag in suggestions"
        :key="tag.id"
        type="button"
        class="rounded-md border px-2 py-0.5 hover:brightness-110"
        :disabled="props.disabled"
        :style="suggestionStyle(tag)"
        @click="addTagId(tag.id)"
      >
        {{ tag.name }}
      </button>
    </div>
  </div>
</template>
