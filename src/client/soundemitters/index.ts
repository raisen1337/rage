import { chat } from "@/chat";
import { DrawInteract } from "@/interact";
import { Dialog, playerData } from "@/main";

const MAX_DISTANCE_FOR_MAX_VOLUME = 50; // Configurable max distance for volume 1.0

let Emitters: Record<number, any> = {}; // Key by emitterId (number)
const ActiveEmitters: Record<number, any> = {}; // Persistent map for active emitters, keyed by emitterId

chat.registerCommand('play', () => {
    Dialog('URL', 'Put the video url down below', (url: string) => {
        if (!url) return;

        let isValidYoutubeUrl = url.match(/^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/);
        let isPlaylist = url.match(/[?&]list=/);

        if (!isValidYoutubeUrl) return;
        if (isPlaylist) return;

        const inVehicle = !!mp.players.local.vehicle;
        mp.events.callRemote('audio:registerEmitterForAllPlayers', url, inVehicle);
    });
}, "Play URL from Youtube", "/play", 0);

mp.events.add('audio:registerEmitter', (emitterStr: string) => {
    const emitter = JSON.parse(emitterStr);
    Emitters[emitter.id] = { ...emitter, active: false }; // Initialize as inactive in main Emitters
    console.log(`[CLIENT AUDIO] Registered emitter: ${emitter.id}, Type: ${emitter.type}, URL: ${emitter.url}, Pos: ${emitter.position ? JSON.stringify(emitter.position) : 'Vehicle Plate: ' + emitter.plate}`);
});

mp.events.add('audio:removeEmitter', (id: number) => {
    if (Emitters[id]) {
        if (ActiveEmitters[id]) { // Check in ActiveEmitters map
            chat.browser.call('cl:stopAudioForEmitter', id);
            delete ActiveEmitters[id]; // Remove from ActiveEmitters map
            console.log(`[CLIENT AUDIO] Stopped audio and removed from ActiveEmitters for emitter: ${id}`);
        }
        delete Emitters[id]; // Remove from main Emitters map
        console.log(`[CLIENT AUDIO] Removed emitter: ${id} from Emitters.`);
    } else {
        console.warn(`[CLIENT AUDIO] Tried to remove emitter ${id}, but it doesn't exist.`);
    }
});

