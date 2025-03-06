<script setup lang="ts">
import { ref } from 'vue'
const dtitle = ref('Titlu Dialog')
const msg = ref('Mesaj Dialog')
const show = ref(false)
const input = ref('')
declare const mp: any;
const confirm = () => {
    mp.trigger('confirmInput', input.value)
    msg.value = ''
    dtitle.value = ''
    input.value = ''
    show.value = false
}

mp.events.add('showDialog', (title: string, message: string) => {
    dtitle.value = title
    msg.value = message
    show.value = true
    input.value = ''

    //focus the input
    setTimeout(() => {
        //@ts-ignore
        document.querySelector('#input')?.focus()
    }, 100)
})

mp.events.add('hideDialog', () => {
    show.value = false
    msg.value = ''
    dtitle.value = ''
    input.value = ''
})

//cancel
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        show.value = false
        mp.trigger('cancelInput')
    }
})

</script>
<template>
    <div 
    v-show="show"
    class="w-screen h-screen font-bai absolute top-0 z-[100] flex items-center justify-center">
        <div class="bg-zinc-950/80 w-[30rem] flex flex-col p-4 rounded-lg shadow-lg">
           <span class="text-white font-bold text-2xl">{{ dtitle }}</span>
           <span class="text-white/50 font-normal text-normal">{{ msg }}</span>
           <div class="w-full h-fit p-2 bg-zinc-950/40 rounded-lg">
                <input 
                id="input"
                v-model="input"
                @keydown.enter="confirm"
                placeholder="Scrie aici..."
                class="w-full h-10 bg-zinc-800/0 text-center text-white rounded-lg p-2" />
           </div>
           <span class="text-white/50 font-normal mt-2 -mb-2 text-normal">[ENTER] pentru a confirma</span>
           <span class="text-white/50 font-normal mt-2 -mb-2 text-normal">[ESC] Cancel</span>
        </div>
    </div>
</template>