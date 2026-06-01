<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    title: string;
    open: boolean;
    maxWidth?: string;
  }>(),
  { maxWidth: '520px' },
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleKey = (ev: KeyboardEvent): void => {
  if (ev.key === 'Escape' && props.open) emit('close');
};

onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-overlay" @click.self="emit('close')">
        <div class="modal" :style="{ maxWidth }" role="dialog" :aria-label="title">
          <div class="modal-head">
            <h4>{{ title }}</h4>
            <button class="close" aria-label="Close" @click="emit('close')">
              <X :size="16" />
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-foot">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active .modal {
  animation: slideUp 0.2s ease-out;
}
.modal-leave-active .modal {
  animation: slideUp 0.15s ease-in reverse;
}
.modal-enter-active,
.modal-leave-active {
  transition:
    background-color 0.2s ease,
    backdrop-filter 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  background-color: transparent;
  backdrop-filter: blur(0);
}
</style>
