<script setup lang="ts">
import { ref } from 'vue';
//@ts-ignore
import '@cyhnkckali/vue3-color-picker/dist/style.css';

// Component and Prop Definitions & Data
const COMPONENT_DEFS = {
    0: 'Fata',
    1: 'Masti',
    // 2: 'Par',  <- Removed Hair
    3: 'Corp/Maini',
    4: 'Picioare',
    5: 'Genti',
    6: 'Incaltaminte',
    7: 'Accesorii',
    8: 'Sub-tricou',
    9: 'Armuri',
    10: 'Badge',
    11: 'Jachete'
} as never;

const PROPS_DEFS = {
    0: 'Palarii',
    1: 'Ochelari',
    2: 'Cercei',
    6: 'Bratari',
    7: 'Ceasuri',
} as never;

interface ComponentData {
    component_id: number;
    drawable: number;
    texture: number;
    max_drawable?: number;
    max_texture?: number;
}

interface PropData {
    prop_id: number;
    drawable: number;
    texture: number;
    max_drawable?: number;
    max_texture?: number;
}

const currentComponents = ref<ComponentData[]>([]);
const currentProps = ref<PropData[]>([]);

const receivedComponents = ref<ComponentData[]>([]);
const receivedProps = ref<PropData[]>([]);

// External Game Event Handlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const mp: any;

const showClothingShop = ref(false);

function updateComponentDrawable(componentId: number, drawableChange: number) {
    const componentIndex = currentComponents.value.findIndex(comp => comp.component_id === componentId);
    if (componentIndex !== -1) {
        const component = currentComponents.value[componentIndex];
        const maxDrawable = component.max_drawable ?? 0;
        let newDrawable = component.drawable + drawableChange;

        if (newDrawable > maxDrawable) {
            newDrawable = -1;
        } else if (newDrawable < -1) {
            newDrawable = -1;
        }

        component.drawable = newDrawable;
        component.texture = 0;
        mp.trigger('cl:updateComponent', componentId, newDrawable, 0);
    }
}

function updateComponentTexture(componentId: number, textureChange: number) {
    const componentIndex = currentComponents.value.findIndex(comp => comp.component_id === componentId);
    if (componentIndex !== -1) {
        const component = currentComponents.value[componentIndex];
        const maxTexture = component.max_texture ?? 0;
        let newTexture = component.texture + textureChange;

        if (newTexture > maxTexture) {
            newTexture = -1;
        } else if (newTexture < -1) {
            newTexture = -1;
        }

        component.texture = newTexture;
        mp.trigger('cl:updateComponent', componentId, component.drawable, newTexture);
    }
}

function updatePropDrawable(propId: number, drawableChange: number) {
    const propIndex = currentProps.value.findIndex(prop => prop.prop_id === propId);
    if (propIndex !== -1) {
        const prop = currentProps.value[propIndex];
        const maxDrawable = prop.max_drawable ?? 0;
        let newDrawable = prop.drawable + drawableChange;

        if (newDrawable > maxDrawable) {
            newDrawable = -1;
        } else if (newDrawable < -1) {
            newDrawable = -1;
        }

        prop.drawable = newDrawable;
        prop.texture = 0;
        mp.trigger('cl:updateProp', propId, newDrawable, 0);
    }
}

function updatePropTexture(propId: number, textureChange: number) {
    const propIndex = currentProps.value.findIndex(prop => prop.prop_id === propId);
    if (propIndex !== -1) {
        const prop = currentProps.value[propIndex];
        const maxTexture = prop.max_texture ?? 0;
        let newTexture = prop.texture + textureChange;

        if (newTexture > maxTexture) {
            newTexture = -1;
        } else if (newTexture < -1) {
            newTexture = -1;
        }

        prop.texture = newTexture;
        mp.trigger('cl:updateProp', propId, prop.drawable, newTexture);
    }
}

function switchCamera(view: string) {
    mp.trigger('cl:switchCamera', view);
}

