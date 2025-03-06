'use strict';

let client_ui = mp.browsers.new(`${mp.players.local.ip === '192.168.1.133' ? 'http://localhost:5173' : 'http://79.118.112.192:5173'}`);
function getBrowser() {
    return client_ui;
}
function setNuiFocus(locked, hasCursor) {
    client_ui.call('focus', locked, hasCursor);
    mp.gui.cursor.show(locked, hasCursor);
    mp.gui.cursor.visible = hasCursor;
}
function validateMenuItem(item) {
    const errors = [];
    if (item.type === 'number') {
        if (item.min !== undefined && item.max !== undefined && item.min > item.max) {
            errors.push('Min value cannot be greater than max value');
        }
    } else if (item.type === 'array' || item.type === 'dropdown') {
        if (!Array.isArray(item.options)) errors.push('Options must be an array');
        if (item.options && item.options.some((opt)=>typeof opt !== 'string'
        )) errors.push('Each option must be a string');
    } else if (item.type === 'colorpicker') {
        if (item.value && typeof item.value !== 'string') errors.push('Initial color must be a string');
    }
    return errors;
}
let menus = {
};
const menuCallbacks = {
};
let nextMenuId = 1;
let nextItemId = 1;
let MENU_OPEN = false;
function Menu(title, subtitle, items) {
    const id = nextMenuId++;
    const errors = items.reduce((acc, item)=>acc.concat(validateMenuItem(item))
    , []);
    if (errors.length) {
        console.error(`[ERROR] Invalid menu item: ${errors.join(', ')}`);
        return {
            id,
            title,
            subtitle,
            items: []
        };
    }
    items.forEach((item)=>{
        item.id = nextItemId++;
    });
    menus[id] = {
        id,
        title,
        subtitle,
        items
    };
    // Set default values
    for(let i = 0; i < items.length; i++){
        const item = items[i];
        if (item.type === 'number' && item.min === undefined && item.max === undefined) {
            item.min = 0;
            item.max = 100;
            item.value = 0;
        } else if (item.type === 'default' && item.value === undefined) {
            item.value = 0;
        } else if (item.type === 'colorpicker' && item.value === undefined) {
            item.value = '#ff0000';
        }
    }
    return menus[id];
}
function closeAllMenus() {
    MENU_OPEN = false;
    chat.browser.call('cl:closeAllMenus');
}
function showMenu(menuId) {
    if (chat.on) return;
    if (INV_OPEN) return;
    if (DIALOG_OPEN) return;
    setNuiFocus(true, false);
    MENU_OPEN = true;
    if (!menus[menuId]) {
        console.error('Show menu called with an invalid ID:', menuId);
        return;
    }
    // Send menu data to the UI
    chat.browser.call('cl:showMenu', JSON.stringify(menus[menuId]));
}
function Notify(type, title, message, duration = 5000) {
    chat.browser.call('notify', type, title, message, duration);
}
mp.events.add('corefx:notify', (type, title, message, duration)=>{
    Notify(type, title, message, duration);
});
mp.events.add('closeMenus', ()=>{
    setNuiFocus(false, false);
    MENU_OPEN = false;
});
function addMenuItem(menuId, item) {
    if (!menus[menuId]) {
        console.error('Attempted to add item to non-existent menu:', menuId);
        return;
    }
    const itemId = nextItemId++;
    const callbackId = `menuItem_${menuId}_${itemId}_${nextItemId++}`;
    if (item.cb) {
        menuCallbacks[callbackId] = item.cb;
    }
    const newItem = {
        ...item,
        id: itemId,
        callbackId: callbackId,
        cb: undefined
    };
    menus[menuId].items.push(newItem);
}
mp.events.add('cl:menuSelect', (dataString)=>{
    if (INV_OPEN) return;
    if (chat.on) return;
    if (DIALOG_OPEN) return;
    try {
        const data = JSON.parse(dataString);
        if (data && data.menuId && menus[data.menuId]) {
            const item1 = menus[data.menuId].items.find((item)=>item.id === data.id
            );
            if (item1 && item1.callbackId && menuCallbacks[item1.callbackId]) {
                menuCallbacks[item1.callbackId](data.value);
            } else {
                chat.sendLocalMessage("Couldn't find callback for menu item");
            }
        } else {
            chat.sendLocalMessage('Invalid menu selection');
        }
    } catch (error) {
        console.error('Error parsing menu selection data:', error);
        chat.sendLocalMessage('Error processing menu selection');
    }
});
mp.events.add('cl:menuClose', async ()=>{
    MENU_OPEN = false;
});
mp.events.add('cl:showMenu', (menuData)=>{
    if (typeof chat !== 'undefined' && chat && chat.browser && chat.browser.call) {
        chat.browser.call('showMenu', menuData);
    }
});
class Callbacks {
    call(name, cb, ...args) {
        const id = this.callbackId++;
        this.callbacks[id] = cb;
        console.log(`[CLIENT] Calling server function: ${name}, CallbackID: ${id}, Args:`, args);
        mp.events.callRemote('corefx:callback', name, id, ...args);
    }
    handleResponse(callbackId, ...args) {
        console.log(`[CLIENT] Received response for CallbackID: ${callbackId}, Data:`, args);
        if (this.callbacks[callbackId]) {
            this.callbacks[callbackId](...args);
            delete this.callbacks[callbackId];
        } else {
            console.log(`[CLIENT] No matching callback found for ID: ${callbackId}`);
        }
    }
    constructor(){
        this.callbacks = {
        };
        this.callbackId = 0;
    }
}
var callbacks = new Callbacks();
mp.events.add('corefx:callbackResponse', (callbackId, ...args)=>{
    callbacks.handleResponse(callbackId, ...args);
});
mp.nametags.enabled = false;
var playerData = {
};
const SERVER_PUBLIC_IP = '79.118.112.192';
mp.events.add('changeBrowserUrl', (local)=>{
    if (local) {
        chat.browser.url = 'http://localhost:5173';
        chat.browser.call('prefferedIp', '127.0.0.1');
    } else {
        chat.browser.call('prefferedIp', SERVER_PUBLIC_IP);
    }
});
mp.events.add('corefx:updateData', (data)=>{
    if (typeof data === 'string') data = JSON.parse(data);
    playerData = data;
});
mp.events.add('corefx:playerReady', (data)=>{
    playerData = data;
    mp.players.local.freezePosition(false);
    mp.players.local.position = new mp.Vector3(playerData.position.x, playerData.position.y, playerData.position.z);
    mp.players.local.heading = playerData.position.heading;
});
mp.events.add('corefx:updateUI', (data)=>{
    chat.browser.call('updateUI', data);
});
let delKey = false;
let nearestPlayers = [];
mp.keys.bind(46, true, async ()=>{
    // DEL key
    delKey = true;
    if (nearestPlayers.length === 0) {
        try {
            let np = await mp.events.callRemoteProc('getClosestPlayers');
            nearestPlayers = np || [];
        } catch (error) {
            console.error('Error getting closest players:', error);
            nearestPlayers = [];
        }
    }
});
async function Wait(ms) {
    return new Promise((resolve)=>{
        setTimeout(resolve, ms);
    });
}
mp.events.add('render', ()=>{
    //disable TAB key
    mp.game.controls.disableControlAction(0, 37, true); // TAB
    mp.game.controls.disableControlAction(0, 199, true); // P
    if (delKey && nearestPlayers.length > 0) {
        for(let i = 0; i < nearestPlayers.length; i++){
            let targetPlayer = mp.players.toArray().find((p)=>p.getVariable('syncId') === nearestPlayers[i].syncId
            );
            if (!targetPlayer) continue;
            let pos = targetPlayer.position;
            let twoD = mp.game.graphics.world3dToScreen2d(new mp.Vector3(pos.x, pos.y, pos.z + 1));
            if (twoD) {
                let text = `${nearestPlayers[i].admin ? '~r~Admin~w~' : 'Player'}~n~${nearestPlayers[i].name} (${nearestPlayers[i].pId})`;
                mp.game.graphics.drawText(text, [
                    twoD.x,
                    twoD.y
                ], {
                    font: 0,
                    color: [
                        255,
                        255,
                        255,
                        255
                    ],
                    scale: [
                        0.3,
                        0.3
                    ],
                    outline: true
                });
            }
        }
    }
});
mp.keys.bind(46, false, ()=>{
    nearestPlayers = [];
    delKey = false;
});
let scoreboardVisible = false;
mp.keys.bind(9, true, async ()=>{
    if (INV_OPEN) return;
    if (chat.on) return;
    if (DIALOG_OPEN) return;
    if (MENU_OPEN) return;
    if (scoreboardVisible) {
        scoreboardVisible = false;
        chat.browser.call('hideScoreboard');
        setNuiFocus(false, false);
    } else {
        scoreboardVisible = true;
        try {
            let players = await mp.events.callRemoteProc('getPlayers');
            setNuiFocus(true, true);
            chat.browser.call('showScoreboard', players, playerData.admin > 0);
        } catch (error) {
            console.error('Error getting players for scoreboard:', error);
        }
    }
});
let dialogCallback = null;
let DIALOG_OPEN = false;
mp.events.add('confirmInput', (input)=>{
    chat.browser.call('hideDialog');
    if (dialogCallback) dialogCallback(input);
    dialogCallback = null;
    mp.gui.cursor.show(false, false);
    mp.gui.cursor.visible = false;
    setTimeout(()=>{
        setNuiFocus(false, false);
        DIALOG_OPEN = false;
    }, 500);
});
mp.events.add('cancelInput', ()=>{
    chat.browser.call('hideDialog');
    setTimeout(()=>{
        DIALOG_OPEN = false;
    }, 500);
    setNuiFocus(false, false);
    if (typeof dialogCallback === 'function') {
        dialogCallback(false);
    }
    dialogCallback = null;
});
async function Dialog(title, message, cb) {
    while(DIALOG_OPEN){
        await new Promise((resolve)=>setTimeout(resolve, 500)
        );
    }
    dialogCallback = cb;
    chat.browser.call('showDialog', title, message);
    setNuiFocus(true, true);
    mp.gui.cursor.show(true, true);
    mp.gui.cursor.visible = true;
    DIALOG_OPEN = true;
}
let Voice = class Voice {
    static add(player) {
        Voice.listeners.push(player);
        player.isListening = true;
        mp.events.callRemote('voiceChat:addListener', player);
    }
    static remove(player) {
        Voice.listeners = Voice.listeners.filter((p)=>p !== player
        );
        player.isListening = false;
        mp.events.callRemote('voiceChat:removeListener', player);
    }
    static clear() {
        Voice.listeners.forEach((p)=>{
            p.isListening = false;
            mp.events.callRemote('voiceChat:removeListener', p);
        });
        Voice.listeners = [];
    }
};
Voice.listeners = [];
const TALK_KEY_N = 78; //N key
mp.keys.bind(TALK_KEY_N, true, ()=>{
    mp.voiceChat.muted = false;
    mp.voiceChat.advancedNoiseSuppression = true;
    mp.voiceChat.networkOptimisations = true;
    mp.voiceChat.defaultVolume = 1;
});
mp.keys.bind(TALK_KEY_N, false, ()=>{
    mp.voiceChat.muted = true;
});
const VOICE_PROXIMITY = 5;
async function VoiceChat() {
    while(true){
        mp.players.forEachInStreamRange((player)=>{
            if (player !== mp.players.local) {
                //@ts-ignore
                if (!player.isListening) {
                    const playerPos = player.position;
                    let dist = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z);
                    if (dist <= VOICE_PROXIMITY) {
                        Voice.add(player);
                    }
                } else {
                    let playerPos = player.position;
                    let dist = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z);
                    if (dist > VOICE_PROXIMITY) {
                        Voice.remove(player);
                    }
                }
            }
        });
        await Wait(1000);
    }
}
VoiceChat();
async function Speedometer() {
    while(true){
        if (!mp.players.local.vehicle) {
            chat.browser.call('hideSpeedo');
            break;
        }
        chat.browser.call('updateSpeedometer', {
            rpm: mp.players.local.vehicle.rpm * 9,
            speed: mp.players.local.vehicle.getSpeed(),
            gear: mp.players.local.vehicle.gear,
            engine: mp.players.local.vehicle.getEngineHealth()
        });
        await Wait(1);
    }
}
mp.events.add('playerEnterVehicle', ()=>{
    Speedometer();
});
let Blips = [];
mp.events.add('mp:loadBlips', (blips)=>{
    if (Blips.length > 0) {
        Blips.forEach((blip)=>{
            if (mp.blips.exists(blip.blipentity)) {
                blip.blipentity.destroy();
            }
        });
        Blips = [];
    }
    Blips = blips;
    Blips.forEach((blip)=>{
        blip.blipentity = mp.blips.new(blip.sprite, new mp.Vector3(blip.position.x, blip.position.y, blip.position.z), {
            color: blip.color,
            name: blip.name,
            scale: blip.scale,
            dimension: blip.dimension,
            shortRange: blip.shortRange
        });
    });
});
mp.events.add('corefx:playerReady', async ()=>{
    try {
        let blips = await mp.events.callRemoteProc('getBlips');
        mp.events.call('mp:loadBlips', blips);
    } catch (error) {
        console.error('Error getting blips:', error);
    }
});
mp.events.add('corefx:syncData', (data)=>{
    playerData = data;
});
mp.events.add('corefx:equipWeapon', (weapon, ammo = 0, weaponName)=>{
    mp.game.weapon.unequipEmptyWeapons = false;
    mp.players.local.giveWeapon(mp.game.joaat(weapon), ammo, true);
    setTimeout(()=>{
        //@ts-ignore
        chat.browser.call('equipWeapon', weapon, mp.players.local.getAmmoInClip(mp.game.joaat(weapon)), //@ts-ignore
        mp.players.local.getWeaponAmmo(mp.game.joaat(weapon)), weaponName);
    }, 500);
});
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
mp.events.add('corefx:unequipWeapon', (weapon)=>{
    let ammo = mp.players.local.weaponAmmo;
    if (ammo > 0) {
        mp.events.callRemote('corefx:updateWeaponAmmo', weapon, ammo);
    }
    chat.browser.call('unequipWeapon', weapon);
    mp.players.local.removeAllWeapons();
});
mp.events.add('playerWeaponShot', ()=>{
    let currentWeapon = mp.players.local.weapon;
    let currentAmmo = mp.players.local.weaponAmmo;
    if (currentAmmo === 0) {
        mp.events.callRemote('corefx:updateWeaponAmmoToEquiped', 0);
    }
    //@ts-ignore
    chat.browser.call('updateWeaponAmmo', mp.players.local.getAmmoInClip(currentWeapon), mp.players.local.getWeaponAmmo(currentWeapon));
});
mp.events.add('corefx:updateWeaponAmmo', (ammo = 0)=>{
    mp.players.local.weaponAmmo = ammo;
});
function isPositionFree(pos) {
    let vehicles = mp.vehicles.toArray().some((vehicle)=>{
        let distance = mp.game.system.vdist(pos.x, pos.y, pos.z, vehicle.position.x, vehicle.position.y, vehicle.position.z);
        return distance < 2;
    });
    let peds = mp.peds.toArray().some((ped)=>{
        let distance = mp.game.system.vdist(pos.x, pos.y, pos.z, ped.position.x, ped.position.y, ped.position.z);
        return distance < 2;
    });
    let objects = mp.objects.toArray().some((object)=>{
        let distance = mp.game.system.vdist(pos.x, pos.y, pos.z, object.position.x, object.position.y, object.position.z);
        return distance < 2;
    });
    return !(vehicles || peds || objects);
}

