<script setup lang="ts">
import { ref } from 'vue'
import CharCreator from './components/CharCreator.vue'
import ChatSystem from './components/ChatSystem.vue'
import PlayerHud from './components/PlayerHud.vue'
import Scoreboard from './components/Scoreboard.vue'
//@ts-ignore
import Speedometer from './components/Speedometer.vue'
import ClothingShops from './components/ClothingShops.vue'
import Inventory from './components/Inventory.vue'
import InputDialog from './components/InputDialog.vue'
import ContextMenu from './components/ContextMenu.vue'
//@ts-ignore
import ThreeDText from './components/ThreeDText.vue'
import ThreeDPoint from './components/ThreeDPoint.vue'
import Notifications from './components/Notifications.vue'
import SoundEmitters from './components/SoundEmitters.vue'
import Deathscreen from './components/Deathscreen.vue'
import Garages from './components/Garages.vue'

declare const mp: any

const showUi = ref(true)

mp.events.add('hideUi', () => {
  mp.trigger('log', 'hideui');
  showUi.value = false
})

mp.events.add('showUi', () => {
  showUi.value = true
})

</script>

<template>
  <CharCreator />
  <ClothingShops />
  <div 
  v-show="showUi"
  class="">
    <Garages />
    <Deathscreen />
    <SoundEmitters />
    <Notifications />
    <ThreeDPoint />
    <ThreeDText />
    <ContextMenu />
    <InputDialog />
    <Inventory />
    <Speedometer />
    <Scoreboard />
    <PlayerHud />
    <ChatSystem />
  </div>
</template>
<style>
* {
  outline: none;
}
.stroke-text {
  text-shadow:
    -1px -1px 0 black,
    1px -1px 0 black,
    -1px 1px 0 black,
    1px 1px 0 black;
}
::-webkit-scrollbar {
  display: none;
}
.break-words {
  word-break: break-word;
  white-space: normal;
}
</style>
