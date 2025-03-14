<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

declare const mp: any;

interface AudioPlayer {
  element?: HTMLAudioElement;
  playing: boolean;
  volume: number;
  targetVolume: number;
  fadeDuration: number;
  fadeStart: number | null;
  fadeRequestId?: number | null;
  filePath?: string;
  fileName?: string;
}

const audioPlayers = ref<Record<string, AudioPlayer>>({});

const defaultFadeDuration = 250;

function stopAudioForEmitter(emitterId: string, reason: string = 'explicit', fadeDuration: number = defaultFadeDuration) {
  const player = audioPlayers.value[emitterId];
  if (!player) return;

  if (fadeDuration > 0) {
    startFade(emitterId, 0, fadeDuration);
  } else {
    finalizeStop(emitterId, reason);
  }
}

function finalizeStop(emitterId: string, reason: string) {
  const player = audioPlayers.value[emitterId];
  if (!player) return;
  let logMessage = `^2[AUDIO] Stopping audio (Emitter ${emitterId}), reason: ${reason}`;

  mp.trigger('cl:log', logMessage);

  try {
    if (player.element) {
      player.element.pause();
      player.element.currentTime = 0;
      player.element.removeEventListener('ended', audioEndedHandler(emitterId));
      player.element.removeEventListener('error', audioErrorHandler(emitterId));
    }

  } catch (error) {
    if (mp && typeof mp.trigger === 'function') {
      //  mp.trigger('cl:log', `Error stopping audio for emitter ${emitterId}: ${error}`);
    }
  }

  player.playing = false;
  player.fadeRequestId = null;
  player.fadeStart = null;
  player.volume = 0;
  if (player.element) {
    player.element.volume = 0;
  }
  delete audioPlayers.value[emitterId];
}

let SERVER_IP = 'localhost'

mp.events.add('prefferedIp', (ip: string) => {
    SERVER_IP = ip;
    stopAllAudio();

    //destroy all audio managers
    document.querySelectorAll('.audio-manager').forEach((el) => {
        el.remove();
    });
});

const audioManagers = [];


