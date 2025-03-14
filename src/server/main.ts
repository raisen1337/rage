import { chat, newbieQuestions, tickets } from './chat';
import { Account, Blips, Vehicles } from './db'; // Import Sequelize models and operators
// Removing unused import: import fs from 'fs';

// Define types for player and vehicle
type PlayerMp = any;
type VehicleMp = any;

/*

// Define types for player and vehicle

 */

interface CoreInterface {
	players: { [key: string]: any };
	adminGrades: { [key: number]: string };
	notify: (player: PlayerMp, type: string, title: string, message: string, duration?: number) => void;
	formatMoney: (amount: number) => string;
	formatTime: (time: number) => string;
	formatNumber: (number: number) => string;
	GetPlayerData: (player: PlayerMp) => any | false;
}

// Map to store player data for comparison
const playerDataMap = new Map<string, any>();
// Map to track auto-save intervals by player ID
const playerSaveIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Creates a proxy to watch for changes in player data and sync it
 */
function watchPlayerData(playerId: string, data: any) {
	return new Proxy(data, {
		set(target, prop, value) {
			if (target[prop] !== value) {
				target[prop] = value;
				if (playerDataMap.has(playerId)) {
					playerDataMap.set(playerId, { ...target });
					const player = mp.players.toArray().find((p) => p.rgscId === playerId);
					if (player) {
						player.call('corefx:updateData', [target]);
						// Avoid circular reference
						// Core.players[player.rgscId] = target; // This line created a circular reference
					}
				}
			}
			return true;
		}
	});
}

export const Core: CoreInterface = {
	adminGrades: {
		0: '',
		1: '^3Helper in Teste^0',
		2: '^3Helper^0',
		3: '^3Helper Avansat^0',
		4: '^1Moderator^0',
		5: '^1Moderator Avansat^0',
		6: '^2Admin^0',
		7: '^2Head of Staff^0',
		8: '^5Owner^0',
		9: '^5Owner^0',
		10: '^5Developer^0',
		11: '^5Developer^0',
		12: '^5Developer^0',
		13: '^5Developer^0'
	},
	players: new Proxy(
		{},
		{
			set(target: any, playerId: string, data: any) {
				if (!target[playerId]) {
					playerDataMap.set(playerId, data);
					target[playerId] = watchPlayerData(playerId, data);
				} else {
					Object.assign(target[playerId], data);
				}
				return true;
			}
		}
	),
	GetPlayerData: (player: PlayerMp) => {
		if (!player || !player.rgscId) return false;
		return Core.players[player.rgscId] || false;
	},
	notify: (player: PlayerMp, type: string, title: string, message: string, duration: number = 5000) => {
		if (!player || !player.call) return;
		player.call('corefx:notify', [type, title, message, duration]);
	},
	formatMoney: (amount: number) => `$${amount.toLocaleString()}`,
	formatTime: (time: number) => new Date(time).toLocaleString(),
	formatNumber: (number: number) => number.toLocaleString()
};

/**
 * Save player account data to database
 * @param player The player whose data to save
 * @returns Promise that resolves when save is complete

 */
async function saveAccount(player: PlayerMp): Promise<void> {
	if (!player || !player.rgscId || !Core.players[player.rgscId]) return;

	const onlinePlayers = mp.players.toArray();
	const isOnline = onlinePlayers.some((p) => p.rgscId === player.rgscId);
	if (!isOnline) return;

	try {
		const accountData = { ...Core.players[player.rgscId] };
		accountData.position = player.position;
		accountData.heading = player.heading;
		console.log(`[AutoSave] Saving progress for ${player.name}...`);

		await Account.update(accountData, {
			where: { license: player.rgscId },
			fields: Object.keys(accountData) // Only update fields that exist in accountData
		});

		console.log(`[AutoSave] Progress saved for ${player.name}.`);

		// Check if player is still online after the save
		const stillOnline = mp.players.toArray().some((p) => p.rgscId === player.rgscId);
		if (!stillOnline) {
			console.log(`[AutoSave] ${player.name} is offline. Removing from Core.players.`);
			delete Core.players[player.rgscId];
			playerDataMap.delete(player.rgscId);

			// Clear any auto-save intervals
			if (playerSaveIntervals.has(player.rgscId)) {
				clearInterval(playerSaveIntervals.get(player.rgscId)!);
				playerSaveIntervals.delete(player.rgscId);
			}
		} else {
			// Sync data with client
			player.call('corefx:updateData', [accountData]);
		}
	} catch (error) {
		console.error(`[ERROR] Failed to save account for ${player.name}:`, error);
	}
}

