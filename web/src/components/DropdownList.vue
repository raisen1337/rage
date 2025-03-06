<script setup lang="ts">
import { ref, defineExpose, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{ options: string[] }>();
const emit = defineEmits(['select', 'close']);

const isOpen = ref(false);
const selectedOption = ref(0);
const dropdownContainer = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
    if (!isOpen.value) {
        emit('close');
    }
};

declare const mp: any;

const selectOption = (index: number) => {
    selectedOption.value = index;
    isOpen.value = false;
    // Emitem atât indexul cât și valoarea opțiunii
    emit('select', { index, value: props.options[index] });
    dropdownContainer.value?.blur();
    emit('close');
    // mp.trigger('cl:log', 'selectOption')
};
const handleDropdownKeyDown = (key: string) => {
    if (!isOpen.value) return;
    if (key === "ArrowDown") {
        selectedOption.value = (selectedOption.value + 1) % props.options.length;
    } else if (key === "ArrowUp") {
        selectedOption.value =
            (selectedOption.value - 1 + props.options.length) % props.options.length;
    } else if (key === "Enter") {
        selectOption(selectedOption.value);
    }
};

const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        toggleDropdown();
    } else {
        handleDropdownKeyDown(event.key);
    }
};

const focusDropdown = () => {
    if (dropdownContainer.value) {
        // mp.trigger('cl:log', 'focusDropdown');
        dropdownContainer.value.focus();
    }
};

//

onMounted(() => {
    if (dropdownContainer.value) {
        dropdownContainer.value.addEventListener("keydown", handleKeyDown);
    }
});

onBeforeUnmount(() => {
    if (dropdownContainer.value) {
        dropdownContainer.value.removeEventListener("keydown", handleKeyDown);
    }
});

defineExpose({ toggleDropdown, handleDropdownKeyDown, isOpen, selectedOption, focusDropdown });
</script>

<template>
    <div class="relative w-40" tabindex="0" ref="dropdownContainer">
        <div
            class="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 cursor-pointer"
            @click="toggleDropdown"
        >
            <span class="text-white">{{ props.options[selectedOption] }}</span>
            <i class="fas fa-chevron-down text-white/50"></i>
        </div>

        <transition name="fade">
            <ul
                v-if="isOpen"
                class="absolute left-0 mt-2 w-full bg-zinc-900/90 rounded-lg p-2 shadow-lg z-50"
            >
                <li
                    v-for="(option, index) in props.options"
                    :key="index"
                    @click="selectOption(index)"
                    :class="{ 'bg-zinc-700/80': index === selectedOption }"
                    class="p-2 rounded-lg hover:bg-zinc-700/80 text-white cursor-pointer"
                >
                    {{ option }}
                </li>
            </ul>
        </transition>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}
</style>