<script setup lang="ts">
import {
  ref, onMounted, onUnmounted, watch, nextTick, computed
} from 'vue';

declare const mp: any;

const messages = ref<string[]>([]);
const input = ref('');
const isChatVisible = ref(false);
const chatContainer = ref<HTMLDivElement | null>(null);
const isInputVisible = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const commands = ref<any[]>([]);

// New refs for history functionality
const messageHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const currentInputBeforeHistory = ref('');

const colorClasses = {
  '^1': 'text-yellow-400',
  '^2': 'text-pink-400',
  '^3': 'text-green-400',
  '^4': 'text-blue-400',
  '^5': 'text-purple-400',
  '^6': 'text-pink-400',
  '^7': 'text-gray-400',
  '^0': 'text-white',
} as never;

function getColorClass(code: string): string {
  return colorClasses[code] || 'text-white';
}

function colorize(text: string): string {
  let result = '';
  let currentIndex = 0;
  let currentColorClass = 'text-white';

  const regex = /\^\d/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    result += `<span class="$ {
currentColorClass
}">$ {
text.substring(currentIndex, match.index)
}</span>`;
    const colorCode = match[0];
    currentColorClass = getColorClass(colorCode);
    const nextColorCodeIndex = text.indexOf('^', match.index + 2);
    const endIndex = nextColorCodeIndex === -1 ? text.length : nextColorCodeIndex;
    result += `<span class="$ {
currentColorClass
}">$ {
text.substring(match.index + 2, endIndex)
}</span>`;
    currentIndex = endIndex;
  }
  result += `<span class="$ {
currentColorClass
}">$ {
text.substring(currentIndex)
}</span>`;
  return result;
}

let hideTimeout: number | null = null;

function clearChatTimeout() {
  if (hideTimeout !== null) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
}

function setChatTimeout() {
  clearChatTimeout();
  if (!isChatVisible.value) return ;
  hideTimeout = window.setTimeout(() => {
    if (!isChatVisible.value || (inputRef.value && inputRef.value === document.activeElement)) {
      return ;
    }
    isChatVisible.value = false;
    mp.trigger('chat:close');
  }, 5000);
}

function addMessage() {
  if (input.value.trim() !== '') {
    mp.trigger('chat:sendMessage', input.value);
    // Add to history
    messageHistory.value.unshift(input.value);
    if (messageHistory.value.length > 50) {
      // Limit history size
      messageHistory.value.pop();
    }
    historyIndex.value = -1;
    input.value = '';
    isInputVisible.value = false;
    setChatTimeout();
    nextTick(() => {
      scrollToBottom();
    });
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

// Handle command history navigation
function handleHistoryNavigation(direction: 'up' | 'down') {
  if (messageHistory.value.length === 0) return ;

  if (historyIndex.value === -1) {
    currentInputBeforeHistory.value = input.value;
  }

  if (direction === 'up') {
    historyIndex.value = Math.min(historyIndex.value + 1, messageHistory.value.length - 1);
  } else {
    historyIndex.value = Math.max(historyIndex.value - 1, -1);
  }

  if (historyIndex.value === -1) {
    input.value = currentInputBeforeHistory.value;
  } else {
    input.value = messageHistory.value[historyIndex.value];
  }

  // Move cursor to end of input
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.setSelectionRange(input.value.length, input.value.length);
    }
  });
}

// Handle tab completion
function handleTabCompletion() {
  if (!input.value.startsWith('/')) return ;

  const currentInput = input.value.toLowerCase().slice(1);
  const matchingCommands = commands.value.filter(cmd => 
    cmd.name.toLowerCase().startsWith(currentInput)
  );

  if (matchingCommands.length === 1) {
    input.value = '/' + matchingCommands[0].name + ' ';
  }
}
let NUI_LOCK = false

mp.events.add('focus', (locked: boolean) => {
  NUI_LOCK = locked;
});

mp.events.add('chat:addMessage', (message: string) => {
  messages.value.push(message);
  isChatVisible.value = true;
  setChatTimeout();
  scrollToBottom();
});

