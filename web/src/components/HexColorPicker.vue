<script setup lang="ts">
import { ref, computed } from 'vue';



// Define reactive values for each color channel (0–255)
const red = ref(255);
const green = ref(0);
const blue = ref(0);

// Compute the hex color based on the red, green, and blue values
const hexColor = computed(() => {
  const r = Math.round(red.value).toString(16).padStart(2, '0');
  const g = Math.round(green.value).toString(16).padStart(2, '0');
  const b = Math.round(blue.value).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
});

// When the user manually edits the hex input, update the sliders accordingly
function updateFromHex(newHex: string) {
  let hex = newHex.trim();
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length !== 6) return;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
    red.value = r;
    green.value = g;
    blue.value = b;
  }
}
</script>

<template>
  <div class="space-y-4 p-4">
    <!-- Red Slider -->
    <div class="flex items-center gap-2">
      <label class="w-12">Red:</label>
      <ColorSlider v-model="red" :min="0" :max="255" />
      <span class="w-8 text-right">{{ Math.round(red) }}</span>
    </div>
    
    <!-- Green Slider -->
    <div class="flex items-center gap-2">
      <label class="w-12">Green:</label>
      <ColorSlider v-model="green" :min="0" :max="255" />
      <span class="w-8 text-right">{{ Math.round(green) }}</span>
    </div>
    
    <!-- Blue Slider -->
    <div class="flex items-center gap-2">
      <label class="w-12">Blue:</label>
      <ColorSlider v-model="blue" :min="0" :max="255" />
      <span class="w-8 text-right">{{ Math.round(blue) }}</span>
    </div>
    
    <!-- Hex Output & Preview -->
    <div class="flex items-center gap-2">
      <label class="w-12">Hex:</label>
      <input 
        type="text" 
        class="border border-gray-300 rounded p-1 w-24"
        :value="hexColor"
        @change="updateFromHex(($event.target as HTMLInputElement).value)"
      />
      <div 
        class="w-8 h-8 rounded-full border border-gray-300"
        :style="{ backgroundColor: hexColor }"
      ></div>
    </div>
  </div>
</template>