/**
 * Create a new player account
 * @param player The player to create an account for
 * @returns The created account data
 */
async function createNewAccount(player: PlayerMp) {
	const data = {
		name: player.name,
		license: player.rgscId,
		cash: 0,
		bank: 0,
		position: {
			x: 0,
			y: 0,
			z: 0,
			h: 0
		},
		inventory: {
			items: [],
			weight: 0,
			maxWeight: 50,
			slots: 24
		},
		character: {
			firstName: 'Unknown',
			lastName: 'Unknown',
			age: 0,
			height: 0,
			model: 'mp_m_freemode_01',
			appearance: {}
		},
		licenses: {
			driver: false,
			weapon: false,
			pilot: false,
			boat: false,
			fishing: false
		},
		faction: {
			id: 1,
			name: 'Civilian',
			rank: {
				id: 1,
				name: 'Citizen'
			}
		},
		created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
		updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
		last_login: new Date().toISOString().slice(0, 19).replace('T', ' '),
		admin: Number(player.rgscId) === 209399696 ? 13 : 0, // Security issue: hardcoded admin ID
		dead: false,
		deadTime: 0,
		deadReason: '',
		deadPosition: {
			x: 0,
			y: 0,
			z: 0,
			h: 0
		}
	};

	// Insert new account
	const newAccount = await Account.create(data);

	// Update last_login after creation
	data.last_login = new Date().toISOString().slice(0, 19).replace('T', ' ');
	await Account.update({ last_login: data.last_login }, { where: { license: player.rgscId } });

	return newAccount.toJSON();
}

/**
 * Setup auto-save for a player
 */
function setupAutoSave(player: PlayerMp) {
	// Clear any existing intervals for this player
	if (playerSaveIntervals.has(player.rgscId)) {
		clearInterval(playerSaveIntervals.get(player.rgscId)!);
	}

	// Create new interval
	const intervalId = setInterval(() => {
		const isConnected = mp.players.toArray().some((p) => p.rgscId === player.rgscId);
		if (!isConnected) {
			clearInterval(intervalId);
			playerSaveIntervals.delete(player.rgscId);
			return;
		}

		chat.sendToPlayer(player, `^1[AutoSave] ^0Saving your progress...`);
		saveAccount(player);
	}, 5 * 60 * 1000);

	playerSaveIntervals.set(player.rgscId, intervalId);
}

// Define a map for player sync IDs
const playerSyncIds = new Map<number, number>();

// Handle player join event
mp.events.add('playerJoin', async (player: PlayerMp) => {
	// Assign a unique sync ID for the player
	playerSyncIds.set(player.id, playerSyncIds.size + 1);
	player.setVariable('syncId', playerSyncIds.get(player.id));

	try {
		// Check if account exists using Sequelize
		const exists = (await Account.count({ where: { license: player.rgscId } })) > 0;

		if (!exists) {
			const accountData = await createNewAccount(player);
			Core.players[player.rgscId] = accountData;
			Core.players[player.rgscId].onDuty = false;

			player.call('corefx:playerReady', [accountData]);
			setupAutoSave(player);

			// Dev environment check - should use environment variables instead of hardcoded IPs
			player.call('changeBrowserUrl', [player.ip === '192.168.1.133']);

			console.log(`[HelloBot] ${player.name} has joined the server for the first time.`);
			chat.sendToAdmins(`^1[HelloBot] ^0 ${player.name} has joined the server for the first time.`);
		} else {
			// Fetch existing account
			const account = await Account.findOne({ where: { license: player.rgscId } });

			if (account) {
				// Update last_login
				const updatedLastLogin = new Date().toISOString().slice(0, 19).replace('T', ' ');
				await account.update({ last_login: updatedLastLogin });

				const accountData = account.toJSON();
				Core.players[player.rgscId] = accountData;
				Core.players[player.rgscId].onDuty = false;

				// Dev environment check - use environment variables instead
				player.call('changeBrowserUrl', [player.ip === '192.168.1.133']);
				player.call('corefx:playerReady', [accountData]);

				// Setup voice chat
				mp.players.forEach((p: PlayerMp) => {
					if (p.rgscId !== player.rgscId) {
						player.enableVoiceTo(p);
					}
				});

				setupAutoSave(player);
				console.log(`[HelloBot] ${player.name} has rejoined the server. Last login: ${updatedLastLogin}`);
				chat.sendToAdmins(`^1[HelloBot] ^0 ${player.name} has rejoined the server. Last login: ${updatedLastLogin}`);
			}
		}
	} catch (error) {
		console.error(`[Error] Failed to handle playerJoin for ${player.name}:`, error);
	}
});