mp.events.add('chat:setClipboard', (text: string) => {
  navigator.clipboard.writeText(text);
});


mp.events.add('chat:open', (cmds: any) => {
  if (NUI_LOCK) return ;
  if (isInputVisible.value) return ;

  try {
    cmds = JSON.parse(cmds);
  } catch (e) {
    messages.value.push(`Error parsing commands: $ {e}`);
    scrollToBottom();
  } finally {
    commands.value = Object.values(cmds);
  }

  isChatVisible.value = true;
  input.value = '';
  clearChatTimeout();
  isInputVisible.value = true;
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
});

const filteredCommands = computed(() => {
  const searchTerm = input.value.toLowerCase().replace('/', '').split(' ')[0];
  return commands.value.filter(command =>
    command.name.toLowerCase().includes(searchTerm)
  );
});

watch(isChatVisible, (newValue) => {
  if (newValue) {
    setChatTimeout();
  }
});

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.addEventListener('focus', () => {
      clearChatTimeout();
    });
    inputRef.value.addEventListener('blur', () => {
      if (isChatVisible.value) {
        setChatTimeout();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      isInputVisible.value = false;
      mp.trigger('chat:close');
      setChatTimeout();
    } else if (e.key === 'Tab' && isInputVisible.value) {
      e.preventDefault();
      handleTabCompletion();
    } else if (e.key === 'ArrowUp' && isInputVisible.value) {
      e.preventDefault();
      handleHistoryNavigation('up');
    } else if (e.key === 'ArrowDown' && isInputVisible.value) {
      e.preventDefault();
      handleHistoryNavigation('down');
    }
  });

  mp.events.add('chat:clear', () => {
    messages.value = [];
    scrollToBottom();
  });
});

onUnmounted(() => {
  clearChatTimeout();
  if (inputRef.value) {
    inputRef.value.removeEventListener('focus', clearChatTimeout);
    inputRef.value.removeEventListener('blur', setChatTimeout);
  }
});
</script>

<template>
  <div
    ref="chatContainer"
    class="max-w-[50rem] font-rajdhani min-w-[50rem] font-arial h-[40rem] bg-pink-500/0 flex flex-col p-4 !z-[500]"
  >
    <div
      class="min-h-[20rem] h-[20rem] max-h-[20rem] w-full stroke-text bg-black/0 font-semibold text-lg flex flex-col-reverse gap-2 p-2 overflow-y-scroll"
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="break-words flex flex-row items-center gap-2"
        >
          <span class="text-gray-500 text-xs">{{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          <p v-html="colorize(message)"></p>
        </div>
      </div>
    </div>

    <div class="relative">
      <div
        v-show="isInputVisible"
        class="bg-black/80 w-3/4 flex flex-row items-center p-2 rounded-md"
      >
        <button @click="addMessage" class="text-white">
          <i class="fa fa-paper-plane mr-2"></i>
        </button>
        <input
          ref="inputRef"
          v-model="input"
          @keyup.enter="addMessage"
          class="w-full p-1 bg-black/0 outline-none text-white placeholder:text-white font-semibold rounded-l-md"
          placeholder="Type here..."
        />
      </div>

      <div
        v-show="isInputVisible"
        class="absolute top-full w-3/4 stroke-text bg-black/0 font-semibold text-lg max-h-[10rem] overflow-y-scroll mt-2"
      >
        <div class="flex flex-col gap-2">
          <div
            v-for="(command, index) in filteredCommands"
            :key="index"
            class="flex flex-row rounded-lg bg-black/50 p-2 items-center gap-3"
          >
            <i
              class="fa-solid fa-hashtag text-white text-xl p-2 rounded-lg bg-white/10"
            ></i>
            <div class="flex flex-col">
              <div class="flex flex-row items-center gap-3">
                <p class="text-white font-semibold">/{{ command.name }}</p>
                <p
                  class="text-white text-xs font-normal bg-white/10 px-2 py-1 rounded-xl"
                >
                  {{ command.usage }}
                </p>
              </div>
              <p class="text-white">{{ command.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

