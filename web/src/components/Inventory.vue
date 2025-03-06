<script setup lang="ts">
import { ref, computed } from 'vue';
//@ts-ignore
import jquery from 'jquery';
//@ts-ignore
const icons = import.meta.glob('@/assets/items/*.{png,jpg,svg}', { eager: true });

// Context menu state
const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    selectedSlot: null as number | null,
    isMouseInside: false,
    item: null as any | null,
});

const maxWeight = ref(20);
const maxWeightSecondary = ref(20);

const inventoryOpen = ref(false);

// =========================
// Primary Inventory
// =========================

// Lista de iteme din inventarul primar
const playerItems = ref<any>([]);

// Creează 30 de sloturi pentru inventarul primar
const primarySlots = computed(() => {
    return Array.from({ length: 30 }, (_, i) => {
        const item = playerItems.value.find((item: any) => item.slot === i + 1);
        return item || null;
    });
});

const secondaryInventoryData = ref<any>(null);

// =========================
// Secondary Inventory
// =========================
declare const mp: any;
// Lista de iteme din inventarul secundar
const secondaryItems = ref<any>(false);
// Număr total de sloturi pentru inventarul secundar
const totalSecondarySlots = ref(30);
const secondarySlots = computed(() => {
    return Array.from({ length: totalSecondarySlots.value }, (_, i) => {
        const item = secondaryItems.value.find((item: any) => item.slot === i + 1);
        return item || null;
    });
});

// =========================
// Drag & Drop State & Events
// =========================

//listen for ESC
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        inventoryOpen.value = false;
        mp.trigger('inventory:close');
    }
});
let NUI_LOCK = false

mp.events.add('focus', (locked: boolean, hasCursor: boolean) => {
    NUI_LOCK = locked;
});

mp.events.add('openInventory', (playerInventory: any, secondaryInventory: any) => {
    // Parsing
    if(NUI_LOCK) return;
    if(inventoryOpen.value) return;
    
    playerInventory = JSON.parse(playerInventory);
    if(secondaryInventory) {
        secondaryInventory = JSON.parse(secondaryInventory);
        maxWeightSecondary.value = secondaryInventory.maxWeight;
        secondaryItems.value = secondaryInventory.items;
        totalSecondarySlots.value = secondaryInventory.slots;
        secondaryInventoryData.value = secondaryInventory.data;
    }else{
        secondaryItems.value = false
    }

    inventoryOpen.value = true;

    // Update primary inventory
    maxWeight.value = playerInventory.maxWeight;
    
    playerItems.value = playerInventory.items;
});

mp.events.add('updateInventory', (playerInventory: any, secondaryInventory: any) => {
    // Parsing
    playerInventory = JSON.parse(playerInventory);
    secondaryInventory = JSON.parse(secondaryInventory);

    // Update primary inventory
    maxWeight.value = playerInventory.maxWeight;
    playerItems.value = playerInventory.items;

    if(secondaryInventory) {
        secondaryInventory = JSON.parse(secondaryInventory);
        maxWeightSecondary.value = secondaryInventory.maxWeight;
        secondaryItems.value = secondaryInventory.items;
        totalSecondarySlots.value = secondaryInventory.slots;
        secondaryInventoryData.value = secondaryInventory.data;
    }else{
        secondaryItems.value = false
    }
});



// Variabile pentru starea de drag & drop
const draggedItem = ref<any>(null);
const draggedFromSlot = ref<number | null>(null);
const draggedFromInventory = ref<'primary' | 'secondary' | ''>('');

// Funcția de drag start – setăm sursa itemului
function onDragStart(event: DragEvent, slotIndex: number, inventory: 'primary' | 'secondary') {
    let item;
    if (inventory === 'primary') {
        item = primarySlots.value[slotIndex];
    } else {
        item = secondarySlots.value[slotIndex];
    }
    if (!item) return;
    draggedItem.value = item;
    draggedFromSlot.value = slotIndex;
    draggedFromInventory.value = inventory;
    event.dataTransfer?.setData('text/plain', JSON.stringify(item));
}

// Resetăm starea de drag la finalul operației
function onDragEnd(_event: DragEvent) {
    draggedItem.value = null;
    draggedFromSlot.value = null;
    draggedFromInventory.value = '';
}

