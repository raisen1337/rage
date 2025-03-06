<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
const time = ref(0) as any;

declare const mp: any // Assuming this is for external usage, might be related to a game engine or similar

let timer: any | null = null; // Use number | null for timer type for clearInterval

onMounted(() => {
    startTimer();
});

onUnmounted(() => {
    stopTimer();
});

function startTimer() {
    if (timer === null) { // Prevent multiple timers running
        timer = setInterval(() => {
            time.value--
            if (time.value <= 0) {
                time.value = 0; // Ensure time doesn't go negative
                stopTimer();
                timeEnded(); // Call the timeEnded function when timer reaches 0
            }
        }, 1000);
    }
}

function stopTimer() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null; // Reset timer variable
    }
}


function resetTimer() {
    stopTimer(); // Clear any existing timer before resetting
    time.value = 300;
    startTimer(); // Start a new timer
}

function timeEnded() {
    mp.trigger('deathscreenTimeEnded'); // Call the deathscreenTimeEnded event when timer reaches 0
}

const minutes = computed(() => {
    return Math.floor(time.value / 60);
});

const seconds = computed(() => {
    return time.value % 60;
});

const formattedMinutes = computed(() => {
    return String(minutes.value).padStart(2, '0');
});

const formattedSeconds = computed(() => {
    return String(seconds.value).padStart(2, '0');
});

mp.events.add("showDeathscreen", (duration: number) => {
    time.value = duration;
    resetTimer();
});


</script>
<template>
    <div 
    v-show="time > 0"
    class="w-screen fixed h-screen font-rajdhani bg-radient-circle-c from-black/80 to-black top-0 z-[100] flex flex-col items-center justify-center">
        <div class="absolute w-screen h-screen bg-radient-circle-b -z-[5] from-red-950/50 to-transparent"></div>
        <i class="fa-sharp fa-skull text-red-600 text-[8rem]"></i>
        <h1 class="text-white text-3xl mt-3">Ai murit.</h1>
        <h1 class="text-white/50 text-xl font-light">Asteapta sa fii tratat de un medic, sau asteapta respawn-ul.</h1>
        <!-- time, individual container for MM:SS -->
        <div class="flex flex-row items-center gap-1">
            <span class="text-white text-4xl p-2 bg-black/40 rounded-lg font-light">{{ formattedMinutes }}</span>
            <span class="text-white text-4xl font-light">:</span>
            <span class="text-white text-4xl p-2 bg-black/40 rounded-lg font-light">{{ formattedSeconds }}</span>
        </div>
  </div>
</template>