async function playAudioForEmitter(emitterId: string, url: string, offset: number = 0) {
    if (mp && typeof mp.trigger === 'function') {
        // mp.trigger('cl:log', `Starting audio for emitter ${emitterId}, URL: ${url}, offset: ${offset}`);
    }

  if (audioPlayers.value[emitterId]) {
    stopAudioForEmitter(emitterId, 'new URL', 0);
  }

  try {
    const downloadResponse = await fetch(`http://${SERVER_IP}:3000/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });


    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      if (mp && typeof mp.trigger === 'function') {
        // mp.trigger('cl:log', `Failed to download audio for emitter ${emitterId}: ${downloadResponse.status} - ${errorText}`);
      }
      return;
    }

    const { filePath, fileName, url: audioUrl } = await downloadResponse.json();

    const audioPath = `http://${SERVER_IP}:3000/audio/${fileName}`;

    if (mp && typeof mp.trigger === 'function') {
      // mp.trigger('cl:log', `Using audio path: ${audioPath} for emitter ${emitterId}`);
    }

    const audio = new Audio(audioPath) as any;
    audio.currentTime = offset;
    audio.volume = 0;
    audio.onerror = audioErrorHandler(emitterId);

    audio.play()
      .then(() => {
        if (mp && typeof mp.trigger === 'function') {
            mp.trigger('cl:log', `^3[AUDIO] Playing audio. (Emitter ${emitterId})`);
        }
        startFade(emitterId, 1, defaultFadeDuration);
      })
      .catch((err: any) => {
        if (mp && typeof mp.trigger === 'function') {
          // mp.trigger('cl:log', `Error playing audio for emitter ${emitterId}: ${err}`);
        }
      });

    audioPlayers.value[emitterId] = {
      element: audio,
      playing: true,
      volume: 0,
      targetVolume: 1,
      fadeDuration: defaultFadeDuration,
      fadeStart: null,
      fadeRequestId: null,
      filePath: filePath,
      fileName: fileName
    };

    audio.addEventListener('ended', audioEndedHandler(emitterId));
    audio.addEventListener('error', audioErrorHandler(emitterId));

  } catch (error) {
    if (mp && typeof mp.trigger === 'function') {
      // mp.trigger('cl:log', `Error playing audio for emitter ${emitterId}: ${error}`);
    }
  }
}


function audioEndedHandler(emitterId: string) {
  return () => {
    if (audioPlayers.value[emitterId]) {
      stopAudioForEmitter(emitterId, 'audio ended');
    }
  };
}


function audioErrorHandler(emitterId: string) {
  return (event: Event) => {
    const audio = audioPlayers.value[emitterId]?.element;
    let errorDetails = "Unknown error";

    if (audio && audio.error) {
      switch (audio.error.code) {
        case audio.error.MEDIA_ERR_ABORTED:
          errorDetails = "Aborted";
          break;
        case audio.error.MEDIA_ERR_NETWORK:
          errorDetails = "Network error";
          break;
        case audio.error.MEDIA_ERR_DECODE:
          errorDetails = "Decode error";
          break;
        case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorDetails = "Source not supported";
          break;
        default:
          errorDetails = `Unknown error code: ${audio.error.code}`;
      }
    } else if (event instanceof ErrorEvent) {
      errorDetails = event.message;
    }

    if (mp && typeof mp.trigger === 'function') {
      // mp.trigger('cl:log', `HTML Audio error for emitter ${emitterId}: ${errorDetails}`);
    }
    stopAudioForEmitter(emitterId, `error: ${errorDetails}`);
  };
}

function adjustVolumeForEmitter(emitterId: string, volume: number, fadeDuration: number = defaultFadeDuration) {
  const player = audioPlayers.value[emitterId];
  if (!player) return;
  startFade(emitterId, volume, fadeDuration);
}

function startFade(emitterId: string, targetVolume: number, fadeDuration: number) {
  const player = audioPlayers.value[emitterId];
  if (!player || !player.element) return;

  if (player.fadeRequestId) {
    cancelAnimationFrame(player.fadeRequestId);
    player.fadeRequestId = null;
  }

  player.targetVolume = targetVolume;
  player.fadeDuration = fadeDuration;
  player.fadeStart = Date.now();

  if (fadeDuration <= 0) {
    player.volume = targetVolume;
    player.element.volume = player.volume;

    if (player.volume === 0) {
      finalizeStop(emitterId, 'volume 0');
    }
    return;
  }

  function animateFade() {
    if (!audioPlayers.value[emitterId] || audioPlayers.value[emitterId].fadeStart === null) {
      return;
    }
    const player = audioPlayers.value[emitterId] as any;
    if (!player.element) return;

    const now = Date.now();
    const elapsed = now - player.fadeStart;
    const progress = Math.min(1, elapsed / player.fadeDuration);

    player.volume = player.volume + (player.targetVolume - player.volume) * progress;
    player.element.volume = player.volume;

    if (progress < 1) {
      player.fadeRequestId = requestAnimationFrame(animateFade);
    } else {
      player.fadeRequestId = null;
      player.fadeStart = null;
      if (player.volume === 0) {
        finalizeStop(emitterId, 'volume 0');
      }
    }
  }

  player.fadeRequestId = requestAnimationFrame(animateFade);
}


function stopAllAudio() {
  if (mp && typeof mp.trigger === 'function') {
    // mp.trigger('cl:log', "Stopping all audio players");
  }
  for (const emitterId in audioPlayers.value) {
    stopAudioForEmitter(emitterId, 'stop all');
  }
  audioPlayers.value = {};
}


onMounted(() => {

  if (mp && mp.events) {
    mp.events.add('cl:playAudioForEmitter', playAudioForEmitter);
    mp.events.add('cl:stopAudioForEmitter', (emitterId: string, fadeDuration?: number) => stopAudioForEmitter(emitterId, 'explicit', fadeDuration));
    mp.events.add('cl:adjustVolumeForEmitter', (emitterId: string, volume: number, fadeDuration?: number) => adjustVolumeForEmitter(emitterId, volume, fadeDuration));
    mp.events.add('cl:stopAllAudio', stopAllAudio);

    mp.events.add('cl:playAudio', (url: string, offset: number) => {
      playAudioForEmitter('legacy', url, offset);
    });
    mp.events.add('cl:stopAudio', () => {
      stopAudioForEmitter('legacy', "legacy stop");
    });
    mp.events.add('cl:adjustVolume', (volume: number) => {
      adjustVolumeForEmitter('legacy', volume);
    });

  } else {
    if (mp && typeof mp.trigger === 'function') {
      // mp.trigger('cl:log', "mp object or mp.events is not defined!");
    }
  }
});

onUnmounted(() => {
  stopAllAudio();
});


defineExpose({
  playAudioForEmitter,
  stopAudioForEmitter,
  adjustVolumeForEmitter,
  stopAllAudio
});
</script>

<template>
  <!-- No visible content needed -->
</template>