mp.events.add('render', () => {
    if (Object.keys(Emitters).length === 0 && Object.keys(ActiveEmitters).length === 0) return; // Early return if no emitters at all

    const playerPos = mp.players.local.position;

    // ** --- Activation and Update Loop (Iterate through ALL Emitters) --- **
    for (const emitterId in Emitters) {
        const emitter = Emitters[emitterId];
        let distance = 0;
        let relevantPosition = null;

        if (emitter.type === 'static') {
            relevantPosition = emitter.position;
        } else if (emitter.type === 'vehicle') {
            const vehicle = mp.vehicles.toArray().find(v => v.id === emitter.plate);
            if (!vehicle) {
                if (ActiveEmitters[emitterId]) { // Check ActiveEmitters map
                    chat.browser.call('cl:stopAudioForEmitter', emitterId);
                    delete ActiveEmitters[emitterId]; // Remove from ActiveEmitters map
                    console.log(`[CLIENT AUDIO][RENDER] Emitter ${emitterId} (Vehicle Type): Vehicle NOT FOUND. DEACTIVATED and removed from ActiveEmitters due to vehicle loss.`);
                }
                continue; // Skip to the next emitter
            }
            relevantPosition = vehicle.position;
        }

        if (!relevantPosition) {
            console.warn(`[CLIENT AUDIO][RENDER] Emitter ${emitterId}: NO relevant position. Skipping range check for this frame.`);
            continue; // Skip to the next emitter
        }

        distance = mp.game.system.vdist(
            playerPos.x, playerPos.y, playerPos.z,
            relevantPosition.x, relevantPosition.y, playerPos.z
        ); // <--- IMPORTANT: Use playerPos.z for player Z coordinate!

        const maxAudibleDistance = emitter.range 

        if (distance < maxAudibleDistance) {
            const volume = Math.max(0, emitter.maxVol * (1 - (distance / maxAudibleDistance)));
            const offset = (Date.now() - emitter.startTime) / 1000;

            if (!ActiveEmitters[emitterId]) { // Check ActiveEmitters map for activation
                ActiveEmitters[emitterId] = { ...emitter }; // Add to ActiveEmitters map
                chat.browser.call('cl:playAudioForEmitter', emitterId, emitter.url, offset);
                Emitters[emitterId].active = true; // Update active state in main Emitters
                console.log(`[CLIENT AUDIO][RENDER] Emitter ${emitterId}: ACTIVATED and added to ActiveEmitters. Distance: ${distance.toFixed(2)}, Volume: ${volume.toFixed(2)}, Max Distance: ${maxAudibleDistance.toFixed(2)}`);
            } else {
                // Emitter is already active (in ActiveEmitters map), just adjust volume
                chat.browser.call('cl:adjustVolumeForEmitter', emitterId, volume);
                console.log(`[CLIENT AUDIO][RENDER] Emitter ${emitterId}: Volume ADJUSTED (Already ACTIVE in ActiveEmitters). Distance: ${distance.toFixed(2)}, Volume: ${volume.toFixed(2)}, Max Distance: ${maxAudibleDistance.toFixed(2)}`);
            }

            // Update properties in BOTH Emitters and ActiveEmitters to keep them in sync
            Emitters[emitterId].distance = distance;
            Emitters[emitterId].vol = volume;
            Emitters[emitterId].offset = offset;
            Emitters[emitterId].vehiclePosition = relevantPosition;

            ActiveEmitters[emitterId].distance = distance;
            ActiveEmitters[emitterId].vol = volume;
            ActiveEmitters[emitterId].offset = offset;
            ActiveEmitters[emitterId].vehiclePosition = relevantPosition;


            DrawInteract('🔊', `Sound Emitter ${emitterId}`, `Distance: ${distance.toFixed(2)}m | Vol: ${volume.toFixed(2)} | Max Vol: ${emitter.maxVol} | Max Distance: ${maxAudibleDistance.toFixed(2)}m`, new mp.Vector3(
                relevantPosition.x,
                relevantPosition.y,
                relevantPosition.z
            ));

        } else {
            // ** --- Deactivation Check (if in ActiveEmitters but out of range) --- **
            if (ActiveEmitters[emitterId]) { // Check if emitter is currently in ActiveEmitters
                chat.browser.call('cl:stopAudioForEmitter', emitterId);
                delete ActiveEmitters[emitterId]; // Remove from ActiveEmitters map on deactivation
                Emitters[emitterId].active = false; // Update active state in main Emitters
                console.log(`[CLIENT AUDIO][RENDER] Emitter ${emitterId}: DEACTIVATED and removed from ActiveEmitters (Out of Range). Distance: ${distance.toFixed(2)}, Max Distance: ${maxAudibleDistance.toFixed(2)}`);
            } else {
                // Was already inactive and out of range, or never active for this player
                // console.log(`[CLIENT AUDIO][RENDER] Emitter ${emitterId}: Remains INACTIVE (Still Out of Range or never activated).`); // Optional debug log
            }
        }
    }
});


function getFocusedEmitter() {
    let closestEmitter = null;
    let minDistance = Infinity;

    for (const id in ActiveEmitters) { // Iterate through ActiveEmitters for focused emitter
        const emitter = ActiveEmitters[id];
        if (emitter.distance < minDistance) {
            minDistance = emitter.distance;
            closestEmitter = emitter;
        }
    }

    if (!closestEmitter) {
        chat.browser.call('cl:notify', 'No active emitter in range.');
        return null;
    }
    return closestEmitter;
}


// chat.registerCommand('setvol', (args: string[]) => {
//     const focusedEmitter = getFocusedEmitter();
//     if (focusedEmitter) {
//         const volume = parseFloat(args[0]);
//         if (!isNaN(volume) && volume > 0) {
//             mp.events.callRemote('audio:setVolume', focusedEmitter.id, volume);
//             console.log(`[CLIENT AUDIO] Command /setvol - Emitter: ${focusedEmitter.id}, Volume: ${volume}`);
//         } else {
//             chat.browser.call('cl:notify', 'Invalid volume value.  Must be a number greater than 0.');
//         }
//     } else {
//         chat.browser.call('cl:notify', 'No active emitter to set volume for.');
//         console.log(`[CLIENT AUDIO] Command /setvol - No focused emitter.`);
//     }
// }, 'Set max volume for your emitter', '/setvol [vol]', 0);

//setrange
chat.registerCommand('setrange', (args: string[]) => {
    const focusedEmitter = getFocusedEmitter();
    if (focusedEmitter) {
        const range = parseFloat(args[0]);
        if (!isNaN(range) && range > 0) {
            mp.events.callRemote('audio:setRange', focusedEmitter.id, range);
            console.log(`[CLIENT AUDIO] Command /setrange - Emitter: ${focusedEmitter.id}, Range: ${range}`);
        } else {
            chat.browser.call('cl:notify', 'Invalid range value.  Must be a number greater than 0.');
        }
    } else {
        chat.browser.call('cl:notify', 'No active emitter to set range for.');
        console.log(`[CLIENT AUDIO] Command /setrange - No focused emitter.`);
    }
}, 'Set max range for your emitter', '/setrange [range]', 0);

