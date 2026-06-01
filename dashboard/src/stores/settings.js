// node_modules
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
// classes
import { settingsApi } from '@/classes/api';
export const useSettingsStore = defineStore('settings', () => {
    const settings = ref(null);
    const bLoaded = ref(false);
    const aiFeaturesDisabled = computed(() => settings.value?.aiFeaturesDisabled ?? false);
    const load = async (options) => {
        if (bLoaded.value && settings.value && options?.force !== true) {
            return settings.value;
        }
        const loaded = await settingsApi.get();
        settings.value = loaded;
        bLoaded.value = true;
        return loaded;
    };
    const update = async (patch) => {
        const updated = await settingsApi.update(patch);
        settings.value = updated;
        bLoaded.value = true;
        return updated;
    };
    const clear = () => {
        settings.value = null;
        bLoaded.value = false;
    };
    return {
        settings,
        bLoaded,
        aiFeaturesDisabled,
        load,
        update,
        clear,
    };
});