// Permitem ca elementul să fie lăsat în zona target
function onDragOver(event: DragEvent) {
    event.preventDefault();
}

mp.events.add('updatePlayerInventory', (playerInventory: any, secondaryInventory: any) => {
    // Parsing
    playerInventory = JSON.parse(playerInventory);

    // Update primary inventory
    maxWeight.value = playerInventory.maxWeight;
    playerItems.value = playerInventory.items;

    if(secondaryInventory) {
        secondaryInventory = JSON.parse(secondaryInventory);
        maxWeightSecondary.value = secondaryInventory.maxWeight;
        secondaryItems.value = secondaryInventory.items;
        totalSecondarySlots.value = secondaryInventory.slots;
        secondaryInventoryData.value = secondaryInventory.data;
    }else{
        secondaryItems.value = false
    }
});

mp.events.add('closeInventory', () => {
    inventoryOpen.value = false;
    mp.trigger('inventory:close');
});

// Funcția de drop: se mută itemul în funcție de inventarul sursă și cel țintă
function onDrop(event: DragEvent, targetSlotIndex: number, targetInventory: 'primary' | 'secondary') {
    event.preventDefault();
    if (!draggedItem.value || draggedFromSlot.value === null || !draggedFromInventory.value) return;

    // Verificăm dacă slotul țintă este liber
    if (targetInventory === 'primary') {
        if (primarySlots.value[targetSlotIndex]) return; // slot ocupat
        if (draggedFromInventory.value === 'primary') {
            // Mutare în interiorul inventarului primar
            //get item name
            draggedItem.value.slot = targetSlotIndex + 1;
            console.log(`moved item in primary inventory from slot ${draggedFromSlot.value + 1} to slot ${targetSlotIndex + 1}`);
            mp.trigger('inventory:moveItem', draggedFromSlot.value + 1, targetSlotIndex + 1, 'primary');
            //Explain the trigger arguments
            //draggedItem.value.id - the item id
            //targetSlotIndex + 1 - the slot where the item will be moved
            //'primary' - the inventory where the item will be moved
        } else if (draggedFromInventory.value === 'secondary') {
            // Mutare din inventarul secundar în inventarul primar
            const index = secondaryItems.value.findIndex((i: any) => i === draggedItem.value);
            if (index !== -1) {
                secondaryItems.value.splice(index, 1);
            }
            draggedItem.value.slot = targetSlotIndex + 1;
            playerItems.value.push(draggedItem.value);
            console.log(`moved item from secondary inventory to primary inventory on slot ${targetSlotIndex + 1}`);
            mp.trigger('inventory:moveItemToPrimary', draggedFromSlot.value + 1, targetSlotIndex + 1, JSON.stringify(secondaryInventoryData.value));
        }
    } else if (targetInventory === 'secondary') {
        if (secondarySlots.value[targetSlotIndex]) return; // slot ocupat
        if (draggedFromInventory.value === 'secondary') {
            // Mutare în interiorul inventarului secundar
            draggedItem.value.slot = targetSlotIndex + 1;
            console.log(`moved item in secondary from slot ${draggedFromSlot.value + 1} to slot ${targetSlotIndex + 1}`);
            mp.trigger('inventory:moveItem', draggedItem.value.id, targetSlotIndex + 1, 'secondary');
        } else if (draggedFromInventory.value === 'primary') {
            // Mutare din inventarul primar în inventarul secundar
            const index = playerItems.value.findIndex((i: any) => i === draggedItem.value);
            if (index !== -1) {
                playerItems.value.splice(index, 1);
            }
            draggedItem.value.slot = targetSlotIndex + 1;
            secondaryItems.value.push(draggedItem.value);
            console.log(`moved item from primary inventory to secondary inventory on slot ${targetSlotIndex + 1}`);
            mp.trigger('inventory:moveItemToSecondary', draggedFromSlot.value + 1, targetSlotIndex + 1, JSON.stringify(secondaryInventoryData.value));
        }
    }

    draggedItem.value = null;
    draggedFromSlot.value = null;
    draggedFromInventory.value = '';
}

function useItem(slot: any) {
    mp.trigger('inventory:useItem', slot);
}

function giveItem(slot: any) {
    mp.trigger('inventory:giveItem', slot);
}

function dropItem(slot: any) {
    mp.trigger('inventory:dropItem', slot);
}


