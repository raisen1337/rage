import { chat } from './chat';
import { INV_OPEN } from './inventory';
export let client_ui = mp.browsers.new(`${mp.players.local.ip === '192.168.1.133' ? 'http://localhost:5173' : 'http://79.118.112.192:5173'}`);

export function getBrowser() {
	return client_ui;
}

export function setNuiFocus(locked: boolean, hasCursor: boolean) {
	client_ui.call('focus', locked, hasCursor);
	mp.gui.cursor.show(locked, hasCursor);
	mp.gui.cursor.visible = hasCursor;
}

interface MenuItem {
	id: number;
	text: string;
	subtext: string;
	icon: string;
	type?: 'number' | 'array' | 'dropdown' | 'text' | 'default' | 'colorpicker';
	value?: any;
	min?: number;
	max?: number;
	options?: string[];
	cb?: Function;
	callbackId?: string;
}

function validateMenuItem(item: MenuItem): string[] {
	const errors: string[] = [];
	if (item.type === 'number') {
		if (item.min !== undefined && item.max !== undefined && item.min > item.max) {
			errors.push('Min value cannot be greater than max value');
		}
	} else if (item.type === 'array' || item.type === 'dropdown') {
		if (!Array.isArray(item.options)) errors.push('Options must be an array');
		if (item.options && item.options.some((opt) => typeof opt !== 'string')) errors.push('Each option must be a string');
	} else if (item.type === 'colorpicker') {
		if (item.value && typeof item.value !== 'string') errors.push('Initial color must be a string');
	}
	return errors;
}

interface MenuData {
	id: number;
	title: string;
	subtitle: string;
	items: MenuItem[];
}

let menus: Record<number, MenuData> = {};
const menuCallbacks: Record<string, Function> = {};
let nextMenuId = 1;
let nextItemId = 1;
export let MENU_OPEN = false;

