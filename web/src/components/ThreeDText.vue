<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

declare const mp: any;

interface Interaction {
  id: string;
  key: string;
  text: string;
  subtext: string;
  x: number;
  y: number;
  scale: number;
  lastInteractionTime: number; // For hiding
}

const interacts = ref<Record<string, Interaction>>({}); // Use a Record (object)
const hideDelay = 250;

const minDistance = 0.5;
const maxDistance = 3.0;
const minScale = 0.8;
const maxScale = 1.1;

function calculateScale(distance: number): number {
  const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distance));
  const normalizedDistance = (clampedDistance - minDistance) / (maxDistance - minDistance);
  return minScale + (maxScale - minScale) * normalizedDistance;
}

let animationFrameId : number | null = null;

function addOrUpdateInteract(id: string, key: string, text: string, subtext: string, x: number, y: number, distance: number) {
  interacts.value[id] = {
    id,
    key,
    text,
    subtext,
    x,
    y,
    scale: calculateScale(distance),
    lastInteractionTime: Date.now(), // Update last interaction time
  };
}

// No removeInteract function needed

function checkVisibility() {
  const now = Date.now();

  for (const id in interacts.value) {
    const interact = interacts.value[id];
    const element = document.getElementById(`interact-${id}`);

    if (!element) {
      // Create element if it doesn't exist
      const newElement = document.createElement('div');
      newElement.id = `interact-${id}`;
      newElement.className = "interact-element fixed !font-rajdhani m-auto bg-transparent flex flex-row items-center gap-4 rounded-xl w-[16rem] h-[4rem]";
      newElement.innerHTML = `
        <div class="w-[50px] h-[50px] border-[4px] p-1 border-red-600 rotate-45">
          <div class="w-full h-full flex items-center justify-center text-center border-2 border-zinc-100">
            <span class="text-white font-bold rotate-[-45deg] interact-key">${interact.key}</span>
          </div>
        </div>
        <div class="flex flex-col items-start justify-center">
          <span class="text-white text-lg font-bold interact-text">${interact.text}</span>
          <span class="text-white text-sm -mt-1 interact-subtext">${interact.subtext}</span>
        </div>
      `;
      document.body.appendChild(newElement);
    } else {
      // Update existing element
      const keyElement = element.querySelector('.interact-key') as HTMLElement;
      const textElement = element.querySelector('.interact-text') as HTMLElement;
      const subtextElement = element.querySelector('.interact-subtext') as HTMLElement;

      if (keyElement) keyElement.textContent = interact.key;
      if (textElement) textElement.textContent = interact.text;
      if (subtextElement) subtextElement.textContent = interact.subtext;

      element.style.left = `${interact.x}px`;
      element.style.top = `${interact.y}px`;
      element.style.transform = `scale(${interact.scale})`;

      const timeSinceLastInteraction = now - interact.lastInteractionTime;
      if (timeSinceLastInteraction > hideDelay) {
        element.style.display = 'none';
      } else {
        element.style.display = 'flex';
      }
    }
  }

    // Cleanup: Remove DOM elements for interactions no longer in `interacts`
    const existingElements = document.querySelectorAll('.interact-element');
    existingElements.forEach(element => {
        const id = element.id.replace('interact-', '');
        if (!interacts.value[id]) {
            element.remove();
        }
    });

  animationFrameId = requestAnimationFrame(checkVisibility);
}

onMounted(() => {
   if(mp && mp.events){
      mp.events.add('addOrUpdateInteract', addOrUpdateInteract);
      // No removeInteract event listener
      animationFrameId = requestAnimationFrame(checkVisibility);
   } else {
      console.error("mp object or mp.events is not defined!");
   }
});

onUnmounted(() => {
  if(animationFrameId) cancelAnimationFrame(animationFrameId);
  if(mp && mp.events){
    mp.events.remove('addOrUpdateInteract', addOrUpdateInteract);
    // No removeInteract event listener
  }

  // Cleanup on unmount
  for (const id in interacts.value) {
    const element = document.getElementById(`interact-${id}`);
    if (element) {
      element.remove();
    }
  }
});
</script>

<template>
  <!-- Empty template -->
</template>

<style scoped>
/* Define styles for .interact-element */
</style>