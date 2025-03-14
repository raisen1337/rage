<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';

const props = defineProps<{
  modelValue: number;
  min: number;
  max: number;
}>();

const emit = defineEmits(['update:modelValue']);

// The element for the slider track
const sliderRef = ref<HTMLDivElement | null>(null);
// Track whether the user is dragging the thumb
const isDragging = ref(false);
// Local value to track the slider’s current value
const currentValue = ref(props.modelValue);

// Compute the percentage for the thumb and fill track
const percentage = computed(() => {
  return ((currentValue.value - props.min) / (props.max - props.min)) * 100;
});

// Fill track style (from start to the current percentage)
const fillStyle = computed(() => ({
  width: `${percentage.value}%`,
  background: '#f56565'
}));

// Thumb style so that it stays centered on the current value
const thumbStyle = computed(() => ({
  left: `${percentage.value}%`,
  transform: 'translate(-50%, -50%)'
}));

// Calculate the new value based on the mouse position
function calculateValue(clientX: number): number {
  if (!sliderRef.value) return props.min;
  
  const rect = sliderRef.value.getBoundingClientRect();
  const position = clientX - rect.left;
  const pct = position / rect.width;
  const value = pct * (props.max - props.min) + props.min;
  return Math.max(props.min, Math.min(props.max, value));
}

// Update the value when the mouse goes down on the slider
function handleMouseDown(e: MouseEvent) {
  isDragging.value = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  updateValue(e);
}

let animationFrameId: number | null = null;
function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(() => {
    updateValue(e);
  });
}

function handleMouseUp() {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

function updateValue(e: MouseEvent) {
  const newValue = calculateValue(e.clientX);
  currentValue.value = newValue;
  emit('update:modelValue', newValue);
}

// In case the parent changes the modelValue externally…
watch(
  () => props.modelValue,
  (newVal) => {
    currentValue.value = newVal;
  }
);

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
});
</script>

<template>
  <div
    class="relative w-full h-8 cursor-pointer"
    ref="sliderRef"
    @mousedown="handleMouseDown"
  >
    <!-- Base track -->
    <div
      class="absolute w-full h-2 bg-gray-300 rounded-lg top-1/2 -translate-y-1/2"
    ></div>
    
    <!-- Fill track -->
    <div
      class="absolute h-2 rounded-lg duration-75 top-1/2 -translate-y-1/2"
      :style="fillStyle"
    ></div>
    
    <!-- Thumb -->
    <div 
      class="absolute w-4 h-4 bg-white rounded-full border border-gray-400 duration-75 hover:scale-110"
      :style="thumbStyle"
    ></div>
  </div>
</template>