mp.events.add('inventory:updateDrops', (data)=>{
});
let invCar = null;
mp.events.add('corefx:playerReady', async ()=>{
// while(true){
//     if(drops.length > 0 && !closestDrop){
//         let playerPos = mp.players.local.position;
//         closestDrop = drops.filter((drop) => {
//             let distance = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, drop.position.x, drop.position.y, drop.position.z);
//             return distance < 2;
//         })[0] as any;
//     }else if(drops.length > 0 && closestDrop){
//         wait = 0
//         //drawmarker
//         //distance check
//         let playerPos = mp.players.local.position;
//         let distance = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, closestDrop.position.x, closestDrop.position.y, closestDrop.position.z);
//         if(distance > 2){
//             closestDrop = false
//         }else{
//         mp.game.graphics.drawMarker(20, closestDrop.position.x, closestDrop.position.y, closestDrop.position.z, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 255, 0, 0, 180, true, true, 0, true, null, null, false)
//         DrawText3D(`Drop`, new mp.Vector3(
//                 closestDrop.position.x,
//                 closestDrop.position.y,
//                 closestDrop.position.z,
//             ), 0.3, 0, [255, 255, 255, 255], false);
//         }
//     }
//     await new Promise<void>((resolve) => {
//         setTimeout(() => {
//             resolve();
//         }, wait);
//     })
// }
});
let INV_OPEN = false;
//register keybind on I key
mp.keys.bind(73, true, async ()=>{
    if (chat.on) return;
    if (INV_OPEN) return;
    if (DIALOG_OPEN) return;
    if (MENU_OPEN) return;
    INV_OPEN = true;
    setNuiFocus(true, true);
    let playerInventory = await mp.events.callRemoteProc('inventory:getPlayerInventory');
    let isInVehicle = mp.players.local.vehicle !== null;
    if (isInVehicle) {
        let vehicleInventory = await mp.events.callRemoteProc('getVehicleInventory', mp.players.local.vehicle.getNumberPlateText().replace(/\s/g, ''));
        if (vehicleInventory.success !== false) {
            vehicleInventory.inventory.data = {
                type: 'vehicle',
                identifier: `${vehicleInventory.inventory.identifier}`
            };
            chat.browser.call('openInventory', playerInventory, vehicleInventory.inventory);
        } else {
            chat.browser.call('openInventory', playerInventory, false);
        }
    } else {
        let closestVehicle = await mp.events.callRemoteProc('getClosestVehicleInventory');
        if (closestVehicle.success !== false) {
            //open trunk
            //find closest vehicle by plate (identiifer)
            mp.vehicles.forEach((vehicle)=>{
                if (vehicle.getNumberPlateText().replace(/\s/g, '') === closestVehicle.inventory.identifier) {
                    let trunkBoneIndex = vehicle.getBoneIndexByName('boot');
                    let trunkPos = vehicle.getWorldPositionOfBone(trunkBoneIndex);
                    let isNearTrunk = mp.game.system.vdist(mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z, trunkPos.x, trunkPos.y, trunkPos.z) < 1.7;
                    if (isNearTrunk) {
                        vehicle.setDoorOpen(5, false, false);
                        invCar = vehicle;
                        closestVehicle.inventory.data = {
                            type: 'vehicle',
                            identifier: closestVehicle.inventory.identifier
                        };
                        chat.browser.call('openInventory', playerInventory, closestVehicle.inventory);
                    } else {
                        chat.browser.call('openInventory', playerInventory, false);
                    }
                }
            });
        } else {
            chat.browser.call('openInventory', playerInventory, false);
        }
    }
    mp.gui.cursor.show(true, true);
    while(INV_OPEN){
        mp.gui.cursor.show(true, true);
        mp.game.ui.disableFrontendThisFrame();
        mp.gui.cursor.visible = true;
        await Wait(0);
    }
});
mp.events.add("inventory:close", ()=>{
    setNuiFocus(false, false);
    mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
    if (invCar && mp.vehicles.exists(invCar)) {
        invCar.setDoorShut(5, false);
    }
    invCar = null;
    setTimeout(()=>{
        INV_OPEN = false;
        mp.gui.cursor.visible = false;
        mp.gui.cursor.show(false, false);
    }, 500);
});
mp.events.add('inventory:moveItem', async (from, to)=>{
    let newInv = await mp.events.callRemoteProc('inventory:moveItem', from, to);
    chat.browser.call('updatePlayerInventory', newInv);
});
// mp.trigger('inventory:moveItemToSecondary', draggedFromSlot.value, targetSlotIndex + 1, secondaryInventoryData.value);
mp.events.add('inventory:moveItemToSecondary', async (from, to, moveData)=>{
    moveData = JSON.parse(moveData);
    // let newInv = await mp.events.callRemoteProc('inventory:moveItemToSecondary', from, to, x);
    // chat.browser.call('updatePlayerInventory', newInv);
    Dialog('Muta item', "Introdu cantitatea", async (quantity)=>{
        quantity = parseInt(quantity);
        if (isNaN(quantity)) return;
        let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:moveItemToSecondary', from, to, JSON.stringify(moveData), quantity);
        if (success === false) {
            chat.sendLocalMessage(`Nu ai destule iteme`);
        } else {
            chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
        }
    });
});
//moveitemtoprimary
mp.events.add('inventory:moveItemToPrimary', async (from, to, moveData)=>{
    moveData = JSON.parse(moveData);
    // let newInv = await mp.events.callRemoteProc('inventory:moveItemToSecondary', from, to, x);
    // chat.browser.call('updatePlayerInventory', newInv);
    Dialog('Muta item', "Introdu cantitatea", async (quantity)=>{
        quantity = parseInt(quantity);
        if (isNaN(quantity)) return;
        let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:moveItemToPrimary', from, to, JSON.stringify(moveData), quantity);
        if (success === false) {
            chat.sendLocalMessage(`Nu ai destule iteme`);
            chat.browser.call('closeInventory');
            INV_OPEN = false;
            mp.gui.cursor.show(false, false);
            mp.gui.cursor.visible = false;
        } else {
            chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
        }
    });
});
function isWeapon(item) {
    return item.startsWith('weapon_');
}
function isAmmo(item) {
    return item.endsWith('_ammo');
}
// @click="mp.trigger('inventory:useItem', contextMenu.selectedSlot)"
mp.events.add('inventory:useItem', async (slot)=>{
    let itemInSlot = playerData.inventory.items.find((item)=>item.slot === slot
    );
    if (isWeapon(itemInSlot.name)) {
        let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:useItem', slot, 1);
        if (success === false) {
            chat.sendLocalMessage(`Nu ai destule iteme`);
        } else {
            chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
        }
        return;
    }
    Dialog('Foloseste item', "Introdu cantitatea", async (quantity)=>{
        if (!quantity) quantity = 1;
        quantity = parseInt(quantity);
        let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:useItem', slot, quantity);
        if (success === false) {
            chat.sendLocalMessage(`Nu ai destule iteme`);
        } else {
            chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
        }
    });
});
mp.events.add('inventory:dropItem', async (slot)=>{
    Dialog('Drop item', "Introdu cantitatea", async (quantity)=>{
        if (!quantity) quantity = 1;
        quantity = parseInt(quantity);
        let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:dropItem', slot, quantity);
        if (success === false) {
            chat.sendLocalMessage(`Nu ai destule iteme`);
        } else {
            chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
        }
    });
});
//inventory:giveItem (dialog for player id, another one for amount)
mp.events.add('inventory:giveItem', async (slot)=>{
    Dialog('Da item', "Introdu id-ul jucatorului", async (playerId)=>{
        Dialog('Da item', "Introdu cantitatea", async (quantity)=>{
            if (!quantity) quantity = 1;
            quantity = parseInt(quantity);
            let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:giveItemToPlayer', slot, playerId, quantity);
            if (success === false) {
                chat.sendLocalMessage(`Nu ai destule iteme`);
            } else {
                chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
            }
        });
    });
});
//key bind 1 to 5 to use item from these slots
mp.keys.bind(49, true, async ()=>{
    if (chat.on) return;
    if (INV_OPEN) return;
    if (DIALOG_OPEN) return;
    if (MENU_OPEN) return;
    let itemInSlot = playerData.inventory.items.find((item)=>item.slot === 1
    );
    if (!itemInSlot) return;
    if (isAmmo(itemInSlot.name)) {
        //dialog
        Dialog('Foloseste item', "Introdu cantitatea", async (quantity)=>{
            if (!quantity) quantity = 1;
            quantity = parseInt(quantity);
            let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:useItem', 1, quantity);
            if (success === false) {
                chat.sendLocalMessage(`Nu ai destule iteme`);
            } else {
                chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
            }
        });
        return;
    }
    let { playerInventory: playerInventory1 , secondaryInventory: secondaryInventory1 , success: success1  } = await mp.events.callRemoteProc('inventory:useItem', 1, 1);
    if (success1 === false) {
        chat.sendLocalMessage(`Nu ai destule iteme`);
    } else {
        chat.browser.call('updatePlayerInventory', playerInventory1, secondaryInventory1);
    }
}) // 1
;
mp.keys.bind(50, true, async ()=>{
    if (chat.on) return;
    if (INV_OPEN) return;
    if (DIALOG_OPEN) return;
    if (MENU_OPEN) return;
    let itemInSlot = playerData.inventory.items.find((item)=>item.slot === 2
    );
    if (!itemInSlot) return;
    if (isAmmo(itemInSlot.name)) {
        //dialog
        Dialog('Foloseste item', "Introdu cantitatea", async (quantity)=>{
            if (!quantity) quantity = 1;
            quantity = parseInt(quantity);
            let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:useItem', 2, quantity);
            if (success === false) {
                chat.sendLocalMessage(`Nu ai destule iteme`);
            } else {
                chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
            }
        });
        return;
    }
    let { playerInventory: playerInventory2 , secondaryInventory: secondaryInventory2 , success: success2  } = await mp.events.callRemoteProc('inventory:useItem', 2, 1);
    if (success2 === false) {
        chat.sendLocalMessage(`Nu ai destule iteme`);
    } else {
        chat.browser.call('updatePlayerInventory', playerInventory2, secondaryInventory2);
    }
}) // 2
;
mp.keys.bind(51, true, async ()=>{
    if (chat.on) return;
    if (INV_OPEN) return;
    if (DIALOG_OPEN) return;
    if (MENU_OPEN) return;
    let itemInSlot = playerData.inventory.items.find((item)=>item.slot === 3
    );
    if (!itemInSlot) return;
    if (isAmmo(itemInSlot.name)) {
        //dialog
        Dialog('Foloseste item', "Introdu cantitatea", async (quantity)=>{
            if (!quantity) quantity = 1;
            quantity = parseInt(quantity);
            let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:useItem', 3, quantity);
            if (success === false) {
                chat.sendLocalMessage(`Nu ai destule iteme`);
            } else {
                chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
            }
        });
        return;
    }
    let { playerInventory: playerInventory3 , secondaryInventory: secondaryInventory3 , success: success3  } = await mp.events.callRemoteProc('inventory:useItem', 3, 1);
    if (success3 === false) {
        chat.sendLocalMessage(`Nu ai destule iteme`);
    } else {
        chat.browser.call('updatePlayerInventory', playerInventory3, secondaryInventory3);
    }
}) // 3
;
mp.keys.bind(52, true, async ()=>{
    if (chat.on) return;
    if (INV_OPEN) return;
    if (DIALOG_OPEN) return;
    if (MENU_OPEN) return;
    let itemInSlot = playerData.inventory.items.find((item)=>item.slot === 4
    );
    if (!itemInSlot) return;
    if (isAmmo(itemInSlot.name)) {
        //dialog
        Dialog('Foloseste item', "Introdu cantitatea", async (quantity)=>{
            if (!quantity) quantity = 1;
            quantity = parseInt(quantity);
            let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:useItem', 4, quantity);
            if (success === false) {
                chat.sendLocalMessage(`Nu ai destule iteme`);
            } else {
                chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
            }
        });
        return;
    }
    let { playerInventory: playerInventory4 , secondaryInventory: secondaryInventory4 , success: success4  } = await mp.events.callRemoteProc('inventory:useItem', 4, 1);
    if (success4 === false) {
        chat.sendLocalMessage(`Nu ai destule iteme`);
    } else {
        chat.browser.call('updatePlayerInventory', playerInventory4, secondaryInventory4);
    }
}) // 4
;
mp.keys.bind(53, true, async ()=>{
    if (chat.on) return;
    if (INV_OPEN) return;
    if (DIALOG_OPEN) return;
    if (MENU_OPEN) return;
    let itemInSlot = playerData.inventory.items.find((item)=>item.slot === 5
    );
    if (!itemInSlot) return;
    if (isAmmo(itemInSlot.name)) {
        //dialog
        Dialog('Foloseste item', "Introdu cantitatea", async (quantity)=>{
            if (!quantity) quantity = 1;
            quantity = parseInt(quantity);
            let { playerInventory , secondaryInventory , success  } = await mp.events.callRemoteProc('inventory:useItem', 5, quantity);
            if (success === false) {
                chat.sendLocalMessage(`Nu ai destule iteme`);
            } else {
                chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
            }
        });
        return;
    }
    let { playerInventory: playerInventory5 , secondaryInventory: secondaryInventory5 , success: success5  } = await mp.events.callRemoteProc('inventory:useItem', 5, 1);
    if (success5 === false) {
        chat.sendLocalMessage(`Nu ai destule iteme`);
    } else {
        chat.browser.call('updatePlayerInventory', playerInventory5, secondaryInventory5);
    }
}) // 5
;