// Handle player quit event
mp.events.add('playerQuit', (player: PlayerMp) => {
	// Remove player sync ID
	playerSyncIds.delete(player.id);

	// Save player data before they leave
	if (player.rgscId && Core.players[player.rgscId]) {
		saveAccount(player);
	}

	// Clear auto-save interval
	if (player.rgscId && playerSaveIntervals.has(player.rgscId)) {
		clearInterval(playerSaveIntervals.get(player.rgscId)!);
		playerSaveIntervals.delete(player.rgscId);
	}

	// Cleanup any other players that might not be online anymore
	Object.keys(Core.players).forEach(async (key) => {
		const playerExists = mp.players.toArray().some((p) => p.rgscId === key);
		if (!playerExists && Core.players[key]) {
			try {
				await Account.update(Core.players[key], {
					where: { license: key },
					fields: Object.keys(Core.players[key])
				});
				console.log(`[AutoSave] Progress saved for offline player ${key}.`);
				delete Core.players[key];
				playerDataMap.delete(key);
			} catch (error) {
				console.error(`[ERROR] Failed to save account for offline player ${key}:`, error);
			}
		}
	});
});

// Handle player reload event
mp.events.add('playerReload', async (player: PlayerMp) => {
	console.log('Reload triggered for player', player.name);
	try {
		const exists = (await Account.count({ where: { license: player.rgscId } })) > 0;

		if (!exists) {
			const accountData = await createNewAccount(player);
			Core.players[player.rgscId] = accountData;
			Core.players[player.rgscId].onDuty = false;

			player.call('corefx:playerReady', [accountData]);

			// Dev environment check
			player.call('changeBrowserUrl', [player.ip === '192.168.1.133']);

			// Put player in a random dimension for separation
			player.dimension = Math.floor(Math.random() * 1000);

			console.log(`[HelloBot] ${player.name} has joined the server for the first time.`);
			chat.sendToAdmins(`^1[HelloBot] ^0 ${player.name} has joined the server for the first time.`);
		} else {
			// Fetch existing account
			const account = await Account.findOne({ where: { license: player.rgscId } });

			if (account) {
				// Update last_login
				const updatedLastLogin = new Date().toISOString().slice(0, 19).replace('T', ' ');
				await account.update({ last_login: updatedLastLogin });

				const accountData = account.toJSON();
				Core.players[player.rgscId] = accountData;
				Core.players[player.rgscId].onDuty = false;

				// Dev environment check
				player.call('changeBrowserUrl', [player.ip === '192.168.1.133']);
				player.call('corefx:playerReady', [accountData]);

				console.log(`[HelloBot] ${player.name} has rejoined the server. Last login: ${updatedLastLogin}`);
				chat.sendToAdmins(`^1[HelloBot] ^0 ${player.name} has rejoined the server. Last login: ${updatedLastLogin}`);
			}
		}
	} catch (error) {
		console.error(`[Error] Failed to handle playerReload for ${player.name}:`, error);
	}
});