// Event to show the clothing shop
mp.events.add('showClothingShop', (comps: any, props: any) => {
    const components = JSON.parse(comps);
    const properties = JSON.parse(props);

    receivedComponents.value = components.map((comp: any) => ({
        component_id: comp.component_id,
        drawable: comp.drawable,
        texture: comp.texture,
        max_drawable: comp.max_drawable,
        max_texture: comp.max_texture
    }));

    receivedProps.value = properties.map((prop: any) => ({
        prop_id: prop.prop_id,
        drawable: prop.drawable,
        texture: prop.texture,
        max_drawable: prop.max_drawable,
        max_texture: prop.max_texture
    }));

    currentComponents.value = [...receivedComponents.value];
    currentProps.value = [...receivedProps.value];
    showClothingShop.value = true;
});

// Event to close the clothing shop
function closeClothingShop() {
    showClothingShop.value = false;
    mp.trigger('cl:closeClothingShop');
}

mp.events.add('clothData', (comps: any, props: any) => {
    

    let components = JSON.parse(comps);
    const properties = JSON.parse(props);

    //remove component_id 2
    components = components.filter((comp: any) => comp.component_id !== 2);

    receivedComponents.value = components.map((comp: any) => ({
        component_id: comp.component_id,
        drawable: comp.drawable, // Use current drawable
        texture: comp.texture, // Use current texture
        max_drawable: comp.max_drawable, // Maximum drawable for limiting
        max_texture: comp.max_texture // Maximum texture for limiting
    }));

    receivedProps.value = properties.map((prop: any) => ({
        prop_id: prop.prop_id,
        drawable: prop.drawable, // Use current drawable
        texture: prop.texture, // Use current texture
        max_drawable: prop.max_drawable, // Maximum drawable for limiting
        max_texture: prop.max_texture // Maximum texture for limiting
    }));

    currentComponents.value = [...receivedComponents.value]; // Copy initial state
    currentProps.value = [...receivedProps.value]; // Copy initial state
});


function openClothesMenu() {
    mp.trigger('cl:openCloth');
}

function saveClothing() {
    mp.trigger('cl:saveClothing');
    showClothingShop.value = false;
}


</script>

