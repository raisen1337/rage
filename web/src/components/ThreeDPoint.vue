<script setup lang="ts">
import { ref } from 'vue'
</script>
<template>
    <div class="hidden fixed !font-rajdhani m-auto bg-transparent flex flex-row items-center justify-center gap-4 rounded-xl w-screen h-screen -z-[1000]">
        <div class="w-[20rem] animate-pulse flex flex-col items-center justify-start h-[40rem] bg-pink-500/0">
            <div class="w-[8rem] h-[8rem] flex items-center justify-center bg-pink-600/0 rounded-[3rem] border-4 border-pink-600">
                <i class="fa-solid fa-location-dot text-pink-500 text-6xl"></i>
            </div>
            <div class="w-[3rem] h-[70%] bg-gradient-to-b rounded-b-[1rem] from-pink-500/40 via-pink-500/30 to-pink-500/0"></div>
        </div>
    </div>
</template>