mp.gui.chat.activate(false);
mp.gui.chat.show(false);
// T to open chat
mp.keys.bind(84, false, ()=>{
    if (DIALOG_OPEN) return;
    if (INV_OPEN) return;
    mp.console.logInfo('T pressed');
    chat.open();
});
var registeredCommands = {
};
mp.console.logInfo(`${mp.players.local.ip}`);
var chat = {
    browser: getBrowser(),
    on: false,
    commands: {
    },
    open: async ()=>{
        let shouldUseLocal = await mp.events.callRemoteProc('isDevOrPlayer');
        //shoudluselocal is string ('true', 'false)
        if (shouldUseLocal == 'true' && chat.browser.url != 'http://localhost:5173') {
            // chat.browser.url = `http://localhost:5173`
            chat.browser.call('prefferedIp', 'localhost');
        }
        if (shouldUseLocal == 'false' && chat.browser.url != `http://${SERVER_PUBLIC_IP}:5173`) {
            // chat.browser.url = `http://${SERVER_PUBLIC_IP}:5173`
            chat.browser.call('prefferedIp', SERVER_PUBLIC_IP);
        }
        //filter registerCommands where playerData.admin is less
        for (const cmd of Object.values(chat.commands)){
            if (playerData.admin < cmd.admin) {
                delete registeredCommands[cmd.name];
            }
        }
        chat.browser.call('chat:open', JSON.stringify(registeredCommands));
        chat.on = true;
        setNuiFocus(true, false);
        while(chat.on){
            mp.gui.cursor.show(true, true);
            mp.game.ui.disableFrontendThisFrame();
            await new Promise((resolve)=>setTimeout(resolve, 1)
            );
        }
        mp.gui.cursor.show(false, false); //hide cursor
    },
    async sendLocalMessage (message) {
        let shouldUseLocal = await mp.events.callRemoteProc('isDevOrPlayer');
        //shoudluselocal is string ('true', 'false)
        if (shouldUseLocal == 'true' && chat.browser.url != 'http://localhost:5173') {
            // chat.browser.url = `http://localhost:5173`
            chat.browser.call('prefferedIp', 'localhost');
        }
        if (shouldUseLocal == 'false' && chat.browser.url != `http://${SERVER_PUBLIC_IP}:5173`) {
            // chat.browser.url = `http://${SERVER_PUBLIC_IP}:5173`
            chat.browser.call('prefferedIp', SERVER_PUBLIC_IP);
        }
        chat.browser.call('chat:addMessage', message);
    },
    registerCommand (command, callback, description, usage, admin = 0) {
        if (chat.commands[command]) {
            mp.console.logError(`Command ${command} already exists.`);
            return; // Prevent overwriting
        }
        chat.commands[command] = {
            name: command,
            callback,
            description,
            usage,
            admin
        };
    },
    async sendMessage (message) {
        chat.on = false;
        setNuiFocus(false, false);
        let shouldUseLocal = await mp.events.callRemoteProc('isDevOrPlayer');
        //shoudluselocal is string ('true', 'false)
        if (shouldUseLocal == 'true' && chat.browser.url != 'http://localhost:5173') {
            // chat.browser.url = `http://localhost:5173`
            chat.browser.call('prefferedIp', 'localhost');
        }
        if (shouldUseLocal == 'false' && chat.browser.url != `http://${SERVER_PUBLIC_IP}:5173`) {
            // chat.browser.url = `http://${SERVER_PUBLIC_IP}:5173`
            chat.browser.call('prefferedIp', SERVER_PUBLIC_IP);
        }
        if (message.startsWith('/')) {
            const [cmdName, ...args] = message.slice(1).split(' ');
            const cmd = chat.commands[cmdName];
            setNuiFocus(false, false);
            if (cmd) {
                if (playerData.admin < cmd.admin) {
                    chat.sendLocalMessage('^2[ERROR] ^0You do not have permission to use this command.');
                    return;
                }
                // --- ARGUMENT CHECKING ---
                const requiredArgs = (cmd.usage.match(/\[(.*?)\]/g) || []).map((arg)=>arg.slice(1, -1)
                ); // Extract required args
                const numRequiredArgs = requiredArgs.length;
                if (args.length < numRequiredArgs) {
                    chat.sendLocalMessage(`^1[USAGE]^0 ${cmd.usage}`); // Show the full usage
                    return;
                }
                // --- END ARGUMENT CHECKING ---
                cmd.callback(args);
            } else {
                mp.events.callRemote('chat:command', message);
            }
        } else {
            mp.events.callRemote('chat:message', message);
        }
    }
};
mp.events.add('chat:close', ()=>{
    chat.on = false;
    setNuiFocus(false, false);
});
chat.browser.active = true;
chat.browser.markAsChat();
async function initChat() {
    const response = await mp.events.callRemoteProc('getServerCommands');
    for (const cmd of Object.values(chat.commands)){
        registeredCommands[cmd.name] = {
            name: cmd.name,
            description: cmd.description,
            usage: cmd.usage,
            admin: cmd.admin
        };
    }
    if (response) {
        for (const cmd of response){
            registeredCommands[cmd.name] = {
                name: cmd.name,
                description: cmd.description,
                usage: cmd.usage,
                admin: cmd.admin
            };
        }
    }
}
initChat();
mp.events.add('chat:sendMessage', chat.sendMessage);
mp.events.add('chat:addMessage', chat.sendLocalMessage);
mp.events.add('chat:clear', ()=>{
    chat.browser.call('chat:clear');
});
chat.registerCommand('reload', ()=>{
    mp.events.callRemote('playerReload');
}, 'Reloads your data', '/reload', 0);
mp.events.add('corefx:playerReady', async ()=>{
    let shouldUseLocal = await mp.events.callRemoteProc('isDevOrPlayer');
    //shoudluselocal is string ('true', 'false)
    if (shouldUseLocal == 'true' && chat.browser.url != 'http://localhost:5173') {
        chat.browser.url = `http://localhost:5173`;
        chat.browser.call('prefferedIp', 'localhost');
    }
    if (shouldUseLocal == 'false' && chat.browser.url != `http://${SERVER_PUBLIC_IP}:5173`) {
        chat.browser.url = `http://${SERVER_PUBLIC_IP}:5173`;
        chat.browser.call('prefferedIp', SERVER_PUBLIC_IP);
    }
});
chat.registerCommand('menu', ()=>{
    let menu = Menu('Test Menu', 'This is a test menu', []);
    addMenuItem(menu.id, {
        text: 'Test btn',
        subtext: 'This is a test button',
        type: 'default',
        cb: ()=>{
        },
        icon: 'fas fa-hashtag'
    });
    showMenu(menu.id);
}, 'Menu', '/menu', 0);
// mp.events.add('render', () => {
//     if (mp.players.local.vehicle) {
//         const steeringAngle = mp.players.local.vehicle.steeringAngle;
//         if (steeringAngle > 10) {
//             mp.players.local.vehicle.setIndicatorLights(0, false);
//             mp.players.local.vehicle.setIndicatorLights(1, true);
//         } else if (steeringAngle < -10) {
//             mp.players.local.vehicle.setIndicatorLights(1, false);
//             mp.players.local.vehicle.setIndicatorLights(0, true);
//         } else if (steeringAngle < 10 && steeringAngle > -10) {
//             mp.players.local.vehicle.setIndicatorLights(0, false);
//             mp.players.local.vehicle.setIndicatorLights(1, false);
//         }
//     }
// });
mp.events.add('playerExitVehicle', (player, vehicle)=>{
    chat.browser.call('hideSpeedo');
});
chat.registerCommand('fixui', async ()=>{
    let shouldUseLocal = await mp.events.callRemoteProc('isDevOrPlayer');
    //shoudluselocal is string ('true', 'false)
    if (shouldUseLocal == 'true') {
        // chat.browser.url = `http://localhost:5173`
        chat.browser.call('prefferedIp', 'localhost');
    }
    if (shouldUseLocal == 'false') {
        // chat.browser.url = `http://${SERVER_PUBLIC_IP}:5173`
        chat.browser.call('prefferedIp', SERVER_PUBLIC_IP);
    }
}, 'Fixes the UI', '/fixui', 0);

class CameraManager {
    // Singleton getter
    static getInstance() {
        if (!CameraManager.instance) {
            CameraManager.instance = new CameraManager();
        }
        return CameraManager.instance;
    }
    // Configuration setter
    configure(options) {
        this.config = {
            ...this.config,
            ...options
        };
    }
    getLocalPlayer() {
        return mp.players.local.handle;
    }
    async activateCamera(boneId = this.config.defaultBoneId) {
        const player = mp.players.local;
        // Get bone position and ensure it's a Vector3
        const boneCoords = new mp.Vector3(player.getBoneCoords(boneId, 0, 0, 0).x, player.getBoneCoords(boneId, 0, 0, 0).y, player.getBoneCoords(boneId, 0, 0, 0).z);
        // Adjust bone coordinates for legs view
        if (boneId === 11816) {
            boneCoords.z -= 0.4; // Move the entire camera setup lower
        }
        mp.console.logInfo(`Bone coordinates: ${boneCoords.x}, ${boneCoords.y}, ${boneCoords.z}`);
        const { cameraPosition , cameraAngle  } = this.calculateCameraPosition(player, boneCoords, {
            height: this.config.cameraHeight,
            distance: this.config.cameraDistance
        });
        mp.console.logInfo(`Final camera position: ${cameraPosition.x}, ${cameraPosition.y}, ${cameraPosition.z}`);
        this.initialCamPos = cameraPosition;
        const newCam = this.setupCamera(cameraPosition, player, cameraAngle, boneCoords);
        await this.transitionToNewCamera(newCam);
        this.enableCameraControls(player);
    }
    calculateCameraPosition(player, boneCoords, adjustments) {
        const playerHeading = player.getHeading();
        const angleInRadians = playerHeading % 360 * Math.PI / 180;
        // Calculate camera position with separate height and distance adjustments
        const cameraPosition = new mp.Vector3(boneCoords.x - Math.sin(angleInRadians) * adjustments.distance, boneCoords.y + Math.cos(angleInRadians) * adjustments.distance, boneCoords.z - adjustments.height // This directly affects the camera's height
        );
        return {
            cameraPosition,
            cameraAngle: angleInRadians
        };
    }
    setupCamera(position, player, angle, targetCoords) {
        mp.console.logInfo(`Creating camera at position: ${position.x}, ${position.y}, ${position.z}`);
        const cam = mp.cameras.new('default', position, new mp.Vector3(0, 0, 0), this.config.cameraFOV);
        if (cam) {
            mp.console.logInfo(`Pointing camera at bone: ${targetCoords.x}, ${targetCoords.y}, ${targetCoords.z}`);
            const originalHeading = player.getHeading();
            const newHeading = (originalHeading + 180) % 360;
            cam.setRot(0, 0, newHeading, 2);
            // Point at bone position instead of player position
            cam.pointAtCoord(targetCoords.x, targetCoords.y, targetCoords.z);
            return cam.handle;
        }
        return -1;
    }
    setupDepthOfField(camera, camPos, player) {
        const distanceToPed = camPos.subtract(player.position).length();
        camera.setFarDof(distanceToPed + this.config.dofFarOffset);
        camera.setNearDof(Math.max(0.1, distanceToPed - this.config.dofNearOffset));
        camera.setDofStrength(this.config.dofStrength);
        camera.setUseShallowDofMode(true);
    }
    async transitionToNewCamera(newCam) {
        if (this.currentCam !== -1) {
            await new Promise((resolve)=>setTimeout(resolve, this.config.transitionDuration)
            );
            mp.game.cam.destroy(this.currentCam, false);
        } else {
            mp.game.cam.setActive(newCam, true);
        }
        this.currentCam = newCam;
        mp.game.cam.renderScriptCams(true, false, 0, true, true);
    }
    enableCameraControls(player) {
        player.freezePosition(true);
        this.cameraRotationActive = true;
        if (!this.rotationTickStarted) {
            this.startRotationTick();
            this.rotationTickStarted = true;
        }
    }
    startRotationTick() {
        const controlsToDisable = [
            30,
            31,
            32,
            33,
            34,
            35,
            24,
            25,
            45 // Reload
        ];
        mp.events.add('render', async ()=>{
            if (this.cameraRotationActive && this.currentCam !== -1) {
                controlsToDisable.forEach((control)=>{
                    mp.game.controls.disableControlAction(0, control, true);
                });
            }
            await new Promise((resolve)=>setTimeout(resolve, 1)
            );
        });
    }
    disableCamera() {
        this.cameraRotationActive = false;
        this.initialCamPos = null;
        if (this.currentCam !== -1) {
            mp.game.cam.destroy(this.currentCam, false);
            this.currentCam = -1;
        }
        mp.game.cam.renderScriptCams(false, false, 0, true, true);
    }
    // Prevent direct construction
    constructor(){
        this.currentCam = -1;
        this.cameraRotationActive = false;
        this.rotationTickStarted = false;
        this.initialCamPos = null;
        // Configuration options with defaults
        this.config = {
            cameraDistance: 2,
            cameraHeight: 0.5,
            defaultBoneId: 31086,
            cameraFOV: 30,
            transitionDuration: 1500,
            dofStrength: 1,
            dofNearOffset: 0.5,
            dofFarOffset: 0.5
        };
    }
}
CameraManager.instance = null;
// Export a function to get the instance
const getCameraManager = ()=>{
    return CameraManager.getInstance();
};
chat.registerCommand('camera', (_args)=>{
    const cameraManager = getCameraManager();
    cameraManager.activateCamera(31086);
}, 'Activate camera', '/camera', 1);
//stopcamera
chat.registerCommand('stopcamera', (_args)=>{
    const cameraManager = getCameraManager();
    cameraManager.disableCamera();
    //unfreeze player
    mp.players.local.freezePosition(false);
}, 'Stop camera', '/stopcamera', 1);