<template>
    <div v-show="showClothingShop"
        class="w-screen h-screen bg-radient-circle-c from-transparent via-black/70 to-black absolute top-0 flex flex-col p-12 z-10">
        <span class="text-white text-4xl font-medium">Clothing Shop</span>
        
        <div class="w-full h-full flex flex-row items-center justify-between">
            <div class="h-full w-[40rem] bg-white/0 mt-16 flex flex-col">

               

                <div class="flex flex-col gap-2 mt-2">
                    <!-- Button -->
                    <button @click="saveClothing" class="bg-radient-circle-c from-pink-600 to-pink-500 w-[25rem] h-[5rem] rounded-md mt-4
                    flex items-center justify-center text-white text-lg font-medium hover:from-pink-950 hover:to-pink-900
                    transition-all">
                        Salveaza si continua
                    </button>
                </div>
            </div>
            <div class="h-full w-[40rem] bg-white/0 mt-16 flex flex-col items-end z-10 justify-start">
                <div class="flex flex-row items-start w-fit h-fit  gap-10">
                    <div 
                        class="flex flex-col gap-2 w-fit h-fit bg-white/0 !z-[100000000]">
                        <div class="flex flex-row items-center gap-1">
                            <i class="fas fa-tshirt text-3xl text-pink-400"></i>
                            <span class="text-white text-xl font-medium">Clothing</span>
                        </div>
                        <span class="text-white/40 text-lg font-light">Modifica-ti hainele si accesoriile!</span>

                        <div class="flex flex-col items-end w-full h-[40rem] p-2 overflow-y-scroll">
                            <div v-for="component in currentComponents" :key="component.component_id"
                                class="flex flex-col gap-2 mt-2">
                                <span class="text-white text-lg font-bold">{{ COMPONENT_DEFS[component.component_id]
                                }}</span>
                                <div
                                    class="bg-radient-circle-c p-3 flex flex-row items-center justify-between mt-3 gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                                    <div class="flex flex-col">
                                        <span class="text-white text-sm font-bold">Drawable: {{ component.drawable
                                        }}</span>
                                        <span class="text-white text-sm font-bold">Texture: {{ component.texture }}</span>
                                    </div>
                                    <div class="flex flex-row items-center gap-2">
                                        <button @click="updateComponentDrawable(component.component_id, -1)"
                                            class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-pink-500 hover:bg-pink-500 transition-all border-2 border-white/10">
                                            <i class="fas fa-arrow-left text-2xl"></i>
                                        </button>
                                        <button @click="updateComponentDrawable(component.component_id, 1)"
                                            class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-pink-500 hover:bg-pink-500 transition-all border-2 border-white/10">
                                            <i class="fas fa-arrow-right text-2xl"></i>
                                        </button>
                                    </div>
                                    <div class="flex flex-row items-center gap-2">
                                        <button @click="updateComponentTexture(component.component_id, -1)"
                                            class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-blue-500 hover:bg-blue-500 transition-all border-2 border-white/10">
                                            <i class="fas fa-arrow-left text-2xl"></i>
                                        </button>
                                        <button @click="updateComponentTexture(component.component_id, 1)"
                                            class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-blue-500 hover:bg-blue-500 transition-all border-2 border-white/10">
                                            <i class="fas fa-arrow-right text-2xl"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div v-for="prop in currentProps" :key="prop.prop_id" class="flex flex-col gap-2 mt-2">
                                <span class="text-white text-lg font-bold">{{ PROPS_DEFS[prop.prop_id] }}</span>
                                <div
                                    class="bg-radient-circle-c p-3 flex flex-row items-center justify-between mt-3 gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                                    <div class="flex flex-col">
                                        <span class="text-white text-sm font-bold">Drawable: {{ prop.drawable }}</span>
                                        <span class="text-white text-sm font-bold">Texture: {{ prop.texture }}</span>
                                    </div>
                                    <div class="flex flex-row items-center gap-2">
                                        <button @click="updatePropDrawable(prop.prop_id, -1)"
                                            class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-pink-500 hover:bg-pink-500 transition-all border-2 border-white/10">
                                            <i class="fas fa-arrow-left text-2xl"></i>
                                        </button>
                                        <button @click="updatePropDrawable(prop.prop_id, 1)"
                                            class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-pink-500 hover:bg-pink-500 transition-all border-2 border-white/10">
                                            <i class="fas fa-arrow-right text-2xl"></i>
                                        </button>
                                    </div>
                                    <div class="flex flex-row items-center gap-2">
                                        <button @click="updatePropTexture(prop.prop_id, -1)"
                                            class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-blue-500 hover:bg-blue-500 transition-all border-2 border-white/10">
                                            <i class="fas fa-arrow-left text-2xl"></i>
                                        </button>
                                        <button @click="updatePropTexture(prop.prop_id, 1)"
                                            class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-blue-500 hover:bg-blue-500 transition-all border-2 border-white/10">
                                            <i class="fas fa-arrow-right text-2xl"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div class="flex flex-col gap-2 w-fit h-fit bg-white/0 z-10">
                        <!-- clothing -->
                        <button @click="openClothesMenu"
                            class="flex flex-row items-center justify-center z-10 hover:cursor-pointer rounded-lg w-[5rem] h-[5rem] text-white hover:border-pink-500 hover:bg-pink-500 focus:bg-pink-500 transition-all border-2 border-white/10">
                            <i class="fas fa-tshirt text-2xl"></i>
                        </button>

                        <!-- separator -->
                        <div class="w-[5rem] h-[1px] mt-3 bg-white/30"></div>

                        <!-- head -->
                        <button @click="switchCamera('head')"
                            class="flex flex-row items-center justify-center z-10 hover:cursor-pointer rounded-lg w-[5rem] h-[5rem] text-white hover:border-pink-500 hover:bg-pink-500 focus:bg-pink-500 transition-all border-2 border-white/10">
                            <i class="fas fa-head-side text-2xl"></i>
                        </button>

                        <!-- body -->
                        <button @click="switchCamera('body')"
                            class="flex flex-row items-center justify-center z-10 hover:cursor-pointer rounded-lg w-[5rem] h-[5rem] text-white hover:border-pink-500 hover:bg-pink-500 focus:bg-pink-500 transition-all border-2 border-white/10">
                            <i class="fas fa-child text-2xl"></i>
                        </button>

                        <!-- legs -->
                        <button @click="switchCamera('legs')"
                            class="flex flex-row items-center justify-center z-10 hover:cursor-pointer rounded-lg w-[5rem] h-[5rem] text-white hover:border-pink-500 hover:bg-pink-500 focus:bg-pink-500 transition-all border-2 border-white/10">
                            <i class="fas fa-shoe-prints text-2xl"></i>
                        </button>

                    </div>
                </div>

            </div>
        </div>

    </div>

</template>