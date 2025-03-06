<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from "vue";
import DropdownList from "./DropdownList.vue";
//@ts-ignore
import ColorPicker from "./ColorPicker.vue"; // Import the ColorPicker

const selectedItem = ref<any>(null);
const isAnyDropdownOpen = ref(false);
const isColorPickerOpen = ref(false); // Track color picker visibility
const menuData = ref<any>(false);
const dropdownRefs = ref<any>({});
const menuStack = ref<any[]>([]); // Stack to store previous menus

const menuContainerRef = ref<HTMLElement | null>(null); // Ref for the scrollable container

// Computed property for menu height (adjust as needed)
const menuHeight = computed(() => {
  return "300px"; // Example fixed height, change as needed
});

// Funcție pentru verificarea stării dropdown-urilor
const checkDropdownState = () => {
  for (const key in dropdownRefs.value) {
    if (dropdownRefs.value[key]?.isOpen?.value) {
      isAnyDropdownOpen.value = true;
      return;
    }
  }
  isAnyDropdownOpen.value = false;
  return;
};

const handleLeft = () => {
  if (isAnyDropdownOpen.value) return;

  if (selectedItem.value !== null) {
    const item = menuData.value.items[selectedItem.value];
    if (item.type === "number" && item.value > item.min) {
      item.value--;
    } else if (item.type === "array" && item.value > 0) {
      item.value--;
    }
  }
};

const handleRight = () => {
  if (selectedItem.value !== null) {
    const item = menuData.value.items[selectedItem.value];
    if (item.type === "number") {
      if (item.value < item.max) {
        item.value++;
      }
    } else if (item.type === "array") {
      if (item.value < item.options.length - 1) {
        item.value++;
      }
    }
  }
};

const handleEnter = () => {
  if (selectedItem.value !== null) {
    const item = menuData.value.items[selectedItem.value];
    if (item.type === "dropdown") {
      if (document.querySelector('#dropdown')) {
        (document.querySelector('#dropdown') as HTMLElement)?.focus();
      }
      const dropdown = selectedItem.value !== null ? dropdownRefs.value[selectedItem.value] : null;
      if (dropdown) {
        if (!dropdown.isOpen.value) {
          dropdown.toggleDropdown();
          dropdown.focusDropdown();
          checkDropdownState();
        } else {
          dropdown.handleDropdownKeyDown("Enter");
        }
      }
    } else if (item.type === "colorpicker") {
        isColorPickerOpen.value = true;  // Show the color picker
        mp.trigger('mouseShowCursor', true); // Show cursor
    }
    // Removed else if and the callback call
    else {
      //CHECK IF TYPE IS array
      let selected = 1;
      if (item.type === "array") selected = item.value;


      
      let dataToSendToServer = {
        id: item.id,
        menuId: menuData.value.id,
        type: item.type || 'Default',
        text: item.text,
        value: item.type === 'array' ? selected : item.value ?? item.id
      }

      mp.trigger('cl:menuSelect', JSON.stringify(dataToSendToServer));
    }
  }
};

declare const mp: any;

// --- Modified showMenu to handle menu stack ---

mp.events.add('cl:closeAllMenus', () => {
    menuStack.value = []; // Clear the stack
    menuData.value = false; // Close the menu
});

let NUI_LOCK = false

mp.events.add('focus', (locked: boolean, hasCursor: boolean) => {
    NUI_LOCK = locked;
});

const showMenu = (menuDataOrString: any) => { //Correct show menu.
    if(NUI_LOCK) return;
    let parsedMenuData

    if(typeof menuDataOrString === 'string')
        parsedMenuData = JSON.parse(menuDataOrString); //Correct parse
    else
        parsedMenuData = menuDataOrString;

    if (menuData.value) {
      // mp.trigger('cl:log', "Pushing menu to stack");
        menuStack.value.push(menuData.value);
    }

    menuData.value = parsedMenuData;

    menuData.value.items.forEach((item: any) => {
        if (!item.value) {
          if(item.type === 'colorpicker') {
            item.value = '#ff0000'; // Default color for colorpicker
          }
          else{
            item.value = 0;
          }
        }
    });

    selectedItem.value = 0;
    scrollToSelected();
     isColorPickerOpen.value = false; // Ensure color picker is closed initially
};