// Handle player death event
mp.events.add('playerDeath', (player: PlayerMp) => {
	if (!player.rgscId) return;

	const account = Core.players[player.rgscId];
	if (!account) return;

	account.dead = 1;
	player.call('cl:showDeathscreen');
	saveAccount(player);
});

// Handle player revive event
mp.events.add('revivePed', (player: PlayerMp) => {
	if (!player.rgscId) return;

	const account = Core.players[player.rgscId];
	if (!account) return;

	account.dead = 0;
	player.call('cl:hideDeathscreen');
	saveAccount(player);
});

// Update UI for all players periodically
setInterval(() => {
	mp.players.forEach((player: PlayerMp) => {
		const playerData = Core.GetPlayerData(player);
		if (!playerData) return;

		const data = {
			cash: playerData.cash,
			bank: playerData.bank,
			name: playerData.name,
			id: playerData.id,
			admin: playerData.admin,
			currentPlayers: mp.players.length,
			maxPlayers: 1000,
			tickets: tickets.length,
			questions: newbieQuestions.length
		};

		player.call('corefx:updateUI', [data]);
	});
}, 1000);

// Voice chat events
mp.events.add('voiceChat:addListener', (player: PlayerMp, target: PlayerMp) => {
	if (player && target && player.rgscId !== target.rgscId) {
		player.enableVoiceTo(target);
	}
});

mp.events.add('voiceChat:removeListener', (player: PlayerMp, target: PlayerMp) => {
	if (player && target && player.rgscId !== target.rgscId) {
		player.disableVoiceTo(target);
	}
});

// Vehicle mod functions
export const getMods = (vehicle: VehicleMp) => {
	if (!vehicle) return {};

	const mods: any = {};

	// Get all mods from 0 to 67
	for (let i = 0; i <= 67; i++) {
		mods[`mod${i}`] = vehicle.getMod(i);
	}

	// Get vehicle colors
	mods.primaryColor = vehicle.getColorRGB(0) || [0, 0, 0];
	mods.secondaryColor = vehicle.getColorRGB(1) || [0, 0, 0];

	return mods;
};

export function setMods(vehicle: VehicleMp, mods: any) {
	if (!vehicle || !mods) return;

	// Set all mods
	for (let i = 0; i <= 67; i++) {
		const modValue = mods[`mod${i}`];
		if (modValue !== undefined && modValue !== null) {
			vehicle.setMod(i, modValue);
		}
	}

	// Set vehicle colors
	const primaryColor = mods.primaryColor || [0, 0, 0];
	const secondaryColor = mods.secondaryColor || [0, 0, 0];

	vehicle.setColorRGB(primaryColor[0], primaryColor[1], primaryColor[2], secondaryColor[0], secondaryColor[1], secondaryColor[2]);
}

// Update vehicle color event
mp.events.add('updateVehColor', async (player: PlayerMp) => {
	const vehicle = player.vehicle;
	if (!vehicle) return;

	try {
		const mods = getMods(vehicle);

		await Vehicles.update(
			{ mods },
			{
				where: {
					plate: vehicle.numberPlate.replace(/-/g, '')
				}
			}
		);
	} catch (error) {
		console.error(`[ERROR] Failed to update vehicle color:`, error);
	}
});

// Get vehicle mods from database
export async function getModsFromDb(plate: string) {
	if (!plate) return {};

	try {
		const dbVehicle = await Vehicles.findOne({ where: { plate: plate } });
		if (!dbVehicle) return {};

		return dbVehicle.mods || {};
	} catch (error) {
		console.error(`[ERROR] Failed to get mods from DB for plate ${plate}:`, error);
		return {};
	}
}