// =========================
// Context Menu Functions
// =========================

function showContextMenu(event: MouseEvent, slot: number, itemData: any) {
    const item = primarySlots.value[slot - 1];
    if (!item) return;
    contextMenu.value.visible = true;
    contextMenu.value.x = event.clientX;
    contextMenu.value.y = event.clientY;
    contextMenu.value.selectedSlot = slot;
    contextMenu.value.isMouseInside = false;
    contextMenu.value.item = itemData;
}

function showSecondaryContextMenu(event: MouseEvent, slot: number, itemData: any) {
    const item = secondarySlots.value[slot - 1];
    if (!item) return;
    contextMenu.value.visible = true;
    contextMenu.value.x = event.clientX;
    contextMenu.value.y = event.clientY;
    contextMenu.value.selectedSlot = slot;
    contextMenu.value.isMouseInside = false;
    contextMenu.value.item = itemData;
}

function hideContextMenu() {
    if (!contextMenu.value.isMouseInside) {
        contextMenu.value.visible = false;
    }
}

function onContextMenuEnter() {
    contextMenu.value.isMouseInside = true;
}

function onContextMenuLeave() {
    contextMenu.value.isMouseInside = false;
    setTimeout(hideContextMenu, 200);
}

const totalWeightPlayer = computed(() => {
    return playerItems.value.reduce((acc: any, item: any) => acc + item.weight * item.amount, 0);
});

const totalWeightSecondary = computed(() => {
    return secondaryItems.value.reduce((acc: any, item: any) => acc + item.weight * item.amount, 0);
});



// =========================
// Process Icons
// =========================

const itemIcons = Object.entries(icons).map(([path, mod]) => ({
    name: path.split('/').pop()?.replace(/\.(png|jpg|svg)$/, ''),
    src: (mod as { default: string }).default,
}));

function getIconByName(name: string) {
    return itemIcons.find((icon) => icon.name === name)?.src;
}
</script>

