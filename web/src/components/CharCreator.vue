<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
//@ts-ignore
import '@cyhnkckali/vue3-color-picker/dist/style.css';

import CustomSlider from './CustomSlider.vue';

// Refs for Character Data
const shownewcreate = ref(false);
const playerName = ref('');
const lastName = ref('');
const firstName = ref('');
const age = ref('');
const height = ref('');
const model = ref('mp_m_freemode_01');

// Refs for Appearance
const father = ref(0);
const mother = ref(0);
const similarity = ref(0); //  -100 to 100, 0 is center

// Character Edit View State
const characterEditView = ref('');

// Feature and Appearance Configuration
const featureNames = ['Nose Width', 'Nose Bottom Height', 'Nose Tip Length', 'Nose Bridge Depth', 'Nose Tip Height', 'Nose Broken', 'Brow Height', 'Brow Depth', 'Cheekbone Height', 'Cheekbone Width', 'Cheek Depth', 'Eye Size', 'Lip Thickness', 'Jaw Width', 'Jaw Shape', 'Chin Height', 'Chin Depth', 'Chin Width', 'Chin Indent', 'Neck Width'];
const appearanceNames = ['Blemishes', 'Facial Hair', 'Eyebrows', 'Ageing', 'Makeup', 'Blush', 'Complexion', 'Sun Damage', 'Lipstick', 'Moles & Freckles', 'Chest Hair'];
const features = ref(Array(featureNames.length).fill(0));

// Component and Prop Definitions & Data
const COMPONENT_DEFS = {
    0: 'Fata',
    1: 'Masti',
    2: 'Par',
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
    max_drawable?: number; // Add max_drawable and max_texture if available from server
    max_texture?: number;
}

interface PropData {
    prop_id: number;
    drawable: number;
    texture: number;
    max_drawable?: number; // Add max_drawable and max_texture if available from server
    max_texture?: number;
}

const currentComponents = ref<ComponentData[]>([]);
const currentProps = ref<PropData[]>([]);

const receivedComponents = ref<ComponentData[]>([]);
const receivedProps = ref<PropData[]>([]);

// External Game Event Handlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const mp: any;

