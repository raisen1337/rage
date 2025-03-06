import { chat } from "@/chat";

const lastDrawCallTime: Record<string, number> = {}; // Track last DrawInteract call time
const hideDelay = 250; // Match the Vue component's hideDelay

export function DrawInteract(key: string, text: string, subtext: string, pos: any) {
    const screen2d = mp.game.graphics.getScreenCoordFromWorldCoord(pos.x, pos.y, pos.z);
    if (!screen2d) return;

    const distance = mp.game.system.vdist(pos.x, pos.y, pos.z, mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z);
    const screenResolution = mp.game.graphics.getActiveScreenResolution();

    const screenX = screen2d.screenX* screenResolution.x;
    const screenY = screen2d.screenY * screenResolution.y;

    const id = key; // Use the key as a unique identifier instead of position
    //
    lastDrawCallTime[id] = Date.now(); // Record the time of the DrawInteract call

    if (chat?.browser?.call) {
      chat.browser.call('addOrUpdateInteract', id, key, text, subtext, screenX, screenY, distance);
    } else {
      console.error("chat.browser is not defined or doesn't have a 'call' method!");
    }
}

mp.events.add('render', () => {
    // --- Your game logic goes here.  Call DrawInteract as needed. ---
   
    // --- End of your game logic ---

    // Cleanup based on lastDrawCallTime (client-side)
    const now = Date.now();
    for (const id in lastDrawCallTime) {
        if (now - lastDrawCallTime[id] > hideDelay) {
            delete lastDrawCallTime[id]; // Remove stale entries
        }
    }
});