<template>
    <div
        v-show="inventoryOpen"
        class="w-screen h-screen font-rajdhani absolute flex flex-col top-0 z-10 bg-radient-circle-c from-black/90 to-black/90 p-16">
        <!-- Header -->
        <div class="flex flex-row w-full gap-2 items-center">
            <div
                class="flex flex-row items-center bg-gradient-to-br from-red-800 to-red-900 text-2xl justify-center w-[5rem] h-[5rem] rounded-md">
                <i class="fa-solid fa-backpack text-white"></i>
            </div>
            <div class="flex flex-col">
                <span class="text-white font-bold text-7xl font-rajdhani">INVENTORY</span>
                <span class="text-white/50 text-lg font-rajdhani">
                    Here you can see all the items you have in your inventory.
                </span>
            </div>
        </div>

        <div class="flex flex-row items-start justify-between w-full h-fit gap-3">
            <!-- Primary Inventory Container -->
            <div class="flex flex-col w-fit h-full">
                <!-- Placeholder pentru aliniere -->
                <div class="mb-4 h-[4rem]"></div>
                <div class="flex flex-row w-full items-center gap-1">
                    <span class="text-white text-xl font-normal">Greutate</span>
                    <div class="flex flex-row w-full items-center gap-1">
                        <div class="w-full h-2 bg-white/30 rounded-md">
                            <div class="h-full bg-gradient-to-r from-red-500 to-red-800 rounded-md"
                                :style="{ width: `${(totalWeightPlayer / maxWeight) * 100}%` }">
                            </div>
                        </div>
                        <span class="text-white text-lg font-normal">{{ totalWeightPlayer }}/{{ maxWeight }}</span>
                        <span class="text-white text-lg font-normal">KG</span>
                    </div>
                </div>

                <!-- Sloturi pentru inventarul primar (30 de sloturi) -->
                <div class="flex flex-col w-fit h-full mt-4">
                    <div class="grid grid-cols-5 grid-rows-6 gap-2 bg-transparent rounded-lg">
                        <div v-for="(item, i) in primarySlots" :key="i"
                            :class="['flex flex-col w-[100px] h-[100px] bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md relative', !item ? 'droppable' : '']"
                            @contextmenu.prevent="showContextMenu($event, i + 1, item)" @dragover="onDragOver"
                            @drop="onDrop($event, i, 'primary')">

                            <!-- Dacă slotul e gol, afișează numărul (doar pentru primele 5 sloturi) -->
                            <span v-if="!item && i < 5"
                                class="absolute inset-0 flex items-center justify-center text-white/20 text-2xl">
                                {{ i + 1 }}
                            </span>

                            <!-- Dacă slotul conține un item, afișează iconița cu drag activat -->
                            <img v-if="item" class="w-1/2 draggable h-1/2 absolute inset-0 m-auto"
                                :src="getIconByName(item.name)" :alt="item.label" draggable="true"
                                @dragstart="onDragStart($event, i, 'primary')" @dragend="onDragEnd" />

                            <!-- Afișează cantitatea itemului -->
                            <span v-if="item"
                                class="absolute bottom-1 right-1 text-white text-sm bg-black/70 px-1 rounded">
                                {{ item.amount }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Context Menu pentru inventarul primar -->
                <div v-if="contextMenu.visible" :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
                    class="absolute bg-zinc-950/80 rounded-xl z-[100] w-[16rem] h-[10rem] text-white shadow-lg flex flex-col items-start justify-between p-3"
                    @mouseenter="onContextMenuEnter" @mouseleave="onContextMenuLeave">
                    <div class="flex flex-col">
                        <div class="flex flex-row gap-3 items-center">
                            <span class="font-bold text-2xl">{{ contextMenu.item.label }}</span>
                            <span class="font-normal text-white/50 text-md">({{ contextMenu.item.amount }}x)</span>
                        </div>
                        <span class="font-normal text-white/50 text-md">{{ contextMenu.item.description }}</span>
                    </div>
                    <div class="flex flex-row items-center gap-2 h-1/2 justify-between">
                        <button
                            @click="useItem(contextMenu.selectedSlot)"
                            class="bg-green-500 w-1/2 hover:bg-green-600 text-black font-bold px-2 py-1 rounded-xl">Use</button>
                        <button
                            @click="giveItem(contextMenu.selectedSlot)"
                            class="bg-yellow-500 w-1/2 hover:bg-yellow-600 text-black font-bold px-2 py-1 rounded-xl">Give</button>
                        <button
                            @click="dropItem(contextMenu.selectedSlot)"
                            class="bg-red-500 w-1/2 hover:bg-red-600 text-black font-bold px-2 py-1 rounded-xl">Drop</button>
                    </div>
                </div>
            </div>
            <div class="flex flex-row items-center gap-12 mt-24">
                <div class="flex flex-col gap-2 z-10">
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <i
                            class="fa-solid fa-hat-cowboy text-white !text-4xl group-hover:text-red-600 transition-all"></i>
                    </div>
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                            transform="rotate(0 0 0)">
                            <path
                                d="M17.2321 6.7936C17.7844 6.7936 18.2321 7.24132 18.2321 7.7936C18.2321 8.34589 17.7844 8.7937 17.2321 8.7937C16.6798 8.7937 16.2321 8.34599 16.2321 7.7937C16.2321 7.24142 16.6798 6.7936 17.2321 6.7936Z"
                                fill="white" class="group-hover:fill-red-600 transition-colors duration-300"></path>
                            <path
                                d="M6.7679 10.5436C7.32018 10.5436 7.7679 10.9913 7.7679 11.5436C7.7679 12.0959 7.32018 12.5437 6.7679 12.5437C6.21561 12.5437 5.7679 12.096 5.7679 11.5437C5.7679 10.9914 6.21561 10.5436 6.7679 10.5436Z"
                                fill="white" class="group-hover:fill-red-600 transition-colors duration-300"></path>
                            <path
                                d="M11.4821 11.5436C11.4821 10.9913 11.0344 10.5436 10.4821 10.5436C9.92982 10.5436 9.4821 10.9913 9.4821 11.5436C9.4821 12.0959 9.92982 12.5437 10.4821 12.5437C11.0344 12.5437 11.4821 12.0959 11.4821 11.5436Z"
                                fill="white" class="group-hover:fill-red-600 transition-colors duration-300"></path>
                            <path
                                d="M6.23979 13.7833C6.56384 13.5253 7.03569 13.5788 7.29369 13.9029C7.60645 14.2957 8.08635 14.5453 8.62502 14.5453C9.1637 14.5453 9.6436 14.2957 9.95636 13.9029C10.2144 13.5788 10.6862 13.5253 11.0103 13.7833C11.3343 14.0413 11.3879 14.5131 11.1299 14.8372C10.5447 15.5721 9.63991 16.0453 8.62502 16.0453C7.61014 16.0453 6.7053 15.5721 6.12019 14.8372C5.86219 14.5131 5.91574 14.0413 6.23979 13.7833Z"
                                fill="white" class="group-hover:fill-red-600 transition-colors duration-300"></path>
                            <path fill-rule="evenodd" clip-rule="evenodd"
                                d="M10 5.5C10 4.25736 11.0074 3.25 12.25 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V11.625C20.75 14.5935 18.3435 17 15.375 17C14.8332 17 14.3101 16.9198 13.817 16.7707C13.2024 19.0626 11.1108 20.75 8.625 20.75C5.65647 20.75 3.25 18.3435 3.25 15.375V9.25C3.25 8.00736 4.25736 7 5.5 7H10V5.5ZM11.5 7H11.75C12.0912 7 12.4147 7.07595 12.7044 7.21187C12.8859 6.95862 13.1826 6.7936 13.5179 6.7936C14.0702 6.7936 14.5179 7.24132 14.5179 7.7936C14.5179 8.19772 14.2782 8.54594 13.9332 8.70365C13.9768 8.87856 14 9.06158 14 9.25V10.1798C14.4165 9.98132 14.8828 9.87001 15.375 9.87001C16.3899 9.87001 17.2947 10.3433 17.8799 11.0782C18.1379 11.4022 18.0843 11.8741 17.7603 12.1321C17.4362 12.3901 16.9644 12.3365 16.7064 12.0125C16.3936 11.6196 15.9137 11.37 15.375 11.37C14.8363 11.37 14.3565 11.6196 14.0437 12.0125C14.0297 12.03 14.0152 12.0467 14 12.0627V15.249C14.4273 15.4112 14.8908 15.5 15.375 15.5C17.5151 15.5 19.25 13.7651 19.25 11.625V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H12.25C11.8358 4.75 11.5 5.08579 11.5 5.5V7ZM4.75 9.25C4.75 8.83579 5.08579 8.5 5.5 8.5H11.75C12.1642 8.5 12.5 8.83579 12.5 9.25V15.375C12.5 17.5151 10.7651 19.25 8.625 19.25C6.4849 19.25 4.75 17.5151 4.75 15.375V9.25Z"
                                fill="white" class="group-hover:fill-red-600 transition-colors duration-300"></path>
                        </svg>
                    </div>
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <i class="fa-solid fa-shirt text-white !text-4xl group-hover:text-red-600 transition-all"></i>
                    </div>
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width='80' height="80"
                            xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" version="1.1" id="Capa_1"
                            viewBox="0 0 212.314 212.314" xml:space="preserve">
                            <path
                                d="M168.067,212.314h-55.475c-1.657,0-3-1.343-3-3V79.929l-7.87-0.021v129.406c0,1.657-1.343,3-3,3H44.248  c-1.657,0-3-1.343-3-3V23.089c0-4.119,2.104-7.757,5.292-9.895V3c0-1.657,1.343-3,3-3h114.495c1.657,0,3,1.343,3,3v11.166  c2.471,2.183,4.032,5.375,4.032,8.923v186.225C171.067,210.971,169.724,212.314,168.067,212.314z M115.592,206.314h49.475V49.476  h-1.653c-13.993,0-25.377-11.384-25.377-25.377v-6.915h-16.729v35.048c0,4.586-2.548,8.71-6.65,10.762l-5.499,2.75v8.185  l3.442,0.009c1.653,0.004,2.992,1.346,2.992,3V206.314z M47.248,206.314h48.475V76.9c0-0.797,0.317-1.561,0.882-2.124  c0.563-0.561,1.324-0.876,2.118-0.876c0.003,0,0.005,0,0.008,0l4.428,0.012V17.184h-28.88v6.915  c0,13.993-11.384,25.377-25.377,25.377h-1.653V206.314z M109.158,17.184v41.851l2.815-1.408c2.057-1.029,3.334-3.096,3.334-5.396  V17.184H109.158z M144.037,17.184v6.915c0,10.685,8.692,19.377,19.377,19.377h1.653V23.089c0-3.256-2.649-5.905-5.905-5.905H144.037  z M47.248,43.476h1.653c10.685,0,19.377-8.692,19.377-19.377v-6.915H53.153c-3.256,0-5.905,2.649-5.905,5.905V43.476z   M141.037,11.184h19.998V6H52.54v5.184H141.037z"
                                fill="white" class="group-hover:fill-red-600 transition-colors duration-300"></path>
                        </svg>
                    </div>
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <i
                            class="fa-solid fa-shoe-prints text-white !text-4xl group-hover:text-red-600 transition-all"></i>
                    </div>

                </div>
                <img class=" invert opacity-20 saturate-0 z-5 " src="https://i.imgur.com/DJBH9Ld.png" alt="" srcset="">
                <div class="flex flex-col gap-2 z-10">
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <i class="fa-solid fa-glasses text-white !text-4xl group-hover:text-red-600 transition-all"></i>
                    </div>
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <i class="fa-solid fa-ear text-white !text-4xl group-hover:text-red-600 transition-all"></i>
                    </div>
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <svg class="group-hover:fill-red-500" width="80" height="80" viewBox="0 0 24 25" fill=""
                            xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                            <path
                                d="M5.10991 4.31524L5.11081 4.32053L5.11482 4.3438C5.11853 4.36517 5.12434 4.39813 5.1323 4.4419C5.14821 4.52945 5.17269 4.66015 5.20612 4.82783C5.27301 5.16338 5.37552 5.64592 5.51668 6.2262C5.79992 7.39057 6.23445 8.93052 6.8415 10.4599C7.45342 12.0015 8.21466 13.4651 9.12414 14.5252C10.0306 15.5817 10.9807 16.1249 12.0002 16.1249C13.0197 16.1249 13.9698 15.5817 14.8762 14.5252C15.7857 13.4651 16.5469 12.0015 17.1589 10.4599C17.7659 8.93052 18.2004 7.39057 18.4837 6.2262C18.6248 5.64592 18.7273 5.16338 18.7942 4.82783C18.8277 4.66015 18.8521 4.52945 18.8681 4.4419C18.876 4.39813 18.8818 4.36517 18.8855 4.3438L18.8895 4.32053L18.8904 4.3156C18.9925 3.7029 19.5721 3.28821 20.1849 3.39018C20.7977 3.49218 21.2119 4.07171 21.1099 4.6846L21.1097 4.68616L21.1092 4.68888L21.1077 4.69779L21.1023 4.72919C21.0976 4.75607 21.0908 4.7947 21.0818 4.84432C21.0637 4.94354 21.0369 5.08676 21.0008 5.26771C20.9287 5.62943 20.8195 6.14298 20.6699 6.75802C20.3716 7.98427 19.9083 9.63182 19.2501 11.29C18.5968 12.9359 17.7254 14.6597 16.5838 15.9903C15.7865 16.9196 14.8074 17.7113 13.6378 18.1062C13.7884 18.3795 13.935 18.6656 14.0556 18.9403C14.2101 19.2919 14.3726 19.7328 14.3726 20.1272C14.3726 21.4377 13.3102 22.5 11.9998 22.5C10.6893 22.5 9.62695 21.4377 9.62695 20.1272C9.62695 19.7328 9.78941 19.2919 9.94386 18.9403C10.0646 18.6656 10.2112 18.3793 10.3619 18.1059C9.1926 17.711 8.21365 16.9194 7.41651 15.9903C6.27491 14.6597 5.40353 12.9359 4.75022 11.29C4.09205 9.63182 3.62873 7.98427 3.33044 6.75802C3.18082 6.14299 3.07165 5.62943 2.99954 5.26771C2.96346 5.08676 2.93662 4.94354 2.91858 4.84432C2.90956 4.7947 2.90274 4.75607 2.89807 4.72919L2.89266 4.69779L2.89115 4.68888L2.89044 4.6846C2.78844 4.07171 3.2026 3.49218 3.81549 3.39018C4.42828 3.28821 5.00776 3.70253 5.10991 4.31524Z"
                                fill="white" class="group-hover:fill-red-600 transition-colors duration-300"></path>
                        </svg>
                    </div>
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <i class="fa-solid fa-ring text-white !text-4xl group-hover:text-red-600 transition-all"></i>
                    </div>
                    <div
                        class="flex flex-col w-[120px] h-[120px] text-xl group items-center justify-center aspect-square bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 512 512">
                            <path
                                d="M350.29 21.113l-36.925 85.782 39.828 17.144 36.926-85.782-39.83-17.145zm-188.362.342l-40.115 16.46 35.453 86.4 40.115-16.46-35.452-86.4zm30.898 6.35l-8.133 3.402 28.77 70.133 6.6 16.094-16.08 6.556-40.112 16.46-16.093 6.6-6.6-16.09-28.564-69.59-11.1 4.644a112.952 112.952 0 0 1-18.093 154.4v36.47h93.51v78.048H83.42v14.265h93.51v78.158H83.42v38.338c16.8 16.8 94.695 25.194 172.592 25.194 77.896 0 155.792-8.394 172.592-25.194v-38.338h-93.512V349.21h93.512V334.93h-93.542v-78.147h93.508v-36.46a112.952 112.952 0 0 1-18.093-154.4l-11.34-4.75-30 69.686-6.883 15.986-15.984-6.883-39.774-17.06-15.984-6.883 6.883-15.985 29.683-68.97-7.892-3.26a72.275 72.275 0 0 1-126.36 0zM66 274.182v43.363h93.543v-43.363H66zm286.457 0v43.363H446v-43.363h-93.543zM66 366.605v43.364h93.543v-43.365H66zm286.457 0v43.364H446v-43.365h-93.543z"
                                fill="white" class="group-hover:fill-red-600 transition-colors duration-300"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Secondary Inventory Container -->
            <div v-if="secondaryItems" class="flex flex-col items-center justify-center">
                <div class="flex flex-row items-center gap-16 -mr-4">
                    <div class="flex flex-col w-fit h-full ml-4">
                        <div class="mb-4 h-[4rem]"></div>
                        <div class="flex flex-row w-full items-center gap-1">
                            <span class="text-white text-xl font-normal">Greutate</span>
                            <div class="flex flex-row w-full items-center gap-1">
                                <div class="w-full h-2 bg-white/30 rounded-md">
                                    <div class="h-full bg-gradient-to-r from-red-500 to-red-800 rounded-md"
                                        :style="{ width: `${(totalWeightSecondary / maxWeightSecondary) * 100}%` }">
                                    </div>
                                </div>
                                <span class="text-white text-lg font-normal">{{ totalWeightSecondary }}/{{ maxWeightSecondary }}</span>
                                <span class="text-white text-lg font-normal">KG</span>
                            </div>
                        </div>

                        <!-- Sloturi pentru inventarul secundar -->
                        <div class="grid grid-cols-5 grid-rows-6 gap-2 bg-transparent rounded-lg mt-2 z-[20] w-full">
                            <div v-for="i in totalSecondarySlots" :key="i"
                                :class="['flex flex-col w-[100px] h-[100px] bg-radient-circle-c from-zinc-700/40 border border-zinc-800 to-zinc-950 rounded-md relative', !secondarySlots[i - 1] ? 'droppable' : '']"
                                @contextmenu.prevent="showSecondaryContextMenu($event, i, secondarySlots[i - 1])"
                                @dragover="onDragOver" @drop="onDrop($event, i - 1, 'secondary')">

                                <!-- Dacă slotul e gol, afișează numărul (doar pentru primele 5 sloturi) -->
                                <span v-if="!secondarySlots[i - 1] && i <= 5"
                                    class="absolute inset-0 flex items-center justify-center text-white/20 text-2xl">
                                    {{ i }}
                                </span>

                                <!-- Dacă slotul conține un item, afișează iconița cu drag activat -->
                                <img v-if="secondarySlots[i - 1]" class="w-1/2 draggable h-1/2 absolute inset-0 m-auto"
                                    :src="getIconByName(secondarySlots[i - 1].name)" :alt="secondarySlots[i - 1].label" draggable="true"
                                    @dragstart="onDragStart($event, i - 1, 'secondary')" @dragend="onDragEnd" />

                                <!-- Afișează cantitatea itemului -->
                                <span v-if="secondarySlots[i - 1]"
                                    class="absolute bottom-1 right-1 text-white text-sm bg-black/70 px-1 rounded">
                                    {{ secondarySlots[i - 1].amount }}
                                </span>
                            </div>
                          
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.draggable.dragging {
    opacity: 0.5;
}
</style>