export function Menu(title: string, subtitle: string, items: MenuItem[]): MenuData {
	const id = nextMenuId++;
	const errors = items.reduce<string[]>((acc, item) => acc.concat(validateMenuItem(item)), []);
	if (errors.length) {
		console.error(`[ERROR] Invalid menu item: ${errors.join(', ')}`);
		return { id, title, subtitle, items: [] };
	}

	items.forEach((item) => {
		item.id = nextItemId++;
	});

	menus[id] = { id, title, subtitle, items };

	// Set default values
	for (let i = 0; i < items.length; i++) {
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

export function closeAllMenus() {
	MENU_OPEN = false;
	chat.browser.call('cl:closeAllMenus');
}

export function showMenu(menuId: number) {
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

export function Notify(type: string, title: string, message: string, duration: number = 5000) {
	chat.browser.call('notify', type, title, message, duration);
}

mp.events.add('corefx:notify', (type: string, title: string, message: string, duration: number) => {
	Notify(type, title, message, duration);
});

mp.events.add('closeMenus', () => {
	setNuiFocus(false, false);
	MENU_OPEN = false;
});

export function addMenuItem(menuId: number, item: Omit<MenuItem, 'id'>) {
	if (!menus[menuId]) {
		console.error('Attempted to add item to non-existent menu:', menuId);
		return;
	}

	const itemId = nextItemId++;
	const callbackId = `menuItem_${menuId}_${itemId}_${nextItemId++}`;

	if (item.cb) {
		menuCallbacks[callbackId] = item.cb;
	}

	const newItem: MenuItem = {
		...item,
		id: itemId,
		callbackId: callbackId,
		cb: undefined
	};

	menus[menuId].items.push(newItem);
}

mp.events.add('cl:menuSelect', (dataString: string) => {
	if (INV_OPEN) return;
	if (chat.on) return;
	if (DIALOG_OPEN) return;

	try {
		const data = JSON.parse(dataString);

		if (data && data.menuId && menus[data.menuId]) {
			const item = menus[data.menuId].items.find((item) => item.id === data.id);
			if (item && item.callbackId && menuCallbacks[item.callbackId]) {
				menuCallbacks[item.callbackId](data.value);
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

mp.events.add('cl:menuClose', async () => {
	MENU_OPEN = false;
});

mp.events.add('cl:showMenu', (menuData: any) => {
	if (typeof chat !== 'undefined' && chat && chat.browser && chat.browser.call) {
		chat.browser.call('showMenu', menuData);
	}
});

export class Callbacks {
	private callbacks: { [key: number]: Function } = {};
	private callbackId = 0;

	call(name: string, cb: Function, ...args: any) {
		const id = this.callbackId++;
		this.callbacks[id] = cb;
		console.log(`[CLIENT] Calling server function: ${name}, CallbackID: ${id}, Args:`, args);
		mp.events.callRemote('corefx:callback', name, id, ...args);
	}

	handleResponse(callbackId: number, ...args: any) {
		console.log(`[CLIENT] Received response for CallbackID: ${callbackId}, Data:`, args);
		if (this.callbacks[callbackId]) {
			this.callbacks[callbackId](...args);
			delete this.callbacks[callbackId];
		} else {
			console.log(`[CLIENT] No matching callback found for ID: ${callbackId}`);
		}
	}
}

export var callbacks = new Callbacks();

mp.events.add('corefx:callbackResponse', (callbackId: number, ...args: any) => {
	callbacks.handleResponse(callbackId, ...args);
});

mp.nametags.enabled = false;

export var playerData: any = {};

export const SERVER_PUBLIC_IP = '79.118.112.192';

mp.events.add('changeBrowserUrl', (local: boolean) => {
	if (local) {
		chat.browser.url = 'http://localhost:5173';
		chat.browser.call('prefferedIp', '127.0.0.1');
	} else {
		chat.browser.call('prefferedIp', SERVER_PUBLIC_IP);
	}
});

mp.events.add('corefx:updateData', (data: any) => {
	if (typeof data === 'string') data = JSON.parse(data);
	playerData = data;
});

mp.events.add('corefx:playerReady', (data: any) => {
	playerData = data;

	mp.players.local.freezePosition(false);

	mp.players.local.position = new mp.Vector3(playerData.position.x, playerData.position.y, playerData.position.z);
	mp.players.local.heading = playerData.position.heading;
});

mp.events.add('corefx:updateUI', (data: any) => {
	chat.browser.call('updateUI', data);
});

let delKey = false;
let nearestPlayers: any[] = [];

mp.keys.bind(0x2e, true, async () => {
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

export async function Wait(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

export function DrawText3D(text: string, pos: Vector3, scale: number, font: number, color: [number, number, number, number], outline: boolean) {
	let onScreen = mp.game.graphics.world3dToScreen2d(new mp.Vector3(pos.x, pos.y, pos.z));
	if (onScreen) {
		mp.game.graphics.drawText(text, [onScreen.x, onScreen.y], {
			font: font,
			color: color,
			scale: [scale, scale],
			outline: outline
		});
	}
}

mp.events.add('render', () => {
	//disable TAB key
	mp.game.controls.disableControlAction(0, 37, true); // TAB
	mp.game.controls.disableControlAction(0, 199, true); // P

	if (delKey && nearestPlayers.length > 0) {
		for (let i = 0; i < nearestPlayers.length; i++) {
			let targetPlayer = mp.players.toArray().find((p) => p.getVariable('syncId') === nearestPlayers[i].syncId);
			if (!targetPlayer) continue;

			let pos = targetPlayer.position;
			let twoD = mp.game.graphics.world3dToScreen2d(new mp.Vector3(pos.x, pos.y, pos.z + 1));

			if (twoD) {
				let text = `${nearestPlayers[i].admin ? '~r~Admin~w~' : 'Player'}~n~${nearestPlayers[i].name} (${nearestPlayers[i].pId})`;
				mp.game.graphics.drawText(text, [twoD.x, twoD.y], {
					font: 0,
					color: [255, 255, 255, 255],
					scale: [0.3, 0.3],
					outline: true
				});
			}
		}
	}
});

mp.keys.bind(0x2e, false, () => {
	nearestPlayers = [];
	delKey = false;
});

let scoreboardVisible = false;
mp.keys.bind(0x09, true, async () => {
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

let dialogCallback: Function | null = null;
export let DIALOG_OPEN = false;

mp.events.add('confirmInput', (input: string) => {
	chat.browser.call('hideDialog');
	if (dialogCallback) dialogCallback(input);
	dialogCallback = null;

	mp.gui.cursor.show(false, false);
	mp.gui.cursor.visible = false;
	setTimeout(() => {
		setNuiFocus(false, false);
		DIALOG_OPEN = false;
	}, 500);
});

mp.events.add('cancelInput', () => {
	chat.browser.call('hideDialog');
	setTimeout(() => {
		DIALOG_OPEN = false;
	}, 500);
	setNuiFocus(false, false);
	if (typeof dialogCallback === 'function') {
		dialogCallback(false);
	}
	dialogCallback = null;
});

export async function Dialog(title: string, message: string, cb: Function) {
	while (DIALOG_OPEN) {
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	dialogCallback = cb;
	chat.browser.call('showDialog', title, message);
	setNuiFocus(true, true);

	mp.gui.cursor.show(true, true);
	mp.gui.cursor.visible = true;
	DIALOG_OPEN = true;
}

class Voice {
	static listeners: PlayerMp[] = [];
	static add(player: PlayerMp) {
		Voice.listeners.push(player);
		(player as any).isListening = true;
		mp.events.callRemote('voiceChat:addListener', player);
	}
	static remove(player: PlayerMp) {
		Voice.listeners = Voice.listeners.filter((p) => p !== player);
		(player as any).isListening = false;
		mp.events.callRemote('voiceChat:removeListener', player);
	}
	static clear() {
		Voice.listeners.forEach((p) => {
			(p as any).isListening = false;
			mp.events.callRemote('voiceChat:removeListener', p);
		});
		Voice.listeners = [];
	}
}

const TALK_KEY_N = 0x4e; //N key

mp.keys.bind(TALK_KEY_N, true, () => {
	mp.voiceChat.muted = false;
	mp.voiceChat.advancedNoiseSuppression = true;
	mp.voiceChat.networkOptimisations = true;
	mp.voiceChat.defaultVolume = 1.0;
});

mp.keys.bind(TALK_KEY_N, false, () => {
	mp.voiceChat.muted = true;
});

const VOICE_PROXIMITY = 5;

export async function VoiceChat() {
	while (true) {
		mp.players.forEachInStreamRange((player) => {
			if (player !== mp.players.local) {
				//@ts-ignore
				if (!player.isListening) {
					const playerPos = player.position;
					let dist = mp.game.system.vdist(
						playerPos.x,
						playerPos.y,
						playerPos.z,
						mp.players.local.position.x,
						mp.players.local.position.y,
						mp.players.local.position.z
					);
					if (dist <= VOICE_PROXIMITY) {
						Voice.add(player);
					}
				} else {
					let playerPos = player.position;
					let dist = mp.game.system.vdist(
						playerPos.x,
						playerPos.y,
						playerPos.z,
						mp.players.local.position.x,
						mp.players.local.position.y,
						mp.players.local.position.z
					);
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
	while (true) {
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

mp.events.add('playerEnterVehicle', () => {
	Speedometer();
});

export let Blips: any[] = [];
mp.events.add('mp:loadBlips', (blips: any) => {
	if (Blips.length > 0) {
		Blips.forEach((blip: any) => {
			if (mp.blips.exists(blip.blipentity)) {
				blip.blipentity.destroy();
			}
		});

		Blips = [];
	}

	Blips = blips;
	Blips.forEach((blip: any) => {
		blip.blipentity = mp.blips.new(blip.sprite, new mp.Vector3(blip.position.x, blip.position.y, blip.position.z), {
			color: blip.color,
			name: blip.name,
			scale: blip.scale,
			dimension: blip.dimension,
			shortRange: blip.shortRange
		});
	});
});

mp.events.add('corefx:playerReady', async () => {
	try {
		let blips = await mp.events.callRemoteProc('getBlips');
		mp.events.call('mp:loadBlips', blips);
	} catch (error) {
		console.error('Error getting blips:', error);
	}
});

mp.events.add('corefx:syncData', (data: any) => {
	playerData = data;
});

mp.events.add('corefx:equipWeapon', (weapon: string, ammo: number = 0, weaponName: string) => {
	mp.game.weapon.unequipEmptyWeapons = false;
	mp.players.local.giveWeapon(mp.game.joaat(weapon), ammo, true);
	setTimeout(() => {
		//@ts-ignore
		chat.browser.call(
			'equipWeapon',
			weapon,
			mp.players.local.getAmmoInClip(mp.game.joaat(weapon)),
			//@ts-ignore
			mp.players.local.getWeaponAmmo(mp.game.joaat(weapon)),
			weaponName
		);
	}, 500);
});

export function formatNumber(num: number) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

mp.events.add('corefx:unequipWeapon', (weapon: string) => {
	let ammo = mp.players.local.weaponAmmo;
	if (ammo > 0) {
		mp.events.callRemote('corefx:updateWeaponAmmo', weapon, ammo);
	}
	chat.browser.call('unequipWeapon', weapon);
	mp.players.local.removeAllWeapons();
});

mp.events.add('playerWeaponShot', () => {
	let currentWeapon = mp.players.local.weapon;
	let currentAmmo = mp.players.local.weaponAmmo;

	if (currentAmmo === 0) {
		mp.events.callRemote('corefx:updateWeaponAmmoToEquiped', 0);
	}

	//@ts-ignore
	chat.browser.call('updateWeaponAmmo', mp.players.local.getAmmoInClip(currentWeapon), mp.players.local.getWeaponAmmo(currentWeapon));
});

mp.events.add('corefx:updateWeaponAmmo', (ammo: number = 0) => {
	mp.players.local.weaponAmmo = ammo;
});

export function isPositionFree(pos: Vector3) {
	let vehicles = mp.vehicles.toArray().some((vehicle) => {
		let distance = mp.game.system.vdist(pos.x, pos.y, pos.z, vehicle.position.x, vehicle.position.y, vehicle.position.z);
		return distance < 2;
	});

	let peds = mp.peds.toArray().some((ped) => {
		let distance = mp.game.system.vdist(pos.x, pos.y, pos.z, ped.position.x, ped.position.y, ped.position.z);
		return distance < 2;
	});

	let objects = mp.objects.toArray().some((object) => {
		let distance = mp.game.system.vdist(pos.x, pos.y, pos.z, object.position.x, object.position.y, object.position.z);
		return distance < 2;
	});

	return !(vehicles || peds || objects);
}