// Set vehicle mod event
mp.events.add('vehSetMod', async (player: PlayerMp, modType: number, modIndex: number, price: string) => {
	const vehicle = player.vehicle;
	if (!vehicle) return;

	// Validate input


	// Prevent applying the same mod
	if (vehicle.getMod(modType) === modIndex) {
		return chat.sendToPlayer(player, `^1[Error] ^0You already have this mod applied!`);
	}

	try {
		// Validate price is a number
		const numericPrice = parseInt(price, 10);
		if (isNaN(numericPrice) || numericPrice < 0) {
			return chat.sendToPlayer(player, `^1[Error] ^0Invalid price!`);
		}

		// Check if player can afford it
		const playerData = Core.GetPlayerData(player);
		if (!playerData) {
			return chat.sendToPlayer(player, `^1[Error] ^0Player data not found!`);
		}

		if (playerData.cash < numericPrice) {
			return chat.sendToPlayer(player, `^1[Error] ^0You don't have enough money!`);
		}

		// Get vehicle plate
		const plate = vehicle.numberPlate.replace(/-/g, '');

		// Verify vehicle exists in database
		const dbVehicle = await Vehicles.findOne({ where: { plate } });
		if (!dbVehicle) {
			return chat.sendToPlayer(player, `^1[Error] ^0Vehicle not found in database!`);
		}

		// Apply the mod
		vehicle.setMod(modType, modIndex);

		// Update player cash
		playerData.cash -= numericPrice;
		await Account.update({ cash: playerData.cash }, { where: { license: player.rgscId } });

		// Update client data
		player.call('corefx:updateData', [playerData]);

		// Update vehicle mods in DB
		const mods = getMods(vehicle);
		await Vehicles.update({ mods }, { where: { plate } });

		// Send success message
		chat.sendToPlayer(player, `^2[Success] ^0Ai plătit ^1$${Core.formatNumber(numericPrice)} ^0pentru a aplica acest mod!`);
	} catch (error) {
		console.error(`[ERROR] Failed to set vehicle mod:`, error);
		chat.sendToPlayer(player, `^1[Error] ^0An error occurred while applying the mod!`);
	}
});

// Save vehicle tuning event
mp.events.add('saveTuning', async (_player: PlayerMp, plate: string) => {
	if (!plate) return;

	try {
		const sanitizedPlate = plate.replace(/-/g, '');
		const vehicle = mp.vehicles.toArray().find((v) => v.numberPlate.replace(/-/g, '') === sanitizedPlate);

		if (!vehicle) {
			return console.error(`[ERROR] Vehicle with plate ${sanitizedPlate} not found for tuning save`);
		}

		const mods = getMods(vehicle);

		await Vehicles.update({ mods }, { where: { plate: sanitizedPlate } });
	} catch (error) {
		console.error(`[ERROR] Failed to save tuning for plate ${plate}:`, error);
	}
});

// Set vehicle secondary color event
mp.events.add('setVehSecondaryColor', async (player: PlayerMp, r: number, g: number, b: number) => {
	const vehicle = player.vehicle;
	if (!vehicle) return;

	try {
		// Validate RGB values
		r = Math.min(255, Math.max(0, r));
		g = Math.min(255, Math.max(0, g));
		b = Math.min(255, Math.max(0, b));

		const primaryRGB = vehicle.getColorRGB(0) || [0, 0, 0];
		vehicle.setColorRGB(primaryRGB[0], primaryRGB[1], primaryRGB[2], r, g, b);

		// Update DB
		const plate = vehicle.numberPlate.replace(/-/g, '');
		const mods = getMods(vehicle);

		await Vehicles.update({ mods }, { where: { plate } });
	} catch (error) {
		console.error(`[ERROR] Failed to set vehicle secondary color:`, error);
	}
});

// Set vehicle primary color event
mp.events.add('setVehPrimaryColor', async (player: PlayerMp, r: number, g: number, b: number) => {
	const vehicle = player.vehicle;
	if (!vehicle) return;

	try {
		// Validate RGB values
		r = Math.min(255, Math.max(0, r));
		g = Math.min(255, Math.max(0, g));
		b = Math.min(255, Math.max(0, b));

		const secondaryRGB = vehicle.getColorRGB(1) || [0, 0, 0];
		vehicle.setColorRGB(r, g, b, secondaryRGB[0], secondaryRGB[1], secondaryRGB[2]);

		// Update DB
		const plate = vehicle.numberPlate.replace(/-/g, '');
		const mods = getMods(vehicle);

		await Vehicles.update({ mods }, { where: { plate } });
	} catch (error) {
		console.error(`[ERROR] Failed to set vehicle primary color:`, error);
	}
});

