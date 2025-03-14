<script setup lang="ts">
import { ref } from 'vue'

const playerList = ref<any[]>([]);
const isAdmin = ref(false);
const showScoreboard = ref(false);

// Funcție pentru a adăuga jucătorii în scoreboard
const renderPlayerCards = (players: any[], admin: boolean) => {
    playerList.value = players;
    isAdmin.value = admin;
    showScoreboard.value = true;
};

// Închiderea scoreboard-ului la apăsarea tastei ESC
let NUI_LOCK = false

mp.events.add('focus', (locked: boolean, hasCursor: boolean) => {
    NUI_LOCK = locked;
});
``

// Eveniment RAGE:MP pentru actualizarea scoreboard-ului
declare const mp: any;
mp.events.add("hideScoreboard", () => {
    showScoreboard.value = false;
});

mp.events.add("showScoreboard", (players: any, isAdmin: any) => {
    if(NUI_LOCK) return;
    players = JSON.parse(players);
    renderPlayerCards(players, isAdmin);
    showScoreboard.value = true;
});


</script>

<template>
    <div v-if="showScoreboard" id="playerListContainer"
        class="w-screen h-screen z-[100000] absolute top-0 bg-gradient-to-b from-black/90 via-black/90 to-pink-950/90 flex flex-col items-center justify-start pt-32 pb-16 animate-fade-in-fast">
        <h1 class="text-white text-6xl font-bold uppercase">Online Players</h1>
        <span class="text-[#FF0000] text-lg font-bold">VIEW ALL CONNECTED PLAYERS</span>
        <div id="playerList"
            class="w-[80%] grid grid-cols-2 gap-x-2 gap-y-2 h-auto max-h-[80%] overflow-y-scroll p-2">
            <div v-for="player in playerList" :key="player.id"
                class="w-full h-[4rem] bg-black/60 rounded-xl flex flex-row justify-between p-2 items-center animate-fade-in">
                <div class="flex flex-row items-center">
                    <div class="w-[50px] h-[50px] bg-pink-950 rounded-xl flex items-center justify-center">
                        <i class="fa-solid fa-user text-pink-600"></i>
                    </div>
                    <div class="flex flex-col ml-2">
                        <span class="text-white font-medium">{{ player.name }} ({{ player.pId }})</span>
                        <div class="flex mt-1 flex-row items-center gap-2">
                            <div v-if="player.admin"
                                class="w-fit h-fit px-3 py-[0.2rem] text-xs bg-pink-600/40 text-white rounded-xl">{{ player.admin ? 'Admin' : "" }}</div>
                            <div v-if="player.faction"
                                class="w-fit h-fit px-3 py-[0.2rem] text-xs bg-violet-700/90 text-white rounded-xl">
                                {{ player.faction.name }}
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="isAdmin" class="flex h-full flex-row items-center">
                    <button @click="mp.trigger('admTp', player.id)"
                        class="w-[40px] h-full bg-pink-950/90 text-white font-bold rounded-xl flex items-center justify-center">
                        <i class="fa-solid fa-location-dot text-pink-600"></i>
                    </button>
                    <button @click="mp.trigger('admRevive', player.id)"
                        class="w-[40px] h-full bg-pink-950/90 text-white font-bold rounded-xl flex items-center justify-center">
                        <i class="fa-solid fa-heart text-pink-600"></i>
                    </button>
                    <button @click="mp.trigger('admTpTo', player.id)"
                        class="w-[40px] h-full bg-pink-950/90 text-white font-bold rounded-xl flex items-center justify-center">
                        <i class="fa-brands fa-golang text-pink-600"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>