// Functions interacting with external script (RageMP or similar)
function setModel(newModel: string) {
    model.value = newModel;
    mp.trigger('cl:setModel', newModel);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateColor(index: number, value: any) {
    mp.trigger('cl:updateColor', index, value);
}

function createCharacter() {
    // Input validation
    if (!lastName.value.trim()) {
        alert("Please enter a last name.");
        return;
    }
    if (!firstName.value.trim()) {
        alert("Please enter a first name.");
        return;
    }
    if (!age.value.trim() || isNaN(Number(age.value))) {
        alert("Please enter a valid age (must be a number).");
        return;
    }
    if (!height.value.trim() || isNaN(Number(height.value))) {
        alert("Please enter a valid height (must be a number).");
        return;
    }


    mp.trigger('cl:createCharacter', model.value, lastName.value, firstName.value, age.value, height.value);
    // Hide the character creation menu
    shownewcreate.value = false;
}

function updateFather(val: number) {
    father.value = val;
    debouncedUpdateCharacterAppearance();
}
const debouncedUpdateFeature = debounce((index: number, value: number) => {
    features.value[index] = value;
    mp.trigger('cl:updateFeature', index, value);
    console.log(`Feature ${index} updated to ${value}`);
}, 300);

function updateFeature(index: number, value: number) {
    debouncedUpdateFeature(index, value);
}



const debouncedUpdateAppearance = debounce((index: number, value: number) => {
    mp.trigger('cl:updateAppearance', index, value);
    console.log(`Appearance ${index} updated to ${value}`);
}, 300);

function updateAppearance(index: number, value: number) {
    debouncedUpdateAppearance(index, value);
}

function updateMother(val: number) {
    mother.value = val;
    debouncedUpdateCharacterAppearance();
}
//@ts-ignore
import { debounce } from 'lodash';

const debouncedUpdateCharacterAppearance = debounce(updateCharacterAppearance, 300);

function updateSimilarity(val: number) {
    similarity.value = val;
    debouncedUpdateCharacterAppearance();
}

function updateCharacterAppearance() {
    console.log(`Father: ${father.value}, Mother: ${mother.value}, Similarity: ${similarity.value}`);
    mp.trigger('cl:updateCharacterAppearance', father.value, mother.value, similarity.value);
}

function openClothesMenu() {
    mp.trigger('cl:openClothes');
}
function updateComponentDrawable(componentId: number, drawableChange: number) {
    const componentIndex = currentComponents.value.findIndex(comp => comp.component_id === componentId);
    if (componentIndex !== -1) {
        const component = currentComponents.value[componentIndex];
        const maxDrawable = component.max_drawable ?? 0; // Default to 0 if not provided
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
    let isHair = componentId === 2;
    
    const componentIndex = currentComponents.value.findIndex(comp => comp.component_id === componentId);
    if (componentIndex !== -1) {
        const component = currentComponents.value[componentIndex];
        let maxTexture = component.max_texture ?? 0;
        let newTexture = component.texture + textureChange;
        if(isHair) maxTexture = 64;

        if (newTexture > maxTexture) {
            newTexture = -1;
        } else if (newTexture < -1) {
            newTexture = -1;
        }

        component.texture = newTexture;
        if(isHair){
            //update color
            mp.trigger('cl:updateHairColor',  newTexture);
        }else{
            mp.trigger('cl:updateComponent', componentId, component.drawable, newTexture);
        }
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


mp.events.add('showCharCreator', (data: any) => {
    data = JSON.parse(data)
    shownewcreate.value = true;
    playerName.value = data.name;
});

mp.events.add('clothesData', (comps: any, props: any) => {
    

    const components = JSON.parse(comps);
    const properties = JSON.parse(props);

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

    characterEditView.value = 'x';
});

</script>

<template>
    <div v-show="shownewcreate"
        class="w-screen h-screen bg-radient-circle-c from-transparent via-black/70 to-black absolute top-0 flex flex-col p-12">
        <span class="text-white text-4xl font-medium">Bine ai venit, {{ playerName }}</span>
        <span class="text-white/30 text-sm font-light w-[40rem]">Pentru a continua si a te alatura celorlalti jucatori,
            va trebuii
            sa iti creezi caracterul. De aici iti poti alege sexul, un nume, prenume, varsta si inaltimea caracterului
            tau. Toate aceste informatii te vor afecta in roleplay-urile in care vei fi implicat, asa ca AI GRIJA cum le
            completezi. De asemenea, numele puse la caterinca, ce nu respecta o norma de realitate, vor rezulta la
            BAN!</span>
        <div class="flex flex-row items-center gap-2 mt-2">
            <i class="fas fa-info-circle text-white/30 text-xl "></i>
            <span class="text-white/40 text-lg font-light">Tine click stanga apasat pentru a misca camera!</span>
        </div>
        <div class="w-full h-full flex flex-row items-center justify-between">
            <div class="h-full w-[40rem] bg-white/0 mt-16 flex flex-col">
                <!-- gender icon -->
                <div class="flex flex-row items-center gap-4">
                    <i class="fas fa-venus-mars text-3xl text-pink-400"></i>
                    <span class="text-white text-2xl font-medium">Sexul caracterului</span>
                </div>

                <div class="flex flex-row items-center gap-3">
                    <button @click="() => {
                        setModel('mp_m_freemode_01')
                    }" class=" action-button w-[6rem] mt-4 h-[6rem] rounded-lg flex items-center justify-center
                    bg-radient-circle-c group from-transparent to-zinc-900 border border-zinc-700/40 hover:to-pink-950/20
                    hover:border-pink-900/40 active:to-pink-950/20 active:border-pink-900/40 active:text-pink-500
                    transition-all">
                        <i
                            class="fa-solid text-2xl fa-mars text-white group-hover:text-white group-active:text-white transition-all"></i>
                    </button>

                    <!-- vertical line in between -->
                    <div class="w-[1px] h-[3rem] -mb-4 bg-white/10"></div>

                    <button @click="() => {
                        setModel('mp_f_freemode_01')
                    }" class=" action-button w-[6rem] mt-4 h-[6rem] rounded-lg flex items-center justify-center
                    bg-radient-circle-c group from-transparent to-zinc-900 border border-zinc-700/40 hover:to-pink-950/20
                    hover:border-pink-900/40 active:to-pink-950/20 active:border-pink-900/40 active:text-pink-500
                    transition-all">
                        <i
                            class="fa-solid text-2xl fa-venus text-white group-hover:text-white group-active:text-white transition-all"></i>
                    </button>

                    <!-- info icon -->
                    <div class="flex flex-row items-center gap-2">
                        <i class="fas fa-info-circle text-white/30 text-xl ml-16"></i>
                        <span class="text-white/40 text-lg font-light">Selecteaza cu atentie, iti va afecta
                            roleplayurile!</span>
                    </div>
                </div>
                <div class="flex flex-row mt-16 items-center gap-4">
                    <i class="fas fa-passport text-3xl text-pink-400"></i>
                    <span class="text-white text-2xl font-medium">Identitatea caracterului</span>
                </div>

                <div class="flex flex-col gap-2 mt-2">

                    <div
                        class="bg-radient-circle-c flex flex-row items-center gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                        <i class="fas fa-user text-white/40 text-2xl ml-4"></i>
                        <input v-model="lastName" type="text" placeholder="Numele de familie"
                            class="bg-transparent text-white/40 text-lg w-[20rem] outline-none" />
                    </div>
                    <div
                        class="bg-radient-circle-c flex flex-row items-center gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                        <i class="fas fa-user text-white/40 text-2xl ml-4"></i>
                        <input v-model="firstName" type="text" placeholder="Prenumele"
                            class="bg-transparent outline-none text-white/40 text-lg w-[20rem]" />
                    </div>
                    <div class="flex flex-row items-center gap-2 mt-2">
                        <i class="fas fa-info-circle text-white/30 text-xl "></i>
                        <span class="text-white/40 text-lg font-light">Foloseste un nume cat mai real si
                            autentic.</span>
                    </div>
                    <div
                        class="bg-radient-circle-c flex flex-row items-center gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                        <i class="fas fa-hashtag text-white/40 text-2xl ml-4"></i>
                        <input v-model="age" type="text" placeholder="Varsta"
                            class="bg-transparent outline-none text-white/40 text-lg w-[20rem]" />
                    </div>
                    <div
                        class="bg-radient-circle-c flex flex-row items-center gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                        <i class="fas fa-ruler text-white/40 text-2xl ml-4"></i>
                        <input v-model="height" type="text" placeholder="Inaltime"
                            class="bg-transparent outline-none text-white/40 text-lg w-[20rem]" />
                    </div>

                    <!-- Button -->
                    <button @click="createCharacter" class="bg-radient-circle-c from-pink-600 to-pink-500 w-[25rem] h-[5rem] rounded-md mt-4
                    flex items-center justify-center text-white text-lg font-medium hover:from-pink-950 hover:to-pink-900
                    transition-all">
                        Creeaza caracterul
                    </button>
                </div>
            </div>
            <div class="h-full w-[40rem] bg-white/0 mt-16 flex flex-col items-end z-10 justify-start">
                <div class="flex flex-row items-start w-fit h-fit  gap-10">
                    <div v-if="characterEditView === 'inheritance'"
                        class="flex flex-col gap-2 w-fit h-fit bg-white/0 z-10">
                        <div class="flex flex-row items-center gap-1">
                            <i class="fas fa-user text-3xl text-pink-400"></i>
                            <span class="text-white text-xl font-medium">Trasaturi</span>
                        </div>
                        <div
                            class="bg-radient-circle-c p-3 flex flex-row items-center justify-between mt-3 gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                            <div class="flex flex-col">
                                <span class="text-white text-lg font-bold">Tata</span>
                            </div>
                            <!-- arrows(left, right, same design as buttons below) -->
                            <div class="flex flex-row items-center gap-2">
                                <button @click="updateFather(father - 1)"
                                    class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-pink-500 hover:bg-pink-500  transition-all border-2 border-white/10">
                                    <i class="fas fa-arrow-left text-2xl"></i>
                                </button>
                                <button @click="updateFather(father + 1)"
                                    class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-pink-500 hover:bg-pink-500  transition-all border-2 border-white/10">
                                    <i class="fas fa-arrow-right text-2xl"></i>
                                </button>
                            </div>
                        </div>
                        <div
                            class="bg-radient-circle-c p-3 flex flex-row items-center justify-between mt-3 gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                            <div class="flex flex-col">
                                <span class="text-white text-lg font-bold">Mama</span>
                            </div>
                            <!-- arrows(left, right, same design as buttons below) -->
                            <div class="flex flex-row items-center gap-2">
                                <button @click="updateMother(mother - 1)"
                                    class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-pink-500 hover:bg-pink-500  transition-all border-2 border-white/10">
                                    <i class="fas fa-arrow-left text-2xl"></i>
                                </button>
                                <button @click="updateMother(mother + 1)"
                                    class="flex flex-row items-center justify-center rounded-lg w-[3rem] h-[3rem] text-white hover:border-pink-500 hover:bg-pink-500  transition-all border-2 border-white/10">
                                    <i class="fas fa-arrow-right text-2xl"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-row items-center gap-2 mt-3">
                            <i class="fas fa-user text-3xl text-pink-400"></i>
                            <span class="text-white text-xl font-medium">Asemanare trasaturi</span>
                        </div>
                        <div
                            class="bg-radient-circle-c p-3 flex flex-col items-center justify-between mt-3 gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                            <div class="flex flex-row w-full justify-between">
                                <span class="text-white text-sm font-bold">Tata</span>
                                <span class="text-white text-sm font-bold">Mama</span>
                            </div>
                            <!-- progress bar with thumb centered, can go to minus or plus -->
                            <!-- Use v-model for two-way binding -->
                            <CustomSlider :min="-1" :max="1" v-model="similarity"
                                @update:modelValue="updateSimilarity" />
                        </div>
                    </div>
                    <div v-else-if="characterEditView === 'features'"
                        class="flex flex-col gap-2 w-fit h-fit bg-white/0 z-10">
                        <div class="flex flex-row items-center gap-1">
                            <i class="fas fa-face-smile text-3xl text-pink-400"></i>
                            <span class="text-white text-xl font-medium">Trasaturi faciale</span>
                        </div>
                        <span class="text-white/40 text-lg font-light">Foloseste slider-ul pentru a modifica trasaturile
                            faciale ale caracterului tau.</span>
                        <!-- v-for for all features defined, customslider to change -->
                        <div class="flex flex-col items-end w-full h-[40rem] p-2 overflow-y-scroll">
                            <div v-for="(feature, index) in featureNames" :key="index" class="flex flex-col gap-2 mt-2">
                                <span class="text-white text-lg font-bold">{{ feature }}</span>
                                <div
                                    class="bg-radient-circle-c p-3 flex flex-col items-center justify-between mt-3 gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                                    <div class="flex flex-row w-full justify-between">
                                        <span class="text-white text-sm font-bold">Min</span>
                                        <span class="text-white text-sm font-bold">Max</span>
                                    </div>
                                    <!-- progress bar with thumb centered, can go to minus or plus -->
                                    <!-- Use v-model for two-way binding -->
                                    <CustomSlider :min="-1" :max="1" v-model="features[index]"
                                        @update:modelValue="updateFeature(index, $event)" />
                                </div>


                            </div>
                        </div>


                    </div>
                    <div v-else-if="characterEditView === 'appearance'"
                        class="flex flex-col gap-2 w-fit h-fit bg-white/0 z-10">
                        <div class="flex flex-row items-center gap-1">
                            <i class="fas fa-face-smile text-3xl text-pink-400"></i>
                            <span class="text-white text-xl font-medium">Aparenta</span>
                        </div>
                        <span class="text-white/40 text-lg font-light">Fa-ti caracterul sa arate asa cum vrei tu!</span>

                        <div class="flex flex-col items-end w-full h-[40rem] p-2 overflow-y-scroll">
                            <div v-for="(appearance, index) in appearanceNames" :key="index"
                                class="flex flex-col gap-2 mt-2">
                                <span class="text-white text-lg font-bold">{{ appearance }}</span>
                                <div
                                    class="bg-radient-circle-c p-3 flex flex-col items-center justify-between mt-3 gap-4 from-neutral-900/10 to-neutral-900 rounded-md border border-white/10 w-[25rem] h-[5rem]">
                                    <div class="flex flex-row w-full justify-between">
                                        <span class="text-white text-sm font-bold">Min</span>
                                        <span class="text-white text-sm font-bold">Max</span>
                                    </div>
                                    <!-- progress bar with thumb centered, can go to minus or plus -->
                                    <!-- Use v-model for two-way binding -->
                                    <CustomSlider :min="-30" :max="30" v-model="features[index]"
                                        @update:modelValue="updateAppearance(index, $event)" />

                                    <!-- div to show for certain appearances(facial hair, eyebrows) -->

                                </div>
                                <div v-if="appearance === 'Facial Hair' || appearance === 'Eyebrows' || appearance === 'Makeup' || appearance === 'Chest Hair' || appearance === 'Blush' || appearance === 'Lipstick' || appearance === 'Freckles'"
                                    class="flex flex-row items-center gap-4 mt-2">
                                    <!-- color picker -->
                                    <CustomSlider :min="0" :max="64" v-model="features[index]"
                                        @update:modelValue="updateColor(index, $event)" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="characterEditView === 'x'"
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
                        <button @click="characterEditView = 'inheritance'"
                            class="flex flex-row items-center justify-center z-10 hover:cursor-pointer rounded-lg w-[5rem] h-[5rem] text-white hover:border-pink-500 hover:bg-pink-500 active:bg-pink-500 focus:bg-pink-500 transition-all border-2 border-white/10">
                            <i class="fas fa-face-smile text-2xl"></i>
                        </button>
                        <button @click="characterEditView = 'features'"
                            class="flex flex-row items-center justify-center z-10 hover:cursor-pointer rounded-lg w-[5rem] h-[5rem] text-white hover:border-pink-500 hover:bg-pink-500 focus:bg-pink-500 transition-all border-2 border-white/10">
                            <i class="fas fa-head-side text-2xl"></i>
                        </button>
                        <button @click="characterEditView = 'appearance'"
                            class="flex flex-row items-center justify-center z-10 hover:cursor-pointer rounded-lg w-[5rem] h-[5rem] text-white hover:border-pink-500 hover:bg-pink-500 focus:bg-pink-500 transition-all border-2 border-white/10">
                            <i class="fas fa-eye text-2xl"></i>
                        </button>
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

<style scoped>

::-webkit-scrollbar {
    display: none;
}
</style>