const goBack = () => {
  if(isColorPickerOpen.value) {
        isColorPickerOpen.value = false; //If colorpicker is open, close it
        mp.trigger('mouseShowCursor', false); // Hide cursor
        
        return;
    }
    if (menuStack.value.length >= 0) {
        menuData.value = menuStack.value.pop(); // Get the previous menu
        selectedItem.value = 0; // Reset selected item
        mp.trigger('cl:menuClose');
        scrollToSelected(); // Scroll to top on back
    } else {
        // Close the menu if there's no previous menu
        mp.trigger('cl:menuClose');
        mp.trigger('closeMenus');
        menuData.value = false;
    }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) {
    e.preventDefault();
  }

  let dropdownHasFocus = document.activeElement?.id === "dropdown";
  if (dropdownHasFocus) {
    const dropdown = selectedItem.value !== null ? dropdownRefs.value[selectedItem.value] : null;
    if (dropdown) {
      dropdown.handleDropdownKeyDown(e.key);
    }
    return;
  }

  // Verificăm dacă dropdown-ul are focus
  const dropdownElement = document.querySelector('#dropdown')?.parentElement;
  const hasDropdownFocus = document.activeElement === dropdownElement;

  // Dacă dropdown-ul are focus, delegăm către dropdown
  if (hasDropdownFocus && selectedItem.value !== null) {
    const dropdown = dropdownRefs.value[selectedItem.value];
    if (dropdown) {
      dropdown.handleDropdownKeyDown(e.key);
      return;
    }
  }

  // Altfel, permitem navigarea în meniul principal
    switch (e.key) {
        case "ArrowDown":
            selectedItem.value = selectedItem.value === null
                ? 0
                : (selectedItem.value + 1) % menuData.value.items.length;

            //set mod to preview it 
            // let dataToSendToServer = {
            //   id: item.id,
            //   menuId: menuData.value.id,
            //   type: item.type || 'Default',
            //   text: item.text,
            //   value: item.type === 'array' ? selected : item.value ?? item.id
            // }
            let dataToSendToServer = {
                id: menuData.value.items[selectedItem.value].id,
                menuId: menuData.value.id,
                type: menuData.value.items[selectedItem.value].type || 'Default',
                text: menuData.value.items[selectedItem.value].text,
                value: menuData.value.items[selectedItem.value].value ?? menuData.value.items[selectedItem.value].id
            }

            mp.trigger('cl:previewMod', JSON.stringify(dataToSendToServer));


            scrollToSelected();
            break;
        case "ArrowUp":
            selectedItem.value = selectedItem.value === null
                ? menuData.value.items.length - 1
                : (selectedItem.value - 1 + menuData.value.items.length) % menuData.value.items.length;
              let dataToSendToServerx = {
                id: menuData.value.items[selectedItem.value].id,
                menuId: menuData.value.id,
                type: menuData.value.items[selectedItem.value].type || 'Default',
                text: menuData.value.items[selectedItem.value].text,
                value: menuData.value.items[selectedItem.value].value ?? menuData.value.items[selectedItem.value].id
              }
              mp.trigger('cl:previewMod', JSON.stringify(dataToSendToServerx));
              scrollToSelected();
            break;
        case "ArrowLeft":
            handleLeft();
            break;
        case "ArrowRight":
            handleRight();
            break;
        case "Enter":
            handleEnter();
            break;
        case "Backspace": // Handle Backspace
            goBack();
            break;
    }

};

const color = ref(''); // Local ref for color picker
watch(color, (newColor) => {
  //check if is Secondary Color or Primary Color
  if (selectedItem.value !== null) {
    const item = menuData.value.items[selectedItem.value];
    if (item.text === 'Secondary Color') {
      mp.trigger('changeSecondaryColor', newColor);
    }else if (item.text === 'Primary Color') {
      mp.trigger('changePrimaryColor', newColor);
    }
  }
});

