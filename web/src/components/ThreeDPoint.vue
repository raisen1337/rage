<script setup lang="ts">
import { ref } from 'vue'
</script>
<template>
    <div class="hidden fixed !font-rajdhani m-auto bg-transparent flex flex-row items-center justify-center gap-4 rounded-xl w-screen h-screen -z-[1000]">
        <div class="w-[20rem] animate-pulse flex flex-col items-center justify-start h-[40rem] bg-red-500/0">
            <div class="w-[8rem] h-[8rem] flex items-center justify-center bg-red-600/0 rounded-[3rem] border-4 border-red-600">
                <i class="fa-solid fa-location-dot text-red-500 text-6xl"></i>
            </div>
            <div class="w-[3rem] h-[70%] bg-gradient-to-b rounded-b-[1rem] from-red-500/40 via-red-500/30 to-red-500/0"></div>
        </div>
    </div>
</template>