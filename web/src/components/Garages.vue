<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const showGarage = ref(false)
declare const mp: any;
const props = defineProps(["vehicle"]);

const imageSrc = computed(() => 
  props.vehicle?.model ? `https://docs.fivem.net/vehicles/${props.vehicle.model}.webp` : ""
);

const imageExists = ref(false);

const checkImageExists = async (url: any) => {
  if (!url) return;
  try {
    const response = await fetch(url, { method: "HEAD" });
    imageExists.value = response.ok;
  } catch {
    imageExists.value = false;
  }
};

// Verifică când `props.vehicle` se schimbă
watch(() => props.vehicle, () => {
  checkImageExists(imageSrc.value);
}, { immediate: true });
const vehicles = ref<any>([

])

let NUI_LOCK = false

mp.events.add('focus', (locked: boolean, hasCursor: boolean) => {
    NUI_LOCK = locked;
});

const searchQuery = ref(''); // Create searchQuery ref


mp.events.add('showVehicles', (vehiclesList: any) => {
    if(NUI_LOCK) return;
    vehiclesList = JSON.parse(vehiclesList);
    vehicles.value = vehiclesList;
    showGarage.value = true;
});

//esc keydown
onMounted(() => {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            showGarage.value = false;
            mp.trigger('hideVehicles')
        }
    });
});
const filteredVehicles = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return vehicles.value.filter((vehicle: any) => {
        return vehicle.label.toLowerCase().includes(query);
    });
});

const spawnVehicle = (model: any, plate: string) => {
    mp.trigger('spawnVehicle', model,plate);
}

const deleteVehicle = (plate: string) => {
    mp.trigger('deleteVehicle', plate);
}