chat.registerCommand('clearaudio', () => {
    const focusedEmitter = getFocusedEmitter();
    if (focusedEmitter) {
        mp.events.callRemote('audio:removeEmitter', focusedEmitter.id);
        console.log(`[CLIENT AUDIO] Command /clearaudio - Emitter: ${focusedEmitter.id}`);
    } else {
        chat.browser.call('cl:notify', 'No active emitter to clear.');
        console.log(`[CLIENT AUDIO] Command /clearaudio - No focused emitter.`);
    }
}, 'Clear audio emitter', '/clearaudio', 0);

chat.registerCommand('changeurl', () => {
    const focusedEmitter = getFocusedEmitter();
    if (focusedEmitter) {
        Dialog('URL', 'Put the video url down below', (url: string) => {
            if (!url) return;
            let isValidYoutubeUrl = url.match(/^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/);
            let isPlaylist = url.match(/[?&]list=/);

            if (!isValidYoutubeUrl) return;
            if (isPlaylist) return;
            mp.events.callRemote('audio:changeUrl', focusedEmitter.id, url);
            console.log(`[CLIENT AUDIO] Command /changeurl - Emitter: ${focusedEmitter.id}, URL: ${url}`);
        });
    } else {
        chat.browser.call('cl:notify', 'No active emitter to change URL for.');
        console.log(`[CLIENT AUDIO] Command /changeurl - No focused emitter.`);
    }
}, "Change URL from Youtube", "/changeurl", 0);

mp.events.add('audio:updateEmitter', (emitterStr: string) => {
    const updatedEmitter = JSON.parse(emitterStr);
    const existingEmitter = Emitters[updatedEmitter.id];

    if (existingEmitter) {
        if (existingEmitter.url !== updatedEmitter.url) {
            if (ActiveEmitters[updatedEmitter.id]) { // Check ActiveEmitters map
                chat.browser.call('cl:stopAudioForEmitter', updatedEmitter.id);
                delete ActiveEmitters[updatedEmitter.id]; // Remove from ActiveEmitters map
                Emitters[updatedEmitter.id].active = false; // Ensure active state is false in main Emitters
                console.log(`[CLIENT AUDIO] URL changed for emitter ${updatedEmitter.id}, stopping and removing from ActiveEmitters.`);
            }
            existingEmitter.url = updatedEmitter.url;
            existingEmitter.startTime = updatedEmitter.startTime;
             if (ActiveEmitters[updatedEmitter.id]) { // Re-activate if it was active before URL change
                chat.browser.call('cl:playAudioForEmitter', updatedEmitter.id, updatedEmitter.url, 0);
                console.log(`[CLIENT AUDIO] URL changed for emitter ${updatedEmitter.id}, restarting with new URL in ActiveEmitters.`);
            }
        }

        existingEmitter.maxVol = updatedEmitter.maxVol;
        existingEmitter.type = updatedEmitter.type;
        existingEmitter.position = updatedEmitter.position;
        existingEmitter.plate = updatedEmitter.plate;
        existingEmitter.range = updatedEmitter.range;

        if (ActiveEmitters[updatedEmitter.id]) { // Update ActiveEmitters as well if it's active
            ActiveEmitters[updatedEmitter.id].maxVol = updatedEmitter.maxVol;
            ActiveEmitters[updatedEmitter.id].type = updatedEmitter.type;
            ActiveEmitters[updatedEmitter.id].position = updatedEmitter.position;
            ActiveEmitters[updatedEmitter.id].plate = updatedEmitter.plate;
            ActiveEmitters[updatedEmitter.id].range = updatedEmitter.range;
        }


        console.log(`[CLIENT AUDIO] Updated emitter data: ${updatedEmitter.id}, MaxVol: ${updatedEmitter.maxVol}, Type: ${updatedEmitter.type}, Pos: ${updatedEmitter.position ? JSON.stringify(updatedEmitter.position) : 'Vehicle Plate: ' + updatedEmitter.plate}`);
    } else {
        console.warn(`[CLIENT AUDIO] Received update for non-existent emitter: ${updatedEmitter.id}`);
    }
});

mp.events.add('corefx:playerReady', () => {
    mp.events.callRemote('audio:requestAllEmitters');
    console.log("[CLIENT AUDIO] corefx:playerReady - Requesting all emitters from server.");
});