var getNormalizedVector = function(vector) {
    var mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    vector.x = vector.x / mag;
    vector.y = vector.y / mag;
    vector.z = vector.z / mag;
    return vector;
};
var getCrossProduct = function(v1, v2) {
    var vector = new mp.Vector3(0, 0, 0);
    vector.x = v1.y * v2.z - v1.z * v2.y;
    vector.y = v1.z * v2.x - v1.x * v2.z;
    vector.z = v1.x * v2.y - v1.y * v2.x;
    return vector;
};
var bindVirtualKeys = {
    F2: 113
};
var bindASCIIKeys = {
    Q: 69,
    E: 81,
    LCtrl: 17,
    Shift: 16
};
var isNoClip = false;
var noClipCamera;
var shiftModifier = false;
var controlModifier = false;
var localPlayer = mp.players.local;
mp.keys.bind(bindVirtualKeys.F2, true, function() {
    isNoClip = !isNoClip;
    if (playerData.admin < 1) return chat.sendLocalMessage('^2[ERROR]^0 You do not have permission to use this command.');
    mp.game.ui.displayRadar(!isNoClip);
    if (isNoClip) {
        startNoClip();
    } else {
        stopNoClip();
    }
});
function startNoClip() {
    var camPos = new mp.Vector3(localPlayer.position.x, localPlayer.position.y, localPlayer.position.z);
    var camRot = mp.game.cam.getGameplayCamRot(2);
    noClipCamera = mp.cameras.new('default', camPos, camRot, 45);
    noClipCamera.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    localPlayer.freezePosition(true);
    localPlayer.setInvincible(true);
    localPlayer.setVisible(false, false);
    localPlayer.setCollision(false, false);
}
function stopNoClip() {
    if (noClipCamera) {
        localPlayer.position = noClipCamera.getCoord();
        localPlayer.setHeading(noClipCamera.getRot(2).z);
        noClipCamera.destroy(true);
        noClipCamera = null;
    }
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    localPlayer.freezePosition(false);
    localPlayer.setInvincible(false);
    localPlayer.setVisible(true, false);
    localPlayer.setCollision(true, false);
}
mp.events.add('render', function() {
    if (!noClipCamera || mp.gui.cursor.visible) {
        return;
    }
    controlModifier = mp.keys.isDown(bindASCIIKeys.LCtrl);
    shiftModifier = mp.keys.isDown(bindASCIIKeys.Shift);
    var rot = noClipCamera.getRot(2);
    var fastMult = 1;
    var slowMult = 1;
    if (shiftModifier) {
        fastMult = 3;
    } else if (controlModifier) {
        slowMult = 0.5;
    }
    var rightAxisX = mp.game.controls.getDisabledControlNormal(0, 220);
    var rightAxisY = mp.game.controls.getDisabledControlNormal(0, 221);
    var leftAxisX = mp.game.controls.getDisabledControlNormal(0, 218);
    var leftAxisY = mp.game.controls.getDisabledControlNormal(0, 219);
    var pos = noClipCamera.getCoord();
    var rr = noClipCamera.getDirection();
    var vector = new mp.Vector3(0, 0, 0);
    vector.x = rr.x * leftAxisY * fastMult * slowMult;
    vector.y = rr.y * leftAxisY * fastMult * slowMult;
    vector.z = rr.z * leftAxisY * fastMult * slowMult;
    var upVector = new mp.Vector3(0, 0, 1);
    var rightVector = getCrossProduct(getNormalizedVector(rr), getNormalizedVector(upVector));
    rightVector.x *= leftAxisX * 0.5;
    rightVector.y *= leftAxisX * 0.5;
    rightVector.z *= leftAxisX * 0.5;
    var upMovement = 0;
    if (mp.keys.isDown(bindASCIIKeys.Q)) {
        upMovement = 0.5;
    }
    var downMovement = 0;
    if (mp.keys.isDown(bindASCIIKeys.E)) {
        downMovement = 0.5;
    }
    mp.players.local.position = new mp.Vector3(pos.x + vector.x + 1, pos.y + vector.y + 1, pos.z + vector.z + 1);
    mp.players.local.heading = rr.z;
    noClipCamera.setCoord(pos.x - vector.x + rightVector.x, pos.y - vector.y + rightVector.y, pos.z - vector.z + rightVector.z + upMovement - downMovement);
    noClipCamera.setRot(rot.x + rightAxisY * -5, 0, rot.z + rightAxisX * -5, 2);
});
chat.registerCommand('nc', ()=>{
    isNoClip = !isNoClip;
    if (playerData.admin < 1) return chat.sendLocalMessage('^2[ERROR]^0 You do not have permission to use this command.');
    mp.game.ui.displayRadar(!isNoClip);
    if (isNoClip) {
        startNoClip();
    } else {
        stopNoClip();
    }
}, 'Toggle NoClip', '/nc', 1);

let IS_CHAR_CREATOR_ON = false;
const CHAR_CREATOR_POS = {
    x: -1120.9315185546875,
    y: -2819.373779296875,
    z: 20.7616447449,
    h: -33.884307861328125
};
mp.events.add('corefx:playerReady', async ()=>{
    let isNew = playerData.character.firstName === 'Unknown';
    mp.console.logInfo(`isNew: ${isNew}`);
    if (!isNew) {
        mp.events.callRemote('setClothes', playerData.character.appearance);
        return;
    }
    // Set ped default comp (if needed)
    // mp.players.local.setDefaultComponentVariation();
    mp.game.cam.doScreenFadeOut(1000);
    mp.players.local.setCoords(CHAR_CREATOR_POS.x, CHAR_CREATOR_POS.y, CHAR_CREATOR_POS.z, false, false, false, false);
    mp.players.local.freezePosition(true);
    mp.players.local.setHeading(CHAR_CREATOR_POS.h);
    mp.gui.cursor.visible = true;
    IS_CHAR_CREATOR_ON = true;
    chat.browser.call('hideUi');
    await new Promise((resolve)=>{
        setTimeout(()=>{
            resolve();
        }, 1000);
    });
    const cameraManager = getCameraManager();
    cameraManager.activateCamera(31086);
    chat.browser.call('showCharCreator', playerData);
    while(IS_CHAR_CREATOR_ON){
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);
        await new Promise((resolve)=>{
            setTimeout(()=>{
                resolve();
            }, 1);
        });
    }
});
mp.events.add('cl:log', (msg)=>{
    chat.sendLocalMessage(msg);
    mp.console.logInfo(msg);
});
let components = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11
];
let props = [
    0,
    1,
    2,
    6,
    7
];
// Updated functions to get current and max values
function getPlayerComponentsCount() {
    let comps = [];
    components.forEach((comp)=>{
        const drawable = mp.players.local.getDrawableVariation(comp);
        comps.push({
            component_id: comp,
            drawable: drawable,
            texture: mp.players.local.getTextureVariation(comp),
            max_drawable: mp.players.local.getNumberOfDrawableVariations(comp),
            max_texture: mp.players.local.getNumberOfTextureVariations(comp, drawable) // Maximum texture for current drawable
        });
    });
    return comps;
}
function getPlayerPropsCount() {
    let propsData = [];
    props.forEach((prop)=>{
        propsData.push({
            prop_id: prop,
            drawable: mp.players.local.getPropIndex(prop),
            texture: mp.players.local.getPropTextureIndex(prop),
            max_drawable: mp.players.local.getNumberOfPropDrawableVariations(prop),
            max_texture: mp.players.local.getNumberOfPropTextureVariations(prop, mp.players.local.getPropIndex(prop)) // Maximum texture for current drawable
        });
    });
    return propsData;
}
mp.events.add('cl:setModel', (modelName)=>{
    mp.players.local.model = mp.game.joaat(modelName);
});
// Update a specific face feature
mp.events.add('cl:updateFeature', (featureIndex, value)=>{
    mp.events.callRemote('updateFeature', featureIndex, value);
});
// Update overall character appearance (parents and similarity)
mp.events.add('cl:updateCharacterAppearance', (father, mother, similarity)=>{
    mp.events.callRemote('updateCharacterAppearance', father, mother, similarity);
});
mp.events.add('cl:openClothes', ()=>{
    const componentsData = getPlayerComponentsCount();
    const propsData = getPlayerPropsCount();
    mp.events.callRemote("startCustomization");
    chat.browser.call('clothesData', componentsData, propsData);
});
mp.events.add('cl:openCloth', ()=>{
    const componentsData = getPlayerComponentsCount();
    const propsData = getPlayerPropsCount();
    mp.events.callRemote("startCustomization");
    chat.browser.call('clothData', componentsData, propsData);
});
// Update a specific appearance item (blemishes, facial hair, etc.)
mp.events.add('cl:updateAppearance', (overlayId, value)=>{
    const overlayVariation = parseInt(value);
    mp.events.callRemote('updateAppearance', overlayId, overlayVariation);
});
// Update a color for hair and other colored overlays
mp.events.add('cl:updateColor', (overlayId, color)=>{
    mp.events.callRemote('updateColor', overlayId, color);
});
// Update a component variation (drawable and texture)
mp.events.add('cl:updateComponent', (componentId, drawable, texture)=>{
    mp.events.callRemote('updateComponent', componentId, drawable, texture);
});
// Update a prop variation (drawable and texture)
mp.events.add('cl:updateProp', (propId, drawable, texture)=>{
    mp.events.callRemote('updateProp', propId, drawable, texture);
});
mp.events.add('cl:createCharacter', (model, lastName, firstName, age, height)=>{
    IS_CHAR_CREATOR_ON = false;
    chat.browser.call('showUi');
    mp.players.local.freezePosition(false);
    mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
    CameraManager.getInstance().disableCamera();
    mp.events.callRemote('createCharacter', model, lastName, firstName, age, height);
});
mp.events.add('cl:switchCamera', (cam)=>{
    if (cam === 'head') {
        CameraManager.getInstance().disableCamera();
        CameraManager.getInstance().activateCamera(31086);
    } else if (cam === 'body') {
        CameraManager.getInstance().disableCamera();
        CameraManager.getInstance().activateCamera(24818);
    } else {
        CameraManager.getInstance().disableCamera();
        CameraManager.getInstance().activateCamera(11816);
    }
});
mp.events.add('cl:updateHairColor', (color)=>{
    mp.events.callRemote('updateHairColor', color);
});
mp.events.add('cl:saveClothing', ()=>{
    mp.events.callRemote('saveClothing');
    CameraManager.getInstance().disableCamera();
    //unfreeze player
    IS_CHAR_CREATOR_ON = false;
    mp.players.local.freezePosition(false);
    mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
    chat.browser.call('showUi');
});
chat.registerCommand('clothes', async ()=>{
    let componentsData = getPlayerComponentsCount();
    //remove hair from componentsData
    componentsData = componentsData.filter((comp)=>comp.component_id !== 2
    );
    const propsData = getPlayerPropsCount();
    chat.browser.call('showClothingShop', componentsData, propsData);
    IS_CHAR_CREATOR_ON = true;
    mp.gui.cursor.visible = true;
    mp.gui.cursor.show(true, true);
    mp.players.local.freezePosition(true);
    CameraManager.getInstance().activateCamera(31086);
    chat.browser.call('hideUi');
    while(IS_CHAR_CREATOR_ON){
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);
        await new Promise((resolve)=>{
            setTimeout(()=>{
                resolve();
            }, 1);
        });
    }
}, 'Open clothes menu', '/clothes', 13);