// Function to reload blips for all players
async function reloadBlipsForAllPlayers() {
	try {
		const blips = await Blips.findAll();
		mp.players.forEach((p: any) => {
			if (p && p.call) {
				p.call('mp:loadBlips', [blips]);
			}
		});
	} catch (error) {
		console.error(`[ERROR] Failed to reload blips:`, error);
	}
}

// Add blip to database event
mp.events.add('mp:addBlipToDb', async (_player: PlayerMp, blipDataString: string) => {
	try {
		const blipData = JSON.parse(blipDataString);

		// Validate blip data
		if (
			!blipData.name ||
			typeof blipData.color !== 'number' ||
			!blipData.pos ||
			typeof blipData.sprite !== 'number' ||
			typeof blipData.scale !== 'number'
		) {
			return console.error(`[ERROR] Invalid blip data:`, blipData);
		}

		await Blips.create({
			name: blipData.name,
			color: blipData.color,
			position: blipData.pos,
			sprite: blipData.sprite,
			scale: blipData.scale,
			shortRange: !!blipData.shortRange,
			dimension: blipData.dimension || 0
		});

		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to add blip to DB:`, error);
	}
});

// Get all blips
mp.events.addProc('getBlips', async () => {
	try {
		return await Blips.findAll();
	} catch (error) {
		console.error(`[ERROR] Failed to get blips:`, error);
		return [];
	}
});

// Set blip name event
mp.events.add('mp:setBlipName', async (_player: PlayerMp, blipId: number, name: string) => {
	try {
		const blip = await Blips.findByPk(blipId);
		if (!blip) return;

		await blip.update({ name });
		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to set blip name:`, error);
	}
});

// Set blip color event
mp.events.add('mp:setBlipColor', async (_player: PlayerMp, blipId: number, color: number) => {
	try {
		const blip = await Blips.findByPk(blipId);
		if (!blip) return;

		await blip.update({ color });
		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to set blip color:`, error);
	}
});

// Set blip sprite event
mp.events.add('mp:setBlipSprite', async (_player: PlayerMp, blipId: number, sprite: number) => {
	try {
		const blip = await Blips.findByPk(blipId);
		if (!blip) return;

		await blip.update({ sprite });
		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to set blip sprite:`, error);
	}
});

// Set blip scale event
mp.events.add('mp:setBlipScale', async (_player: PlayerMp, blipId: number, scale: number) => {
	try {
		const blip = await Blips.findByPk(blipId);
		if (!blip) return;

		await blip.update({ scale });
		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to set blip scale:`, error);
	}
});

// Set blip short range event
mp.events.add('mp:setBlipShortRange', async (_player: PlayerMp, blipId: number, shortRange: boolean) => {
	try {
		const blip = await Blips.findByPk(blipId);
		if (!blip) return;

		await blip.update({ shortRange });
		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to set blip short range:`, error);
	}
});

// Set blip position event
mp.events.add('mp:setBlipPosition', async (_player: PlayerMp, blipId: number, position: any) => {
	try {
		const blip = await Blips.findByPk(blipId);
		if (!blip) return;

		await blip.update({ position });
		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to set blip position:`, error);
	}
});

// Delete blip event
mp.events.add('mp:deleteBlip', async (_player: PlayerMp, blipId: number) => {
	try {
		const blip = await Blips.findByPk(blipId);
		if (!blip) return;

		await blip.destroy();
		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to delete blip:`, error);
	}
});

// Set blip dimension event
mp.events.add('mp:setBlipDimension', async (_player: PlayerMp, blipId: number, dimension: number) => {
	try {
		const blip = await Blips.findByPk(blipId);
		if (!blip) return;

		await blip.update({ dimension });
		await reloadBlipsForAllPlayers();
	} catch (error) {
		console.error(`[ERROR] Failed to set blip dimension:`, error);
	}
});

// Check if player is a developer or regular player
mp.events.addProc('isDevOrPlayer', (player: PlayerMp) => {
	if (player.ip === '192.168.1.133') {
		// console.log('isDevOrPlayer', true)
		return 'True';
	} else {
		// console.log('isDevOrPlayer', false)
		return 'False';
	}
});