</script>
<template>
    <div v-if="showGarage"
        class="font-rajdhani  fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-fade-in">
        <!-- Background Effects -->
        <div class="absolute inset-0 z-[1] bg-gradient-to-br from-pink-900/20 via-transparent to-zinc-900/30"></div>
        <div
            class="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_10%_10%,rgba(220,38,38,0.15),transparent_50%)]">
        </div>

        <!-- Animated Particles -->
        <div class="absolute inset-0 z-[2] opacity-20">
            <div v-for="n in 200" :key="n" class="absolute w-1 animate-float h-1 rounded-full bg-pink-500/80"
                :style="`top: ${Math.random() * 100}vh; left: ${Math.random() * 100}vw;`">
            </div>
        </div>

        <!-- Main Content Container -->
        <div class="relative z-[10] w-full h-full overflow-auto px-6 py-8 md:p-12">
            <!-- Header Section -->
            <div class="sticky top-0 z-20 bg-black/60  mb-8 pt-4 pb-6 px-4 rounded-xl border-b border-zinc-800/60">
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <!-- Title Area -->
                    <div class="flex items-center gap-4">
                        <div
                            class="bg-gradient-to-br from-pink-600 to-pink-800 w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center shadow-lg shadow-pink-900/30">
                            <i class="fa-solid fa-car text-white text-xl md:text-2xl"></i>
                        </div>
                        <div class="flex flex-col">
                            <h1 class="text-4xl md:text-6xl uppercase font-bold text-white tracking-wider">
                                <span class="text-pink-500">G</span>ARAGE
                            </h1>
                            <p class="text-zinc-400 text-sm md:text-base">Select a vehicle to spawn it</p>
                        </div>
                    </div>

                    <!-- Search & Filter Controls -->
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <input type="text" placeholder="Search vehicles..." v-model="searchQuery"
                                class="bg-zinc-900/60 border border-zinc-800/80 text-white rounded-lg py-2 pl-10 pr-4 w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-pink-500/50" />
                            <i
                                class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500"></i>
                        </div>
                        <button class="bg-zinc-800/60 hover:bg-zinc-700/80 text-white rounded-lg p-2 transition-all">
                            <i class="fa-solid fa-filter"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Vehicles Grid -->
            <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 pb-24">
                <div v-for="vehicle in filteredVehicles" :key="vehicle.plate"
                    class="group bg-zinc-900/30 overflow-hidden border border-zinc-800/50 hover:border-pink-500/50 transition-all duration-300 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-pink-900/20 flex flex-col">

                    <!-- Card Header -->
                    <div class="p-4 flex justify-between items-center border-b border-zinc-800/30">
                        <h2 class="text-xl font-bold text-white truncate group-hover:text-pink-400 transition-colors">{{
                            vehicle.label }}</h2>
                        <div class="flex gap-2">
                            <span v-if="vehicle.isVIP"
                                class="text-xs px-2 py-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-md font-semibold text-black">
                                VIP
                            </span>
                            <span
                                class="text-xs px-2 py-1 bg-gradient-to-r from-pink-600 to-pink-800 rounded-md font-semibold text-white">
                                {{ vehicle.plate }}
                            </span>
                        </div>
                    </div>

                    <!-- Vehicle Image -->
                    <div class="flex-1 flex items-center justify-center p-6 group-hover:bg-zinc-800/20 transition-all">
                        <img v-if="imageExists" :src="imageSrc"
                            class="max-h-[120px] object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-1" />
                        <span v-else class="text-white">No image</span>
                    </div>

                    <!-- Vehicle Stats -->
                    <div class="px-4 py-2 bg-zinc-950/40 border-t w-[50rem] border-zinc-800/30 grid grid-cols-3 gap-2">
                        <span class="text-sm text-zinc-400 w-full">Vehiculul poate fi scos o singura data.</span>
                    </div>

                    <!-- Action Buttons -->
                    <div class="p-4 border-t border-zinc-800/30">
                        <div class="flex flex-col gap-2">
                            <button v-if="!vehicle.isOut"
                                @click="spawnVehicle(vehicle.model,vehicle.plate)"
                                class="bg-gradient-to-r from-pink-600 to-pink-800 hover:from-pink-500 hover:to-pink-700 px-4 py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-pink-900/30">
                                <i class="fa-solid fa-car-side"></i>
                                Spawn Vehicle
                            </button>
                            <button v-else
                                @click="deleteVehicle(vehicle.plate)"
                                class="bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 px-4 py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-xmark"></i>
                                Return Vehicle
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredVehicles.length === 0"
                class="flex flex-col items-center justify-center p-12 text-zinc-400 bg-zinc-950/50  rounded-xl border border-zinc-800/50">
                <i class="fa-solid fa-car-burst text-4xl mb-4 text-pink-500/70"></i>
                <p class="text-xl">No vehicles available</p>
                <p class="text-sm text-zinc-500 mt-2">Check back later or contact an administrator</p>
            </div>

            <!-- Footer Navigation -->
            <!-- <div
                class="fixed bottom-0 left-0 right-0 z-20 bg-black/60 backdrop-blur-md border-t border-zinc-800/60 py-4 px-6">
                <div class="flex justify-between items-center max-w-screen-2xl mx-auto">
                    <button class="text-zinc-400 hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-left mr-2"></i> Back
                    </button>
                    <div class="flex gap-6">
                        <button class="text-zinc-400 hover:text-pink-400 transition-colors">
                            <i class="fa-solid fa-flag-checkered mr-1"></i> Race
                        </button>
                        <button class="text-zinc-400 hover:text-pink-400 transition-colors">
                            <i class="fa-solid fa-wrench mr-1"></i> Customize
                        </button>
                        <button class="text-zinc-400 hover:text-pink-400 transition-colors">
                            <i class="fa-solid fa-map-location-dot mr-1"></i> GPS
                        </button>
                    </div>
                </div>
            </div> -->
        </div>
    </div>


</template>
<style scoped>
@keyframes float {

    0%,
    100% {
        transform: translateY(0) scale(1);
        opacity: 0.5;
    }

    50% {
        transform: translateY(-20px) scale(1.5);
        opacity: 1;
    }
}
</style>