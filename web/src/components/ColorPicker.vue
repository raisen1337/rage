<script setup lang="ts">
import { ref, watch, defineEmits, defineProps } from 'vue';
import { Vue3ColorPicker } from "@cyhnkckali/vue3-color-picker";

import '@cyhnkckali/vue3-color-picker/dist/style.css';

const props = defineProps<{
  value: string; // Initial color value
}>();

const emit = defineEmits(['update:value', 'color-change']);

const color = ref(props.value || '#ff0000');  // Use prop, fallback to default


watch(color, (newColor) => {
  emit('update:value', newColor); // Update v-model (if used)
  emit('color-change', newColor);  // Emit custom event
});

</script>

<template>
  <Vue3ColorPicker
    v-model:hex="color"
    theme="dark"
    mode="solid"
    type="RGBA"
    :showAlpha="false"
    :show-eye-drop="false"
    class="z-[1000]"
  />
</template>

<style scoped>
/* Add any specific styles if needed */
</style>