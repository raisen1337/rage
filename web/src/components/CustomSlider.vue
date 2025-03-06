<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';

const props = defineProps<{
  modelValue: number;
  min: number;
  max: number;
}>();

const emit = defineEmits(['update:modelValue']);

const sliderRef = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);
const currentValue = ref(props.modelValue);

const percentage = computed(() => {
  return ((currentValue.value - props.min) / (props.max - props.min)) * 100;
});

const fillStyle = computed(() => {
  const fillWidth = Math.abs(percentage.value - 50);
  const fillLeft = percentage.value < 50 ? percentage.value : 50;
  
  return {
    width: `${fillWidth}%`,
    left: `${fillLeft}%`,
    background: '#f56565'
  };
});

const thumbStyle = computed(() => {
  return {
    left: `${percentage.value}%`,
    transform: 'translate(-50%, -50%)',
    top: '50%'
  };
});

function calculateValue(clientX: number): number {
  if (!sliderRef.value) return props.min;
  
  const rect = sliderRef.value.getBoundingClientRect();
  const position = clientX - rect.left;
  const percentage = position / rect.width;
  const value = percentage * (props.max - props.min) + props.min;
  return Math.max(props.min, Math.min(props.max, value));
}

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

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
});
</script>

<template>
  <div class="relative w-full h-8" ref="sliderRef" @mousedown="handleMouseDown">
    <!-- Base track -->
    <div class="absolute w-full h-2 bg-white/10 rounded-lg top-1/2 -translate-y-1/2"></div>
    
    <!-- Fill track -->
    <div class="absolute h-2 rounded-lg  duration-75 top-1/2 -translate-y-1/2" :style="fillStyle"></div>
    
    <!-- Thumb -->
    <div 
      class="absolute w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full cursor-pointer  duration-75 hover:scale-110"
      :style="thumbStyle"
    ></div>
  </div>
</template>