const lastDrawCallTime = {
}; // Track last DrawInteract call time
const hideDelay = 250; // Match the Vue component's hideDelay
function DrawInteract(key, text, subtext, pos) {
    var ref;
    const screen2d = mp.game.graphics.getScreenCoordFromWorldCoord(pos.x, pos.y, pos.z);
    if (!screen2d) return;
    const distance = mp.game.system.vdist(pos.x, pos.y, pos.z, mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z);
    const screenResolution = mp.game.graphics.getActiveScreenResolution();
    const screenX = screen2d.screenX * screenResolution.x;
    const screenY = screen2d.screenY * screenResolution.y;
    const id = key; // Use the key as a unique identifier instead of position
    //
    lastDrawCallTime[id] = Date.now(); // Record the time of the DrawInteract call
    if (chat === null || chat === void 0 ? void 0 : (ref = chat.browser) === null || ref === void 0 ? void 0 : ref.call) {
        chat.browser.call('addOrUpdateInteract', id, key, text, subtext, screenX, screenY, distance);
    } else {
        console.error("chat.browser is not defined or doesn't have a 'call' method!");
    }
}
mp.events.add('render', ()=>{
    // --- Your game logic goes here.  Call DrawInteract as needed. ---
    // --- End of your game logic ---
    // Cleanup based on lastDrawCallTime (client-side)
    const now = Date.now();
    for(const id in lastDrawCallTime){
        if (now - lastDrawCallTime[id] > hideDelay) {
            delete lastDrawCallTime[id]; // Remove stale entries
        }
    }
});

// --- Vehicle Mods Data and Logic ---
let vehicleModsData = null;
let currentVehicle = null;
let previewMod = null; // Store the mod being previewed
let originalMods = {
}; // Store original mods before tuning
let lastPaidMods = {
}; // Store last paid mods
// --- Pricing Data ---
const modPrices = {
    "Spoilers": {
        default: 500
    },
    "Front Bumper": {
        default: 750
    },
    "Rear Bumper": {
        default: 750
    },
    "Side Skirt": {
        default: 600
    },
    "Exhaust": {
        default: 800
    },
    "Frame": {
        default: 400
    },
    "Grille": {
        default: 550
    },
    "Hood": {
        default: 900
    },
    "Fender": {
        default: 650
    },
    "Right Fender": {
        default: 650
    },
    "Roof": {
        default: 700
    },
    "Engine": {
        "EMS Upgrade, Level 1": 1500,
        "EMS Upgrade, Level 2": 2500,
        "EMS Upgrade, Level 3": 3500,
        "EMS Upgrade, Level 4": 5000
    },
    "Brakes": {
        "Street Brakes": 1200,
        "Sport Brakes": 1800,
        "Race Brakes": 2500
    },
    "Transmission": {
        "Street Transmission": 1400,
        "Sports Transmission": 2000,
        "Race Transmission": 3000
    },
    "Horns": {
        default: 200
    },
    "Suspension": {
        "Lowered Suspension": 1000,
        "Street Suspension": 1600,
        "Sport Suspension": 2200,
        "Competition Suspension": 3200
    },
    "Armor": {
        "Armor Upgrade 20%": 2000,
        "Armor Upgrade 40%": 3500,
        "Armor Upgrade 60%": 5000,
        "Armor Upgrade 80%": 7000,
        "Armor Upgrade 100%": 10000
    },
    "Turbo": {
        "Turbo Tuning": 4000
    },
    "Xenon": {
        "Xenon Lights": 1000
    },
    "Front Wheels": {
        default: 1500
    },
    "Back Wheels": {
        default: 1500
    },
    "Plate": {
        default: 300
    },
    "Livery": {
        default: 400
    }
};
// --- Function to get the price of a mod ---
function getModPrice(modName, indexName) {
    if (!modPrices[modName]) {
        console.warn(`No price defined for mod: ${modName}`);
        return 0; // Or a default price, or log an error
    }
    if (modPrices[modName][indexName]) {
        return modPrices[modName][indexName];
    } else if (modPrices[modName].default) {
        return modPrices[modName].default;
    } else {
        console.warn(`No specific or default price found for mod: ${modName}, index: ${indexName}`);
        return 0; // No specific or default price found
    }
}
// --- Function to charge the player ---
function chargePlayer(amount) {
    // Replace this with your actual currency/money system logic
    // This is just a placeholder
    const player = mp.players.local; // Get the local player
    if (!player) {
        console.warn("No local player found.");
        return false;
    }
    if (playerData.cash >= amount) {
        playerData.cash = playerData.cash - parseInt(amount);
        return true;
    } else {
        return false;
    }
}
async function getVehicleMods() {
    const vehicleMods = {
        "0": {
            name: "Spoilers",
            indexes: []
        },
        "1": {
            name: "Front Bumper",
            indexes: []
        },
        "2": {
            name: "Rear Bumper",
            indexes: []
        },
        "3": {
            name: "Side Skirt",
            indexes: []
        },
        "4": {
            name: "Exhaust",
            indexes: []
        },
        "5": {
            name: "Frame",
            indexes: []
        },
        "6": {
            name: "Grille",
            indexes: []
        },
        "7": {
            name: "Hood",
            indexes: []
        },
        "8": {
            name: "Fender",
            indexes: []
        },
        "9": {
            name: "Right Fender",
            indexes: []
        },
        "10": {
            name: "Roof",
            indexes: []
        },
        "11": {
            name: "Engine",
            indexes: [
                {
                    index: -1,
                    name: "Stock"
                },
                {
                    index: 0,
                    name: "EMS Upgrade, Level 1"
                },
                {
                    index: 1,
                    name: "EMS Upgrade, Level 2"
                },
                {
                    index: 2,
                    name: "EMS Upgrade, Level 3"
                },
                {
                    index: 3,
                    name: "EMS Upgrade, Level 4"
                }
            ]
        },
        "12": {
            name: "Brakes",
            indexes: [
                {
                    index: -1,
                    name: "Stock"
                },
                {
                    index: 0,
                    name: "Street Brakes"
                },
                {
                    index: 1,
                    name: "Sport Brakes"
                },
                {
                    index: 2,
                    name: "Race Brakes"
                }
            ]
        },
        "13": {
            name: "Transmission",
            indexes: [
                {
                    index: -1,
                    name: "Stock"
                },
                {
                    index: 0,
                    name: "Street Transmission"
                },
                {
                    index: 1,
                    name: "Sports Transmission"
                },
                {
                    index: 2,
                    name: "Race Transmission"
                }
            ]
        },
        "14": {
            name: "Horns",
            indexes: [
                {
                    index: -1,
                    name: "Stock Horn"
                },
                {
                    index: 0,
                    name: "Truck Horn"
                },
                {
                    index: 1,
                    name: "Police Horn"
                },
                {
                    index: 2,
                    name: "Clown Horn"
                },
                {
                    index: 3,
                    name: "Musical Horn 1"
                },
                {
                    index: 4,
                    name: "Musical Horn 2"
                },
                {
                    index: 5,
                    name: "Musical Horn 3"
                },
                {
                    index: 6,
                    name: "Musical Horn 4"
                },
                {
                    index: 7,
                    name: "Musical Horn 5"
                },
                {
                    index: 8,
                    name: "Sad Trombone"
                },
                {
                    index: 9,
                    name: "Classical Horn 1"
                },
                {
                    index: 10,
                    name: "Classical Horn 2"
                },
                {
                    index: 11,
                    name: "Classical Horn 3"
                },
                {
                    index: 12,
                    name: "Classical Horn 4"
                },
                {
                    index: 13,
                    name: "Classical Horn 5"
                },
                {
                    index: 14,
                    name: "Classical Horn 6"
                },
                {
                    index: 15,
                    name: "Classical Horn 7"
                },
                {
                    index: 16,
                    name: "Scale - Do"
                },
                {
                    index: 17,
                    name: "Scale - Re"
                },
                {
                    index: 18,
                    name: "Scale - Mi"
                },
                {
                    index: 19,
                    name: "Scale - Fa"
                },
                {
                    index: 20,
                    name: "Scale - Sol"
                },
                {
                    index: 21,
                    name: "Scale - La"
                },
                {
                    index: 22,
                    name: "Scale - Ti"
                },
                {
                    index: 23,
                    name: "Scale - Do"
                },
                {
                    index: 24,
                    name: "Jazz Horn 1"
                },
                {
                    index: 25,
                    name: "Jazz Horn 2"
                },
                {
                    index: 26,
                    name: "Jazz Horn 3"
                },
                {
                    index: 27,
                    name: "Jazz Horn Loop"
                },
                {
                    index: 28,
                    name: "Star Spangled Banner 1"
                },
                {
                    index: 29,
                    name: "Star Spangled Banner 2"
                },
                {
                    index: 30,
                    name: "Star Spangled Banner 3"
                },
                {
                    index: 31,
                    name: "Star Spangled Banner 4"
                },
                {
                    index: 32,
                    name: "Classical Horn 8 Loop"
                },
                {
                    index: 33,
                    name: "Classical Horn 9 Loop"
                },
                {
                    index: 34,
                    name: "Classical Horn 10 Loop"
                }
            ]
        },
        "15": {
            name: "Suspension",
            indexes: [
                {
                    index: -1,
                    name: "Stock"
                },
                {
                    index: 0,
                    name: "Lowered Suspension"
                },
                {
                    index: 1,
                    name: "Street Suspension"
                },
                {
                    index: 2,
                    name: "Sport Suspension"
                },
                {
                    index: 3,
                    name: "Competition Suspension"
                }
            ]
        },
        "16": {
            name: "Armor",
            indexes: [
                {
                    index: -1,
                    name: "None"
                },
                {
                    index: 0,
                    name: "Armor Upgrade 20%"
                },
                {
                    index: 1,
                    name: "Armor Upgrade 40%"
                },
                {
                    index: 2,
                    name: "Armor Upgrade 60%"
                },
                {
                    index: 3,
                    name: "Armor Upgrade 80%"
                },
                {
                    index: 4,
                    name: "Armor Upgrade 100%"
                }
            ]
        },
        "18": {
            name: "Turbo",
            indexes: [
                {
                    index: -1,
                    name: "None"
                },
                {
                    index: 0,
                    name: "Turbo Tuning"
                }
            ]
        },
        "22": {
            name: "Xenon",
            indexes: [
                {
                    index: -1,
                    name: "None"
                },
                {
                    index: 0,
                    name: "Xenon Lights"
                }
            ]
        },
        "23": {
            name: "Front Wheels",
            indexes: []
        },
        "24": {
            name: "Back Wheels",
            indexes: []
        },
        "25": {
            name: "Plate holders",
            indexes: []
        },
        "26": {
            name: "Vanity Plates",
            indexes: []
        },
        "27": {
            name: "Trim",
            indexes: []
        },
        "28": {
            name: "Ornaments",
            indexes: []
        },
        "29": {
            name: "Dashboard",
            indexes: []
        },
        "30": {
            name: "Dial",
            indexes: []
        },
        "31": {
            name: "Door Speaker",
            indexes: []
        },
        "32": {
            name: "Seats",
            indexes: []
        },
        "33": {
            name: "Steering wheels",
            indexes: []
        },
        "34": {
            name: "Shifter Leavers",
            indexes: []
        },
        "35": {
            name: "Plaques",
            indexes: []
        },
        "36": {
            name: "Speakers",
            indexes: []
        },
        "37": {
            name: "Trunk",
            indexes: []
        },
        "38": {
            name: "Hydraulics",
            indexes: []
        },
        "39": {
            name: "Engine Block",
            indexes: []
        },
        "40": {
            name: "Air filter",
            indexes: []
        },
        "41": {
            name: "Struts",
            indexes: []
        },
        "42": {
            name: "Arch Cover",
            indexes: []
        },
        "43": {
            name: "Aerials",
            indexes: []
        },
        "44": {
            name: "Trim",
            indexes: []
        },
        "45": {
            name: "Tank",
            indexes: []
        },
        "46": {
            name: "Windows",
            indexes: []
        },
        "47": {
            name: "Unknown",
            indexes: []
        },
        "48": {
            name: "Livery",
            indexes: []
        },
        "53": {
            name: "Plate",
            indexes: [
                {
                    index: 0,
                    name: "Blue on White 1"
                },
                {
                    index: 1,
                    name: "Blue on White 2"
                },
                {
                    index: 2,
                    name: "Blue on White 3"
                },
                {
                    index: 3,
                    name: "Yellow on Black"
                },
                {
                    index: 4,
                    name: "Yellow on Blue"
                },
                {
                    index: 5,
                    name: "North Yankton"
                }
            ]
        },
        "55": {
            name: "Window Tint",
            indexes: []
        },
        "66": {
            name: "Color 1",
            indexes: []
        },
        "67": {
            name: "Color 2",
            indexes: []
        }
    };
    // Iterate through the vehicleMods object.
    for(const modType in vehicleMods){
        if (vehicleMods.hasOwnProperty(modType)) {
            const mod = vehicleMods[modType];
            // If the mod has a name and an empty indexes array, try to populate it.
            if (mod.name && mod.indexes.length === 0) {
                // Get the number of mods for this type from RAGE MP.
                const vehicle = mp.players.local.vehicle;
                if (!vehicle) return vehicleMods; // If no vehicle, return
                const numMods = mp.game.vehicle.getNumMods(vehicle.handle, parseInt(modType));
                // Add "None" option
                mod.indexes.push({
                    index: -1,
                    name: "None"
                });
                // Populate the indexes array with placeholder names.
                for(let i = 0; i < numMods; i++){
                    mod.indexes.push({
                        index: i,
                        name: `${mod.name} ${i + 1}`
                    });
                }
            }
        }
    }
    return vehicleMods;
}
function setModByIndexName(vehicle, modName, indexName) {
    if (!vehicle) {
        console.warn("setModByIndexName called with no vehicle.");
        return;
    }
    if (!vehicleModsData) {
        console.warn("Mods not loaded.  Enter and exit the vehicle to load them.");
        return;
    }
    for(const modType in vehicleModsData){
        if (vehicleModsData.hasOwnProperty(modType)) {
            const mod = vehicleModsData[modType];
            if (mod.name === modName) {
                const indexObject = mod.indexes.find((item)=>item.name === indexName
                );
                if (indexObject) {
                    vehicle.setMod(parseInt(modType), indexObject.index);
                    return;
                } else {
                    console.warn(`Index name "${indexName}" not found for mod "${modName}".`);
                    return;
                }
            }
        }
    }
    console.warn(`Mod type "${modName}" not found.`);
}
async function createVehicleModMenu() {
    const vehicle = mp.players.local.vehicle;
    if (!vehicle) {
        mp.gui.chat.push("You must be in a vehicle to open the mod menu.");
        return;
    }
    // Check if it's a different vehicle than the last one.
    if (vehicle !== currentVehicle) {
        vehicleModsData = await getVehicleMods(); // Get available mods
        currentVehicle = vehicle;
        storeOriginalMods(vehicle);
        storeLastPaidMods(vehicle);
    }
    //remove mods with no options
    for(const modType in vehicleModsData){
        if (vehicleModsData.hasOwnProperty(modType)) {
            const mod = vehicleModsData[modType];
            if (mod.indexes.length === 1) {
                delete vehicleModsData[modType];
            }
        }
    }
    let mainMenu = Menu('Vehicle Mods', 'Customize your vehicle', []);
    // --- Create Main Menu Items ---
    for(const modTypeId in vehicleModsData){
        if (vehicleModsData.hasOwnProperty(modTypeId)) {
            const modType = vehicleModsData[modTypeId];
            addMenuItem(mainMenu.id, {
                text: modType.name,
                subtext: `Select ${modType.name} Option`,
                type: "default",
                cb: ()=>{
                    createSubMenu(mainMenu.id, modType, modTypeId);
                },
                icon: 'fas fa-wrench'
            });
        }
    }
    addMenuItem(mainMenu.id, {
        text: "Primary Color",
        subtext: "Select primary color",
        icon: "fas fa-palette",
        type: "colorpicker",
        value: "#FF0000",
        cb: (color)=>{
            mp.events.call("vehSetColor", color);
        }
    });
    addMenuItem(mainMenu.id, {
        text: "Secondary Color",
        subtext: "Select secondary color",
        icon: "fas fa-palette",
        type: "colorpicker",
        value: "#FF0000",
        cb: (color)=>{
            mp.events.call("vehSetColor", color);
        }
    });
    showMenu(mainMenu.id);
}
mp.events.add('closeMenus', ()=>{
    const vehicle = mp.players.local.vehicle;
    if (vehicle) {
        restoreLastPaidMods(vehicle);
    }
});
function createSubMenu(parentMenuId, modType, modTypeId) {
    let subMenu = Menu(modType.name, `Select ${modType.name} Option`, []);
    // --- Create Submenu Items ---
    for (const modOption of modType.indexes){
        const price1 = getModPrice(modType.name, modOption.name);
        const priceText = price1 > 0 ? ` ($${price1})` : "";
        addMenuItem(subMenu.id, {
            text: modOption.name + priceText,
            subtext: `Set ${modType.name} to ${modOption.name}`,
            type: "default",
            cb: ()=>{
                const vehicle = mp.players.local.vehicle;
                if (previewMod && previewMod.modType === modType.name && previewMod.modOption.name === modOption.name) {
                    // Confirm purchase
                    const price = getModPrice(modType.name, modOption.name);
                    if (price > 0) {
                        if (!chargePlayer(price)) {
                            Notify('error', 'Tuning', 'Nu ai suficienti bani.', 5000);
                            resetPreview(vehicle);
                            mp.events.call('cl:menuClose');
                            return; // Don't set the mod if they can't afford it
                        }
                    }
                    setFinalMod(vehicle, modType.name, modOption.name, modTypeId, price);
                    storeLastPaidMods(vehicle); // Update last paid mods
                    resetPreview(vehicle);
                    mp.events.call('cl:menuClose');
                } else {
                    // Preview the mod
                    previewMod = {
                        modType: modType.name,
                        modOption: modOption
                    };
                    previewVehicleMod(vehicle, modType.name, modOption.name);
                }
            },
            icon: 'fas fa-check'
        });
    }
    showMenu(subMenu.id);
}
function previewVehicleMod(vehicle, modName, indexName) {
    setModByIndexName(vehicle, modName, indexName);
    Notify('info', 'Tuning', 'Apasati din nou pentru a cumpara.', 5000);
}
function setFinalMod(vehicle, modName, indexName, modTypeId, price) {
    if (!vehicle) {
        console.warn("setModByIndexName called with no vehicle.");
        return;
    }
    if (!vehicleModsData) {
        console.warn("Mods not loaded.  Enter and exit the vehicle to load them.");
        return;
    }
    for(const modType in vehicleModsData){
        if (vehicleModsData.hasOwnProperty(modType)) {
            const mod = vehicleModsData[modType];
            if (mod.name === modName) {
                const indexObject = mod.indexes.find((item)=>item.name === indexName
                );
                if (indexObject) {
                    vehicle.setMod(parseInt(modType), indexObject.index);
                    mp.events.callRemote('vehSetMod', parseInt(modType), indexObject.index, price);
                    return;
                } else {
                    console.warn(`Index name "${indexName}" not found for mod "${modName}".`);
                    return;
                }
            }
        }
    }
    console.warn(`Mod type "${modName}" not found.`);
}
function resetPreview(vehicle) {
    previewMod = null;
    restoreOriginalMods(vehicle);
}
function storeOriginalMods(vehicle) {
    originalMods = {
    };
    if (!vehicle || !vehicleModsData) return;
    for(const modType in vehicleModsData){
        if (vehicleModsData.hasOwnProperty(modType)) {
            originalMods[modType] = vehicle.getMod(parseInt(modType));
        }
    }
}
function restoreOriginalMods(vehicle) {
    if (!vehicle || !originalMods) return;
    for(const modType in originalMods){
        if (originalMods.hasOwnProperty(modType)) {
            vehicle.setMod(parseInt(modType), originalMods[modType]);
        }
    }
}
function storeLastPaidMods(vehicle) {
    lastPaidMods = {
    };
    if (!vehicle || !vehicleModsData) return;
    for(const modType in vehicleModsData){
        if (vehicleModsData.hasOwnProperty(modType)) {
            lastPaidMods[modType] = vehicle.getMod(parseInt(modType));
        }
    }
}
function restoreLastPaidMods(vehicle) {
    if (!vehicle || !lastPaidMods) return;
    for(const modType in lastPaidMods){
        if (lastPaidMods.hasOwnProperty(modType)) {
            vehicle.setMod(parseInt(modType), lastPaidMods[modType]);
        }
    }
}
// mp.events.add('cl:previewMod', (data: string) => {
//     chat.sendLocalMessage(data);
// })
// chat.registerCommand('vehiclemods', () => {
//     createVehicleModMenu();
// }, 'Open the vehicle mods menu.', '/vehiclemods', 0)
// --- Event handler (for vehicle enter) ---
mp.events.add('playerEnterVehicle', async (vehicle, seat)=>{
    if (seat === -1) {
        try {
            currentVehicle = vehicle;
            vehicleModsData = await getVehicleMods();
            storeOriginalMods(vehicle);
            storeLastPaidMods(vehicle);
        } catch (error) {
            console.error("Error populating mods:", error);
        }
    }
});
// --- Event handler for vehicle exit ---
mp.events.add('playerExitVehicle', (vehicle)=>{
    if (vehicle == currentVehicle) {
        currentVehicle = null;
        vehicleModsData = null;
        resetPreview(vehicle);
    }
});
mp.events.add("vehSetColor", (rgbaString)=>{
    const vehicle = mp.players.local.vehicle;
    if (!vehicle) {
        console.warn("vehSetColor called with no vehicle.");
        return;
    }
    //rgba(255,0,0,255)
    const rgba = rgbaString.substring(5, rgbaString.length - 1).split(',').map((x)=>parseInt(x)
    );
    vehicle.setCustomPrimaryColour(rgba[0], rgba[1], rgba[2]);
    vehicle.setCustomSecondaryColour(rgba[0], rgba[1], rgba[2]);
});
mp.events.add('changeSecondaryColor', (rgbaString)=>{
    const vehicle = mp.players.local.vehicle;
    if (!vehicle) {
        console.warn("changeSecondaryColor called with no vehicle.");
        return;
    }
    const rgba = rgbaString.substring(5, rgbaString.length - 1).split(',').map((x)=>parseInt(x)
    );
    vehicle.setCustomSecondaryColour(rgba[0], rgba[1], rgba[2]);
    mp.events.callRemote('setVehSecondaryColor', rgba[0], rgba[1], rgba[2]);
});
mp.events.add('changePrimaryColor', (rgbaString)=>{
    const vehicle = mp.players.local.vehicle;
    if (!vehicle) {
        console.warn("changePrimaryColor called with no vehicle.");
        return;
    }
    const rgba = rgbaString.substring(5, rgbaString.length - 1).split(',').map((x)=>parseInt(x)
    );
    vehicle.setCustomPrimaryColour(rgba[0], rgba[1], rgba[2]);
    mp.events.callRemote('setVehPrimaryColor', rgba[0], rgba[1], rgba[2]);
});
mp.events.add('mouseShowCursor', (show)=>{
    mp.gui.cursor.visible = show;
    mp.gui.cursor.show(show, show);
});
mp.events.add('render', ()=>{
    let interactPos = {
        "x": -1613.3692626953125,
        "y": -831.2616577148438,
        "z": 10.065536499023438,
        "h": 47.35538101196289
    };
    let dist = mp.game.system.vdist(interactPos.x, interactPos.y, interactPos.z, mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z);
    if (dist < 5 && mp.players.local.vehicle != null) {
        DrawInteract("E", "Vehicle Tuning", "Open tuning menu", new mp.Vector3(interactPos.x, interactPos.y, interactPos.z));
        if (mp.keys.isDown(69) && !MENU_OPEN && !chat.on) {
            createVehicleModMenu();
        }
    }
}) // chat.registerCommand('vehmods', (args: string[]) => {
 //     createVehicleModMenu();
 // }, 'Open the vehicle mods menu', '/vehmods', 0);