// --- Scroll to the selected item ---
const scrollToSelected = () => {
  nextTick(() => { // Ensure DOM is updated
    if (selectedItem.value !== null && menuContainerRef.value) {
      const selectedElement = menuContainerRef.value.children[selectedItem.value] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  });
};

// Funcție pentru curățarea focus-ului după selectarea opțiunii
const handleDropdownSelect = (selection: { index: number, value: string }) => {
  const dropdownElement = document.querySelector('#dropdown');
  (document.querySelector('.flex') as HTMLElement)?.focus();

  if (dropdownElement) {
    (dropdownElement as HTMLElement).blur();
  }
  checkDropdownState();
};

const handleColorChange = (newColor: string, index: number) => {
  if (selectedItem.value !== null) {
    const item = menuData.value.items[index];

    //Crucial:  Update the *menuData's* value, not just the local 'color' ref.
    item.value = newColor;

     let dataToSendToServer = {
        id: item.id,
        menuId: menuData.value.id,
        type: item.type || 'Default',
        text: item.text,
        value: newColor // Send the new color
      }

    mp.trigger('cl:menuSelect', JSON.stringify(dataToSendToServer));
  }
};

// Adăugăm un event listener pentru închiderea dropdown-ului
const handleDropdownClose = () => {
  checkDropdownState();
};

const closeColorPicker = () => {
    isColorPickerOpen.value = false;
    mp.trigger('mouseShowCursor', false); // Hide cursor

};
const handleRightClick = (event: MouseEvent) => {
    if (isColorPickerOpen.value) {
        event.preventDefault(); // Prevent default context menu
        closeColorPicker();
    }
};

watch(isColorPickerOpen, (newValue) => {
  if (newValue) {
    // Add right-click listener when color picker is open
    nextTick(() => { // Ensure the color picker is rendered
      document.addEventListener('contextmenu', handleRightClick);
    });
  } else {
    // Remove right-click listener when color picker is closed
    document.removeEventListener('contextmenu', handleRightClick);
  }
});

mp.events.add('cl:showMenu', showMenu); //Correct show menu

onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dropdown-closed", handleDropdownClose);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("dropdown-closed", handleDropdownClose);
    document.removeEventListener('contextmenu', handleRightClick); //Ensure to remove on destroy

});
</script>

<template>
  <div v-show="menuData" class="w-screen !font-rajdhani h-screen absolute top-0 z-[100]">
    <div
      v-show="menuData"
      class="absolute top-64 right-12 bg-radient-circle-tl from-zinc-950/90 to-zinc-900/90 rounded-lg w-[23rem] p-4 flex flex-col"
    >
      <span class="text-white text-xl font-bold">{{ menuData.title }}</span>
      <span class="text-white/50">{{ menuData.subtitle }}</span>

      <div
        ref="menuContainerRef"
        class="flex flex-col mt-4 overflow-y-auto"
        :style="{ maxHeight: menuHeight }"
      >
      <template v-for="(item, index) in menuData.items" :key="item.id">
        <div
        class="flex items-center justify-between p-2 rounded-lg mb-2 text-lg cursor-pointer transition-all"
        :class="[
          selectedItem === index ? 'bg-red-600/80 text-black' : 'bg-zinc-800/80',
          isAnyDropdownOpen && selectedItem !== index ? 'pointer-events-none opacity-50' : '',
           isColorPickerOpen && selectedItem !== index ? 'pointer-events-none opacity-50' : '',
        ]"
      >
           <div class="flex flex-row items-center text-sm gap-2">
              <div
                class="flex items-center justify-center text-white bg-white/10 rounded-lg w-[40px] h-[40px]"
              >
                <i :class="item.icon"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-white">{{ item.text }}</span>
                <span class="text-white/50">{{ item.subtext }}</span>
              </div>
            </div>

            <div
              v-if="item.type === 'number' || item.type === 'array'"
              class="flex items-center gap-2"
            >
              <i class="fas fa-chevron-left text-white/50"></i>
              <span class="text-white text-sm">
                {{
                  item.type === "number"
                    ? item.value ?? item.min
                    : item.options[item.value] ?? item.options[0]
                }}
              </span>
              <i class="fas fa-chevron-right text-white/50"></i>
            </div>

            <div v-if="item.type === 'dropdown'">
              <DropdownList
                id="dropdown"
                :options="item.options"
                :ref="(el) => (dropdownRefs.value[index] = el)"
                @close="handleDropdownClose"
                @select="handleDropdownSelect"
              />
            </div>
            <!-- Display current color and pop-up ColorPicker on Enter -->
            <div v-if="item.type === 'colorpicker' && !isColorPickerOpen" class="flex items-center">
                <div :style="{ backgroundColor: item.value, width: '20px', height: '20px', borderRadius: '4px', marginRight: '8px' }"></div>
                <span class="text-white text-sm">{{ item.value }}</span>
            </div>
          </div>
        </template>
      </div>
      <!-- ColorPicker (positioned absolutely, initially hidden) -->
        <div v-if="isColorPickerOpen" class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 z-[101]">
          <ColorPicker
            v-model="color"
           :value="color"
           />
        </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional: Add some padding to prevent scrollbar overlap */
.menu-container::-webkit-scrollbar {
    width: 8px; /* Adjust as needed */
}

.menu-container::-webkit-scrollbar-track {
    background: transparent;
}

.menu-container::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3); /* Adjust color as needed */
    border-radius: 4px; /* Adjust as needed */
}
</style>