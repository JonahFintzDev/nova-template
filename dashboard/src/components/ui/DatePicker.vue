<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import dayjs from 'dayjs';
import { CalendarIcon, ClockIcon } from 'lucide-vue-next';

const modelDate = defineModel<Date | null>('date', { required: true });
const modelHasTime = defineModel<boolean>('hasTime', { required: true });

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    clearable?: boolean;
    autoApply?: boolean;
    disabled?: boolean;
  }>(),
  {
    placeholder: '',
    clearable: true,
    autoApply: true,
    disabled: false,
  },
);

const time = ref<{ hours: number; minutes: number } | null>(null);
const bApplyTimeNextChange = ref(false);
const timePickerRef = ref<InstanceType<typeof VueDatePicker> | null>(null);

const parseModelValue = () => {
  if (modelDate.value && modelHasTime.value) {
    time.value = {
      hours: modelDate.value.getHours(),
      minutes: modelDate.value.getMinutes(),
    };
  } else {
    time.value = null;
  }
};

const onTimeUpdate = () => {
  if (bApplyTimeNextChange.value) {
    bApplyTimeNextChange.value = false;
    timePickerRef.value?.closeMenu();
    return;
  }
  bApplyTimeNextChange.value = !modelHasTime.value;
};

onMounted(() => parseModelValue());

watch(modelHasTime, (n, o) => {
  if (o !== n) parseModelValue();
});

watch(modelDate, (n, o) => {
  if (o !== n) parseModelValue();
});

watch(time, (n, o) => {
  if ((o?.hours !== n?.hours || o?.minutes !== n?.minutes) && modelDate.value) {
    if (n === null) {
      modelHasTime.value = false;
      return;
    }
    modelHasTime.value = true;
    modelDate.value = dayjs(modelDate.value)
      .set('hour', time.value?.hours ?? 0)
      .set('minute', time.value?.minutes ?? 0)
      .toDate();
  }
});
</script>

<template>
  <div class="space-y-2">
    <div class="input">
      <CalendarIcon :size="15" class="text-3" />
      <VueDatePicker
        v-model="modelDate"
        :teleport="true"
        :auto-apply="true"
        :clearable="true"
        :placeholder="props.placeholder"
        text-input
      />
    </div>
    <div
      class="input"
      :class="{
        'opacity-50 pointer-events-none': !modelDate,
        'is-empty': !modelHasTime,
      }"
    >
      <ClockIcon :size="15" class="text-3" />
      <VueDatePicker
        ref="timePickerRef"
        v-model="time"
        :teleport="true"
        :formats="{ input: 'HH:mm' }"
        :time-picker="true"
        :clearable="true"
        placeholder="-"
        :auto-apply="true"
        :disabled="props.disabled || !modelDate"
        :flow="modelHasTime ? undefined : ['hours', 'minutes']"
        @cleared="modelHasTime = false"
        @update:model-value="onTimeUpdate"
      />
    </div>
  </div>
</template>