;

let vehicleShops = [];
let closestShop = false;
mp.events.add('corefx:playerReady', async ()=>{
    vehicleShops = await mp.events.callRemoteProc('vehicleShops:fetch');
    // chat.sendLocalMessage(`${typeof vehicleShops} ${JSON.stringify(vehicleShops)} `);
    //create blip
    vehicleShops.forEach((shop)=>{
        if (shop.ped_pos.x != 0) {
            let blip = mp.blips.new(shop.blip, new mp.Vector3(shop.ped_pos.x, shop.ped_pos.y, shop.ped_pos.z), {
                color: shop.blipColor,
                name: shop.name,
                shortRange: true
            });
            shop.blip = blip;
            let ped = mp.peds.new(mp.game.joaat('s_m_m_fiboffice_02'), new mp.Vector3(shop.ped_pos.x, shop.ped_pos.y, shop.ped_pos.z), shop.ped_pos.h, 0);
            ped.freezePosition(true);
            //disable reactions
            ped.setConfigFlag(35, true);
            //clipboard scenario
            ped.taskStartScenarioInPlace('WORLD_HUMAN_CLIPBOARD', 500, false);
            //invincible
            ped.setInvincible(true);
            shop.ped = ped;
        }
    });
});
mp.events.add('vehicleShops:load', (data)=>{
    //rebuild, delete blips, peds, etc
    // chat.sendLocalMessage(`Vehicle shops: ${JSON.stringify(data)}`);
    vehicleShops.forEach((shop)=>{
        if (shop.blip) {
            shop.blip.destroy();
        }
        if (shop.ped) {
            shop.ped.destroy();
        }
    });
    vehicleShops = [];
    setTimeout(()=>{
        vehicleShops = data;
        closestShop = false;
        vehicleShops.forEach((shop)=>{
            if (shop.ped_pos.x != 0) {
                let blip = mp.blips.new(shop.blip, new mp.Vector3(shop.ped_pos.x, shop.ped_pos.y, shop.ped_pos.z), {
                    color: shop.blipColor,
                    name: shop.name,
                    shortRange: true
                });
                shop.blip = blip;
                let ped = mp.peds.new(mp.game.joaat('s_m_m_fiboffice_02'), new mp.Vector3(shop.ped_pos.x, shop.ped_pos.y, shop.ped_pos.z), shop.ped_pos.h, 0);
                ped.freezePosition(true);
                //disable reactions
                ped.setConfigFlag(35, true);
                //clipboard scenario
                ped.taskStartScenarioInPlace('WORLD_HUMAN_CLIPBOARD', 500, false);
                //invincible
                ped.setInvincible(true);
                shop.ped = ped;
            }
        });
    }, 500);
});
mp.events.add('render', ()=>{
    if (!closestShop && vehicleShops.length > 0) {
        closestShop = vehicleShops.reduce((prev, curr)=>{
            let prevDist = mp.game.system.vdist(mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z, prev.ped_pos.x, prev.ped_pos.y, prev.ped_pos.z);
            let currDist = mp.game.system.vdist(mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z, curr.ped_pos.x, curr.ped_pos.y, curr.ped_pos.z);
            return prevDist < currDist ? prev : curr;
        });
    }
    if (closestShop && closestShop.ped_pos.x) {
        let closestDist = mp.game.system.vdist(mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z, closestShop.ped_pos.x, closestShop.ped_pos.y, closestShop.ped_pos.z);
        if (closestDist > 5) {
            closestShop = false;
        } else {
            DrawInteract('E', closestShop.name, 'Pentru a vorbii cu vanzatorul', new mp.Vector3(closestShop.ped_pos.x, closestShop.ped_pos.y, closestShop.ped_pos.z));
            if (mp.keys.isDown(69)) {
                let mainMenu = Menu(`${closestShop.name} - Meniu`, 'Meniu principal', []);
                //build categories from .vehicles, each vehicle has a .category
                let categories = closestShop.vehicles.map((vehicle)=>vehicle.category
                );
                categories = [
                    ...new Set(categories)
                ];
                categories.forEach((category)=>{
                    addMenuItem(mainMenu.id, {
                        text: category,
                        subtext: `${category} category`,
                        value: category,
                        icon: 'fa-solid fa-car',
                        cb: ()=>{
                            let categoryMenu = Menu(`${closestShop.name} - ${category}`, `${category} category`, []);
                            closestShop.vehicles.filter((v)=>v.category == category
                            ).forEach((vehicle)=>{
                                addMenuItem(categoryMenu.id, {
                                    text: `${vehicle.name} - Stock: ${vehicle.stock}`,
                                    subtext: `Pret: ${formatNumber(vehicle.price)} $`,
                                    value: vehicle.name,
                                    icon: 'fa-regular fa-car',
                                    cb: ()=>{
                                        let vehicleMenu = Menu(`${vehicle.name}`, `Pret: ${formatNumber(vehicle.price)} $`, []);
                                        addMenuItem(vehicleMenu.id, {
                                            text: 'Cumpara',
                                            subtext: `Pret: ${vehicle.price} $`,
                                            icon: 'fa-solid fa-check',
                                            cb: ()=>{
                                                mp.events.callRemote('vehicleShops:buy', JSON.stringify({
                                                    name: vehicle.name,
                                                    model: vehicle.model,
                                                    price: vehicle.price
                                                }), closestShop.id);
                                            }
                                        });
                                        //test
                                        addMenuItem(vehicleMenu.id, {
                                            text: 'Test',
                                            subtext: `Pret: ${vehicle.price} $`,
                                            icon: 'fa-solid fa-car',
                                            cb: ()=>{
                                                if (mp.players.local.vehicle) return chat.sendLocalMessage(`^2[ERROR] ^0Esti deja intr-o masina.`);
                                                closeAllMenus();
                                                function findFreeSpot() {
                                                    //usign isPositionFree
                                                    let freeSpot = false;
                                                    closestShop.testing_spots.forEach((spot)=>{
                                                        if (isPositionFree(spot)) {
                                                            freeSpot = spot;
                                                        }
                                                    });
                                                    return freeSpot;
                                                }
                                                let spot1 = findFreeSpot();
                                                if (!spot1) return chat.sendLocalMessage(`^2[ERROR] ^0Nu sunt locuri libere pentru test drive`);
                                                mp.events.callRemote('vehicleShops:test', vehicle.model, spot1);
                                            }
                                        });
                                        //rent price is 10% of the price per hour
                                        addMenuItem(vehicleMenu.id, {
                                            text: 'Inchiriaza',
                                            subtext: `Pret ora: ${Math.round(vehicle.price * 0.1)} $`,
                                            icon: 'fa-solid fa-clock',
                                            cb: ()=>{
                                                mp.events.callRemote('vehicleShops:rent', vehicle.name, closestShop.id);
                                            }
                                        });
                                        showMenu(vehicleMenu.id);
                                    }
                                });
                            });
                            showMenu(categoryMenu.id);
                        }
                    });
                });
                showMenu(mainMenu.id);
            }
        }
    }
});
let IS_GARAGE_SHOWN = false;
chat.registerCommand('v', async (args)=>{
    let vehicles = await mp.events.callRemoteProc('getPlayerVehicles');
    vehicles.forEach((vehicle)=>{
        if (mp.vehicles.toArray().find((v)=>v.getNumberPlateText().replace(/\s/g, '') == vehicle.plate.replace(/\s/g, '')
        )) {
            vehicle.isOut = true;
        } else {
            vehicle.isOut = false;
        }
    });
    chat.browser.call('showVehicles', JSON.stringify(vehicles));
    IS_GARAGE_SHOWN = true;
    mp.gui.cursor.show(true, true);
    mp.gui.cursor.visible = true;
}, 'View your vehicles', "/v", 0);
mp.events.add('hideVehicles', ()=>{
    chat.browser.call('hideVehicles', []);
    IS_GARAGE_SHOWN = false;
    mp.gui.cursor.show(false, false);
    mp.gui.cursor.visible = false;
});
mp.events.add('spawnVehicle', (model, plate)=>{
    mp.events.callRemote('spawnVehicle', model, plate);
});
mp.events.add('deleteVehicle', (plate)=>{
    mp.events.callRemote('deleteVehicle', plate);
});
mp.events.add('mouseShowCursor', ()=>{
    mp.events.callRemote('updateVehColor');
});

const teleportWaypoint = ()=>{
    const waypoint = mp.game.ui.getFirstBlipInfoId(8);
    if (!mp.game.ui.doesBlipExist(waypoint)) return;
    const waypointPos = mp.game.ui.getBlipInfoIdCoord(waypoint);
    if (!waypointPos) return;
    let zCoord = mp.game.gameplay.getGroundZFor3DCoord(waypointPos.x, waypointPos.y, waypointPos.z, false, false);
    if (!zCoord) {
        for(let i = 1000; i >= 0; i -= 25){
            mp.game.streaming.requestCollisionAtCoord(waypointPos.x, waypointPos.y, i);
            mp.game.wait(0);
        }
        zCoord = mp.game.gameplay.getGroundZFor3DCoord(waypointPos.x, waypointPos.y, 1000, false, false);
        if (!zCoord) return;
    }
    mp.players.local.position = new mp.Vector3(waypointPos.x, waypointPos.y, zCoord + 0.5);
};
//bind K key
mp.keys.bind(75, true, ()=>{
    if (chat.on) return;
    if (INV_OPEN) return;
    if (DIALOG_OPEN) return;
    if (IS_GARAGE_SHOWN) return;
    let mainMenu = Menu('Player Menu', 'Select an option', []);
    if (playerData.admin > 0) {
        addMenuItem(mainMenu.id, {
            text: 'Admin Menu',
            subtext: 'Open the admin menu',
            cb: ()=>{
                let subMenu = Menu('Admin Menu', 'Select an option', []);
                if (playerData.admin >= 1) {
                    addMenuItem(subMenu.id, {
                        text: 'Teleport to waypoint',
                        subtext: 'Teleport to the waypoint on the map',
                        cb: ()=>{
                            teleportWaypoint();
                        },
                        icon: 'fas fa-map-marker-alt'
                    });
                    //tp to player
                    addMenuItem(subMenu.id, {
                        text: 'Teleport to player',
                        subtext: 'Teleport to a player',
                        cb: ()=>{
                            Dialog('Teleport to player', 'Enter the player ID', (playerId)=>{
                                mp.events.callRemote('admin:teleportToPlayer', playerId);
                            });
                        },
                        icon: 'fas fa-user-friends'
                    });
                    //tptome
                    addMenuItem(subMenu.id, {
                        text: 'Teleport player to me',
                        subtext: 'Teleport a player to you',
                        cb: ()=>{
                            Dialog('Teleport player to me', 'Enter the player ID', (playerId)=>{
                                mp.events.callRemote('admin:teleportPlayerToMe', playerId);
                            });
                        },
                        icon: 'fas fa-user-friends'
                    });
                //givemoney
                }
                if (playerData.admin >= 8) {
                    addMenuItem(subMenu.id, {
                        text: 'Create vehicle shop',
                        subtext: 'Create a vehicle shop',
                        cb: ()=>{
                            //name, blip, blipColor, price
                            Dialog('Create vehicle shop', 'Enter the name', (name)=>{
                                Dialog('Create vehicle shop', 'Enter the blip', (blip)=>{
                                    blip = parseInt(blip);
                                    Dialog('Create vehicle shop', 'Enter the blip color', (blipColor)=>{
                                        blipColor = parseInt(blipColor);
                                        mp.events.callRemote('admin:createVehicleShop', name, blip, blipColor);
                                    });
                                });
                            });
                        },
                        icon: 'fas fa-car'
                    });
                    addMenuItem(subMenu.id, {
                        text: 'Create blip',
                        subtext: 'Create a blip',
                        icon: 'fas fa-map-marker-alt',
                        cb: ()=>{
                            // declare id: number;
                            // declare name: string;
                            // declare blipId: number;
                            // declare color: number;
                            // declare position: JSON;
                            // declare sprite: number;
                            // declare scale: number;
                            // declare shortRange: boolean;
                            // declare dimension: number;
                            // declare created_at: Date;
                            // declare updated_at: Date;
                            Dialog('Create Blip', 'Enter the name', (name)=>{
                                Dialog('Create Blip', 'Enter the color', (color)=>{
                                    Dialog('Create Blip', 'Enter the sprite', (sprite)=>{
                                        Dialog('Create Blip', 'Enter the scale', (scale)=>{
                                            Dialog('Create Blip', 'Enter the shortRange', (shortRange)=>{
                                                Dialog('Create Blip', 'Enter the dimension', (dimension)=>{
                                                    if (!name || !color || !sprite || !scale || !shortRange || !dimension) return;
                                                    mp.events.callRemote('mp:addBlipToDb', JSON.stringify({
                                                        name: name,
                                                        color: color,
                                                        pos: {
                                                            x: mp.players.local.position.x,
                                                            y: mp.players.local.position.y,
                                                            z: mp.players.local.position.z
                                                        },
                                                        sprite: sprite,
                                                        scale: scale,
                                                        shortRange: shortRange ? true : false,
                                                        dimension: dimension
                                                    }));
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    });
                    //view blips
                    addMenuItem(subMenu.id, {
                        text: 'View blips',
                        subtext: 'View all blips',
                        icon: 'fas fa-map-marker-alt',
                        cb: async ()=>{
                            let blips = await mp.events.callRemoteProc('getBlips');
                            if (blips && blips.length > 0) {
                                let blipsMenu = Menu('Blips', 'Select an option', []);
                                blips.forEach((blip)=>{
                                    addMenuItem(blipsMenu.id, {
                                        text: blip.name,
                                        subtext: `Blip`,
                                        icon: 'fas fa-map-marker-alt',
                                        cb: ()=>{
                                            //new submenu, with Set Name, Set Color, Set Position, Set Sprite, Set Scale, Set ShortRange, Set Dimension
                                            let blipMenu = Menu(blip.name, 'Select an option', []);
                                            //change name
                                            addMenuItem(blipMenu.id, {
                                                text: 'Set Name',
                                                subtext: 'Set the name',
                                                cb: ()=>{
                                                    Dialog('Set Name', 'Enter the name', (name)=>{
                                                        if (!name) return;
                                                        mp.events.callRemote('mp:setBlipName', blip.id, name);
                                                    });
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            //change color
                                            addMenuItem(blipMenu.id, {
                                                text: 'Set Color',
                                                subtext: 'Set the color',
                                                cb: ()=>{
                                                    Dialog('Set Color', 'Enter the color', (color)=>{
                                                        if (!color) return;
                                                        mp.events.callRemote('mp:setBlipColor', blip.id, color);
                                                    });
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            //change position
                                            addMenuItem(blipMenu.id, {
                                                text: 'Set Position',
                                                subtext: 'Set the position',
                                                cb: ()=>{
                                                    let pos = {
                                                        x: mp.players.local.position.x,
                                                        y: mp.players.local.position.y,
                                                        z: mp.players.local.position.z
                                                    };
                                                    mp.events.callRemote('mp:setBlipPosition', blip.id, pos);
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            //change sprite
                                            addMenuItem(blipMenu.id, {
                                                text: 'Set Sprite',
                                                subtext: 'Set the sprite',
                                                cb: ()=>{
                                                    Dialog('Set Sprite', 'Enter the sprite', (sprite)=>{
                                                        if (!sprite) return;
                                                        mp.events.callRemote('mp:setBlipSprite', blip.id, sprite);
                                                    });
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            //change scale
                                            addMenuItem(blipMenu.id, {
                                                text: 'Set Scale',
                                                subtext: 'Set the scale',
                                                cb: ()=>{
                                                    Dialog('Set Scale', 'Enter the scale', (scale)=>{
                                                        if (!scale) return;
                                                        mp.events.callRemote('mp:setBlipScale', blip.id, scale);
                                                    });
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            //change shortRange
                                            addMenuItem(blipMenu.id, {
                                                text: 'Set ShortRange',
                                                subtext: 'Set the shortRange',
                                                cb: ()=>{
                                                    Dialog('Set ShortRange', 'Enter the shortRange', (shortRange)=>{
                                                        if (!shortRange) return;
                                                        mp.events.callRemote('mp:setBlipShortRange', blip.id, shortRange);
                                                    });
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            //change dimension
                                            addMenuItem(blipMenu.id, {
                                                text: 'Set Dimension',
                                                subtext: 'Set the dimension',
                                                cb: ()=>{
                                                    Dialog('Set Dimension', 'Enter the dimension', (dimension)=>{
                                                        if (!dimension) return;
                                                        mp.events.callRemote('mp:setBlipDimension', blip.id, dimension);
                                                    });
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            //delete blip
                                            addMenuItem(blipMenu.id, {
                                                text: 'Delete Blip',
                                                subtext: 'Delete the blip',
                                                cb: ()=>{
                                                    mp.events.callRemote('mp:deleteBlip', blip.id);
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            showMenu(blipMenu.id);
                                        }
                                    });
                                });
                                showMenu(blipsMenu.id);
                            }
                        }
                    });
                    //view vehicle shops
                    addMenuItem(subMenu.id, {
                        text: 'View vehicle shops',
                        subtext: 'View all vehicle shops',
                        icon: 'fas fa-car',
                        cb: async ()=>{
                            let vehicleShops = await mp.events.callRemoteProc('vehicleShops:fetch');
                            if (vehicleShops && vehicleShops.length > 0) {
                                //new submenu
                                // name,
                                // price,
                                // blip,
                                // blipColor,
                                // ped_pos: JSON.stringify({ x: 0, y: 0, z: 0, h: 0 }),
                                // veh_pos: JSON.stringify({ x: 0, y: 0, z: 0, h: 0 }),
                                // vehicles: JSON.stringify([]),
                                // testing_spots: JSON.stringify([]),
                                let vehicleShopsMenu = Menu('Vehicle Shops', 'Select an option', []);
                                vehicleShops.forEach((shop)=>{
                                    addMenuItem(vehicleShopsMenu.id, {
                                        text: shop.name,
                                        subtext: `Dealership`,
                                        cb: ()=>{
                                            //new submenu, with Set Price, Set Ped Pos, Set Veh Pos, Add Testing Spot, Add Vehicle
                                            let vehicleShopMenu = Menu(shop.name, 'Select an option', []);
                                            //change name
                                            addMenuItem(vehicleShopMenu.id, {
                                                text: 'Set Name',
                                                subtext: 'Set the name',
                                                cb: ()=>{
                                                    Dialog('Set Name', 'Enter the name', (name)=>{
                                                        if (!name) return;
                                                        mp.events.callRemote('admin:setVehicleShopName', shop.id, name);
                                                    });
                                                },
                                                icon: 'fas fa-car'
                                            });
                                            //change blip
                                            addMenuItem(vehicleShopMenu.id, {
                                                text: 'Set Blip',
                                                subtext: 'Set the blip',
                                                cb: ()=>{
                                                    Dialog('Set Blip', 'Enter the blip', (blip)=>{
                                                        if (!blip) return;
                                                        mp.events.callRemote('admin:setVehicleShopBlip', shop.id, blip);
                                                    });
                                                },
                                                icon: 'fas fa-car'
                                            });
                                            //change blip colour
                                            addMenuItem(vehicleShopMenu.id, {
                                                text: 'Set Blip Color',
                                                subtext: 'Set the blip color',
                                                cb: ()=>{
                                                    Dialog('Set Blip Color', 'Enter the blip color', (blipColor)=>{
                                                        if (!blipColor) return;
                                                        mp.events.callRemote('admin:setVehicleShopBlipColor', shop.id, blipColor);
                                                    });
                                                },
                                                icon: 'fas fa-car'
                                            });
                                            addMenuItem(vehicleShopMenu.id, {
                                                text: 'Set Ped Pos',
                                                subtext: 'Set the ped position',
                                                cb: ()=>{
                                                    let pos = {
                                                        x: mp.players.local.position.x,
                                                        y: mp.players.local.position.y,
                                                        z: mp.players.local.position.z,
                                                        h: mp.players.local.heading
                                                    };
                                                    mp.events.callRemote('admin:setVehicleShopPedPos', shop.id, pos);
                                                },
                                                icon: 'fas fa-walking'
                                            });
                                            addMenuItem(vehicleShopMenu.id, {
                                                text: 'Set Veh Pos',
                                                subtext: 'Set the vehicle position',
                                                cb: ()=>{
                                                    let pos = {
                                                        x: mp.players.local.position.x,
                                                        y: mp.players.local.position.y,
                                                        z: mp.players.local.position.z,
                                                        h: mp.players.local.heading
                                                    };
                                                    mp.events.callRemote('admin:setVehicleShopVehPos', shop.id, pos);
                                                },
                                                icon: 'fas fa-car'
                                            });
                                            addMenuItem(vehicleShopMenu.id, {
                                                text: 'Add Testing Spot',
                                                subtext: 'Add a testing spot',
                                                cb: ()=>{
                                                    let pos = {
                                                        x: mp.players.local.position.x,
                                                        y: mp.players.local.position.y,
                                                        z: mp.players.local.position.z,
                                                        h: mp.players.local.heading
                                                    };
                                                    mp.events.callRemote('admin:addVehicleShopTestingSpot', shop.id, pos);
                                                },
                                                icon: 'fas fa-map-marker-alt'
                                            });
                                            addMenuItem(vehicleShopMenu.id, {
                                                text: 'Add Vehicle',
                                                subtext: 'Add a vehicle',
                                                cb: ()=>{
                                                    //model, name, price, stock, if vehicle already exists add the stock
                                                    Dialog('Add Vehicle', 'Enter the model', (model)=>{
                                                        Dialog('Add Vehicle', 'Enter the name', (name)=>{
                                                            Dialog('Add Vehicle', 'Enter the price', (price)=>{
                                                                price = parseInt(price);
                                                                if (!price || !model || !name || isNaN(price)) return;
                                                                Dialog('Add Vehicle', 'Enter the stock', (stock)=>{
                                                                    stock = parseInt(stock);
                                                                    Dialog('Add Vehicle', 'Enter the category', (category)=>{
                                                                        mp.events.callRemote('admin:addVehicleShopVehicle', shop.id, model, name, price, stock, category);
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                },
                                                icon: 'fas fa-car'
                                            });
                                            showMenu(vehicleShopMenu.id);
                                        },
                                        icon: 'fas fa-car'
                                    });
                                });
                                showMenu(vehicleShopsMenu.id);
                            }
                        }
                    });
                    addMenuItem(subMenu.id, {
                        text: 'Give money',
                        subtext: 'Give money to a player',
                        cb: ()=>{
                            Dialog('Money Type', 'Money type [cash, bank]', (moneyType)=>{
                                Dialog('Give money', 'Enter the player ID', (playerId)=>{
                                    Dialog('Give money', 'Enter the amount', (amount)=>{
                                        mp.events.callRemote('admin:giveMoney', playerId, moneyType, amount);
                                    });
                                });
                            });
                        },
                        icon: 'fas fa-dollar-sign'
                    });
                    //setmoney
                    addMenuItem(subMenu.id, {
                        text: 'Set money',
                        subtext: 'Set money to a player',
                        cb: ()=>{
                            Dialog('Money Type', 'Money type [cash, bank]', (moneyType)=>{
                                Dialog('Set money', 'Enter the player ID', (playerId)=>{
                                    Dialog('Set money', 'Enter the amount', (amount)=>{
                                        mp.events.callRemote('admin:setMoney', playerId, moneyType, amount);
                                    });
                                });
                            });
                        },
                        icon: 'fas fa-dollar-sign'
                    });
                    //giveitem, 3 dialogs, player, item, amount
                    addMenuItem(subMenu.id, {
                        text: 'Give item',
                        subtext: 'Give an item to a player',
                        cb: ()=>{
                            Dialog('Give item', 'Enter the player ID', (playerId)=>{
                                Dialog('Give item', 'Enter the item name', (itemName)=>{
                                    Dialog('Give item', 'Enter the amount', (amount)=>{
                                        mp.events.callRemote('admin:giveItem', playerId, itemName, amount);
                                    });
                                });
                            });
                        },
                        icon: 'fas fa-box'
                    });
                }
                showMenu(subMenu.id);
            },
            icon: 'fas fa-user-shield'
        });
    }
    addMenuItem(mainMenu.id, {
        text: 'Character Creator',
        subtext: 'Create a new character',
        cb: ()=>{
            chat.browser.call('openCharacterCreator');
        },
        icon: 'fas fa-user-plus'
    });
    showMenu(mainMenu.id);
});
mp.events.add('cl:showDeathscreen', ()=>{
    chat.browser.call('showDeathscreen');
});
mp.events.add('deathscreenTimeEnded', ()=>{
    //revive ped
    // mp.players.local.resurrect();
    // mp.players.local.reviveInjured();
    mp.players.local.taskRevive();
    mp.events.callRemote('revivePed');
});
mp.events.add('corefx:playerReady', ()=>{
    if (playerData.dead) {
        //kill ped
        chat.browser.call('showDeathscreen');
        mp.players.local.health = -1;
        mp.game.task.writhe(mp.players.local.handle, mp.players.local.handle, 1500, 1, 1, 1);
    // mp.players.local.taskWrithe(mp.players.local.handle, 1000, 0)
    }
});

let Emitters = {
}; // Key by emitterId (number)
const ActiveEmitters = {
}; // Persistent map for active emitters, keyed by emitterId
chat.registerCommand('play', ()=>{
    Dialog('URL', 'Put the video url down below', (url)=>{
        if (!url) return;
        let isValidYoutubeUrl = url.match(/^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/);
        let isPlaylist = url.match(/[?&]list=/);
        if (!isValidYoutubeUrl) return;
        if (isPlaylist) return;
        const inVehicle = !!mp.players.local.vehicle;
        mp.events.callRemote('audio:registerEmitterForAllPlayers', url, inVehicle);
    });
}, "Play URL from Youtube", "/play", 0);
mp.events.add('audio:registerEmitter', (emitterStr)=>{
    const emitter = JSON.parse(emitterStr);
    Emitters[emitter.id] = {
        ...emitter,
        active: false
    }; // Initialize as inactive in main Emitters
    console.log(`[CLIENT AUDIO] Registered emitter: ${emitter.id}, Type: ${emitter.type}, URL: ${emitter.url}, Pos: ${emitter.position ? JSON.stringify(emitter.position) : 'Vehicle Plate: ' + emitter.plate}`);
});
mp.events.add('audio:removeEmitter', (id)=>{
    if (Emitters[id]) {
        if (ActiveEmitters[id]) {
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
mp.events.add('render', ()=>{
    if (Object.keys(Emitters).length === 0 && Object.keys(ActiveEmitters).length === 0) return; // Early return if no emitters at all
    const playerPos = mp.players.local.position;
    // ** --- Activation and Update Loop (Iterate through ALL Emitters) --- **
    for(const emitterId in Emitters){
        const emitter = Emitters[emitterId];
        let distance = 0;
        let relevantPosition = null;
        if (emitter.type === 'static') {
            relevantPosition = emitter.position;
        } else if (emitter.type === 'vehicle') {
            const vehicle = mp.vehicles.toArray().find((v)=>v.id === emitter.plate
            );
            if (!vehicle) {
                if (ActiveEmitters[emitterId]) {
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
        distance = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, relevantPosition.x, relevantPosition.y, playerPos.z); // <--- IMPORTANT: Use playerPos.z for player Z coordinate!
        const maxAudibleDistance = emitter.range;
        if (distance < maxAudibleDistance) {
            const volume = Math.max(0, emitter.maxVol * (1 - distance / maxAudibleDistance));
            const offset = (Date.now() - emitter.startTime) / 1000;
            if (!ActiveEmitters[emitterId]) {
                ActiveEmitters[emitterId] = {
                    ...emitter
                }; // Add to ActiveEmitters map
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
            DrawInteract('🔊', `Sound Emitter ${emitterId}`, `Distance: ${distance.toFixed(2)}m | Vol: ${volume.toFixed(2)} | Max Vol: ${emitter.maxVol} | Max Distance: ${maxAudibleDistance.toFixed(2)}m`, new mp.Vector3(relevantPosition.x, relevantPosition.y, relevantPosition.z));
        } else {
            // ** --- Deactivation Check (if in ActiveEmitters but out of range) --- **
            if (ActiveEmitters[emitterId]) {
                chat.browser.call('cl:stopAudioForEmitter', emitterId);
                delete ActiveEmitters[emitterId]; // Remove from ActiveEmitters map on deactivation
                Emitters[emitterId].active = false; // Update active state in main Emitters
                console.log(`[CLIENT AUDIO][RENDER] Emitter ${emitterId}: DEACTIVATED and removed from ActiveEmitters (Out of Range). Distance: ${distance.toFixed(2)}, Max Distance: ${maxAudibleDistance.toFixed(2)}`);
            }
        }
    }
});
function getFocusedEmitter() {
    let closestEmitter = null;
    let minDistance = Infinity;
    for(const id in ActiveEmitters){
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
chat.registerCommand('setrange', (args)=>{
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
chat.registerCommand('clearaudio', ()=>{
    const focusedEmitter = getFocusedEmitter();
    if (focusedEmitter) {
        mp.events.callRemote('audio:removeEmitter', focusedEmitter.id);
        console.log(`[CLIENT AUDIO] Command /clearaudio - Emitter: ${focusedEmitter.id}`);
    } else {
        chat.browser.call('cl:notify', 'No active emitter to clear.');
        console.log(`[CLIENT AUDIO] Command /clearaudio - No focused emitter.`);
    }
}, 'Clear audio emitter', '/clearaudio', 0);
chat.registerCommand('changeurl', ()=>{
    const focusedEmitter = getFocusedEmitter();
    if (focusedEmitter) {
        Dialog('URL', 'Put the video url down below', (url)=>{
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
mp.events.add('audio:updateEmitter', (emitterStr)=>{
    const updatedEmitter = JSON.parse(emitterStr);
    const existingEmitter = Emitters[updatedEmitter.id];
    if (existingEmitter) {
        if (existingEmitter.url !== updatedEmitter.url) {
            if (ActiveEmitters[updatedEmitter.id]) {
                chat.browser.call('cl:stopAudioForEmitter', updatedEmitter.id);
                delete ActiveEmitters[updatedEmitter.id]; // Remove from ActiveEmitters map
                Emitters[updatedEmitter.id].active = false; // Ensure active state is false in main Emitters
                console.log(`[CLIENT AUDIO] URL changed for emitter ${updatedEmitter.id}, stopping and removing from ActiveEmitters.`);
            }
            existingEmitter.url = updatedEmitter.url;
            existingEmitter.startTime = updatedEmitter.startTime;
            if (ActiveEmitters[updatedEmitter.id]) {
                chat.browser.call('cl:playAudioForEmitter', updatedEmitter.id, updatedEmitter.url, 0);
                console.log(`[CLIENT AUDIO] URL changed for emitter ${updatedEmitter.id}, restarting with new URL in ActiveEmitters.`);
            }
        }
        existingEmitter.maxVol = updatedEmitter.maxVol;
        existingEmitter.type = updatedEmitter.type;
        existingEmitter.position = updatedEmitter.position;
        existingEmitter.plate = updatedEmitter.plate;
        existingEmitter.range = updatedEmitter.range;
        if (ActiveEmitters[updatedEmitter.id]) {
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
mp.events.add('corefx:playerReady', ()=>{
    mp.events.callRemote('audio:requestAllEmitters');
    console.log("[CLIENT AUDIO] corefx:playerReady - Requesting all emitters from server.");
});
