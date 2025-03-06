import { chat } from '@/chat';
import { Account, Inventories } from '@/db'; // Import Inventories model
import { Core } from '@/main';

export interface InventoryItem {
	name: string;
	label: string;
	description: string;
	weight: number;
	stackable: boolean;
	amount: number;
	usable: boolean;
	slot: number;
	metadata: any[];
}

export interface registeredItemsInterface {
	name: string;
	label: string;
	description: string;
	weight: number;
	stackable: boolean;
	canBeDropped: boolean;
	canBeGiven: boolean;
	canBeUsed: boolean;
	canBeStacked: boolean;
	canBeRemoved: boolean;
	usable: boolean;
	use: (player: PlayerMp, amount: number) => void;
}

export interface registeredItems {
	[key: string]: registeredItemsInterface;
}

let registeredItems: registeredItems = {};

export interface Inventory {
	items: InventoryItem[];
	weight: number;
	maxWeight: number;
	slots: number; // total available slots in the inventory
}

function isWeapon(itemName: string) {
	return itemName.startsWith('weapon_');
}

function isAmmo(itemName: string) {
	return itemName.endsWith('_ammo');
}

export function registerItem(
	itemName: string,
	label: string,
	description: string,
	weight: number,
	stackable: boolean,
	usable: boolean,
	canBeDropped: boolean,
	canBeGiven: boolean,
	canBeUsed: boolean,
	canBeStacked: boolean,
	canBeRemoved: boolean,
	use: (player: PlayerMp, amount: number) => void
) {
	registeredItems[itemName] = {
		name: itemName,
		label: label,
		description,
		weight,
		stackable,
		usable,
		canBeDropped,
		canBeGiven,
		canBeUsed,
		canBeStacked,
		canBeRemoved,
		use
	};
}

export function getItemByName(name: string): registeredItemsInterface | null {
	return registeredItems[name] || null;
}

// Helper: deep compare metadata arrays
export function compareMetadata(a: any[], b: any[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

// Helper: find first free slot in the inventory
export function getFreeSlot(player: PlayerMp): number | null {
	let PlayerData = Core.GetPlayerData(player);
	const totalSlots = PlayerData.inventory.slots;
	const usedSlots = PlayerData.inventory.items.map((item: InventoryItem) => item.slot);
	for (let i = 1; i <= totalSlots; i++) {
		if (!usedSlots.includes(i)) {
			return i;
		}
	}
	return null;
}

export function addItem(player: PlayerMp, itemName: string, amount: number, metadata: any[], cb: Function) {
	const item = getItemByName(itemName);
	let PlayerData = Core.GetPlayerData(player);
	if (!item) {
		Core.notify(player, 'error', 'Error', `Item ${itemName} does not exist`, 5000);
		cb({
			success: false,
			message: `Registered item '${itemName}' does not exist.`
		});
		return;
	}

	// Check weight
	let canCarry = PlayerData.inventory.weight + item.weight * amount <= PlayerData.inventory.maxWeight;
	if (!canCarry) {
		Core.notify(player, 'error', 'Error', `You can't carry that much weight`, 5000);
		cb({
			success: false,
			message: `You do not have enough space in your inventory to carry ${amount}x ${item.label}.`
		});
		return;
	}
	let freeSlot = getFreeSlot(player);
	if (freeSlot === null) {
		Core.notify(player, 'error', 'Error', `No free inventory slot available`, 5000);
		cb({
			success: false,
			message: `Your inventory is full. No free slots available.`
		});
		return;
	}

	// For stackable items, check if a matching stack exists
	if (item.stackable) {
		const existingItems = PlayerData.inventory.items.filter((invItem: InventoryItem) => invItem.name === item.name);
		const matchingItem = existingItems.find((invItem: InventoryItem) => compareMetadata(invItem.metadata, metadata));
		if (matchingItem) {
			matchingItem.amount += amount;
			PlayerData.inventory.weight += item.weight * amount;
			Core.notify(player, 'success', 'Success', `You have received ${amount}x${item.label}`, 5000);
			cb({
				success: true,
				message: `Successfully added ${amount}x ${item.label} to existing stack.`
			});
			chat.sendToAdmins(`^1[INV]^0 ${player.name} has received ${amount}x${item.label}`);
			saveAccount(player); // Save account after inventory change
			return;
		}
	}

	// For non-stackable items or no matching stack, check for a free slot

	// Add the item to the inventory using the free slot
	PlayerData.inventory.items.push({
		name: item.name,
		label: item.label,
		description: item.description,
		weight: item.weight,
		stackable: item.stackable,
		amount,
		usable: item.usable,
		slot: freeSlot,
		metadata
	});
	PlayerData.inventory.weight += item.weight * amount;
	Core.notify(player, 'success', 'Success', `You have received ${amount}x${item.label}`, 5000);
	cb({
		success: true,
		message: `Successfully added ${amount}x ${item.label} to a new slot.`
	});
	chat.sendToAdmins(`^1[INV]^0 ${player.name} has received ${amount}x${item.label}`);
	saveAccount(player); // Save account after inventory change
}

export function removeItem(player: PlayerMp, itemName: string, amount: number, metadata: any[], cb: Function, forced: boolean = false) {
	const item = getItemByName(itemName);
	let PlayerData = Core.GetPlayerData(player);
	if (!item) {
		Core.notify(player, 'error', 'Error', `Item ${itemName} does not exist`, 5000);
		cb({
			success: false,
			message: `Registered item '${itemName}' does not exist.`
		});
		return;
	}

	// Find the matching item by name and metadata
	let itemInInventory =
		PlayerData.inventory.items.find((i: InventoryItem) => i.name === item.name && compareMetadata(i.metadata, metadata)) || null;
	if (!itemInInventory) {
		cb({
			success: false,
			message: `You do not have '${item.label}' with the specified properties in your inventory.`
		});
		return;
	}
	if (itemInInventory.amount < amount) {
		Core.notify(player, 'error', 'Error', `You do not have enough ${item.label}`, 5000);
		cb({
			success: false,
			message: `You do not have enough '${item.label}' in your inventory. Available: ${itemInInventory.amount}, Requested: ${amount}.`
		});
		return;
	}
	itemInInventory.amount -= amount;
	PlayerData.inventory.weight -= item.weight * amount;
	if (itemInInventory.amount <= 0) {
		// Remove the item from inventory (freeing its slot)
		PlayerData.inventory.items = PlayerData.inventory.items.filter((i: InventoryItem) => i.slot !== itemInInventory.slot);
	}
	Core.notify(player, 'success', 'Success', `You have lost ${amount}x${item.label}`, 5000);
	cb({
		success: true,
		message: `Successfully removed ${amount}x ${item.label} from your inventory.`
	});
	chat.sendToAdmins(`^1[INV]^0 ${player.name} has lost ${amount}x${item.label}`);
	saveAccount(player); // Save account after inventory change
}

export function getPlayerItems(player: PlayerMp, cb: Function) {
	let PlayerData = Core.GetPlayerData(player);
	cb({
		success: true,
		items: PlayerData.inventory.items
	});
}

export function useItem(player: PlayerMp, itemName: string, amount: number = 1, cb: Function) {
	console.log(`Using item ${itemName} with amount ${amount}`);
	let PlayerData = Core.GetPlayerData(player);
	let item = PlayerData.inventory.items.find((i: InventoryItem) => i.name === itemName) || null;
	if (!item) {
		Core.notify(player, 'error', 'Error', `Item ${itemName} does not exist in your inventory`, 5000);
		cb({
			success: false,
			message: `Item '${itemName}' not found in your inventory.`
		});
		return;
	}
	if (!item.usable) {
		Core.notify(player, 'error', 'Error', `Item ${itemName} is not usable`, 5000);
		cb({
			success: false,
			message: `'${item.label}' is not marked as usable.`
		});
		return;
	}
	let itemData = getItemByName(itemName);
	if (!itemData) {
		Core.notify(player, 'error', 'Error', `Item ${itemName} does not exist`, 5000);
		cb({
			success: false,
			message: `Registered item '${itemName}' does not exist.`
		});
		return;
	}
	if (itemData.canBeRemoved && itemData.canBeUsed) {
		if (!isAmmo(itemData.name)) {
			removeItem(player, itemName, amount, item.metadata, (removeData: any) => {
				if (removeData.success) {
					itemData.use(player, amount);
					cb({
						success: true,
						message: `Successfully used ${amount}x ${item.label} and removed from inventory.`
					});
					saveAccount(player); // Save account after inventory change
				} else {
					cb({
						success: false,
						message: `Failed to remove ${amount}x ${item.label} after usage.`
					});
				}
			});
		} else {
			itemData.use(player, amount);
			cb({
				success: true,
				message: `Successfully used ${amount}x ${item.label}.`
			});
			saveAccount(player); // Save account after inventory change
		}
	} else {
		itemData.use(player, amount);
		cb({
			success: true,
			message: `Successfully used ${amount}x ${item.label}.`
		});
		saveAccount(player); // Save account after inventory change
	}
}

// New function: remove item from a specific slot
export function removeItemFromSlot(player: PlayerMp, slot: number, amount: number, cb: Function) {
	let PlayerData = Core.GetPlayerData(player);
	let itemInSlot = PlayerData.inventory.items.find((i: InventoryItem) => i.slot === slot);
	if (!itemInSlot) {
		Core.notify(player, 'error', 'Error', `No item found in slot ${slot}`, 5000);
		cb({
			success: false,
			message: `No item found in inventory slot ${slot}.`
		});
		return;
	}
	if (itemInSlot.amount < amount) {
		Core.notify(player, 'error', 'Error', `Not enough ${itemInSlot.label} in slot ${slot}`, 5000);
		cb({
			success: false,
			message: `Not enough '${itemInSlot.label}' in slot ${slot}. Available: ${itemInSlot.amount}, Requested: ${amount}.`
		});
		return;
	}
	itemInSlot.amount -= amount;
	PlayerData.inventory.weight -= itemInSlot.weight * amount;
	if (itemInSlot.amount <= 0) {
		// Remove the item entirely, freeing the slot
		PlayerData.inventory.items = PlayerData.inventory.items.filter((i: InventoryItem) => i.slot !== slot);
	}
	Core.notify(player, 'success', 'Success', `You have removed ${amount}x${itemInSlot.label} from slot ${slot}`, 5000);
	cb({
		success: true,
		message: `Successfully removed ${amount}x ${itemInSlot.label} from slot ${slot}.`
	});
	chat.sendToAdmins(`^1[INV]^0 ${player.name} removed ${amount}x${itemInSlot.label} from slot ${slot}`);
	saveAccount(player); // Save account after inventory change
}

registerItem(
	'water_bottle',
	'Sticla de apa',
	'O sticla de apa',
	0.5,
	true,
	true,
	true,
	true,
	true,
	true,
	true,
	(player: PlayerMp, amount: number) => {
		Core.notify(player, 'success', 'Success', `You have used ${amount}x water`, 5000);
	}
);

registerItem('apple', 'Mar', 'Un mar', 0.5, true, true, true, true, true, true, true, (player: PlayerMp, amount: number) => {
	Core.notify(player, 'success', 'Success', `You have used ${amount}x food`, 5000);
});

// Transforming events to procedures (procs):

mp.events.addProc('inventory:addItem', (player: PlayerMp, itemName: string, amount: number, metadata: any[]) => {
	let result: any;
	addItem(player, itemName, amount, metadata, (data: any) => {
		result = data;
	});
	return result;
});

mp.events.addProc('inventory:useItem', (player: PlayerMp, slot: number, amount: number) => {
	// Modified to accept slot
	let PlayerData = Core.GetPlayerData(player);
	let itemDataInInventory = PlayerData.inventory.items.find((i: InventoryItem) => i.slot === slot) || null; // Find by slot
	if (!itemDataInInventory) {
		return { success: false, message: `No item found in slot ${slot} in your inventory.` }; // Specific error
	}
	let result: any;
	useItem(player, itemDataInInventory.name, amount, (data: any) => {
		// Use item name from inventory
		result = data;
		if (data.success && itemDataInInventory) {
			// Use the metadata from the found item when removing it
			return result;
		}
	});
	return result;
});

mp.events.addProc('inventory:removeItem', (player: PlayerMp, itemName: string, amount: number, metadata: any[]) => {
	let result: any;
	removeItem(player, itemName, amount, metadata, (data: any) => {
		result = data;
	});
	return result;
});

mp.events.addProc('inventory:giveItem', (player: PlayerMp, playerId: string, itemName: string, amount: number, metadata: any[]) => {
	let targetPlayer = Object.values(Core.players).find((p: any) => p.id === playerId) || null;
	if (!targetPlayer) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
		return { success: false, message: `Player with ID '${playerId}' not found in server players data.` };
	}

	let targetMp = mp.players.toArray().find((p) => p.rgscId === targetPlayer.rgscId);
	if (!targetMp) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
		return { success: false, message: `Player with ID '${playerId}' is not currently online.` };
	}

	let result: any;
	addItem(targetMp, itemName, amount, metadata, (data: any) => {
		result = data;
		if (data.success) {
			saveAccount(targetMp); // Save target player's account after inventory change
		}
	});
	return result;
});

mp.events.addProc('inventory:getPlayerInventory', (player: PlayerMp) => {
	return Core.players[player.rgscId].inventory;
});

mp.events.addProc('inventory:getPlayerItems', (player: PlayerMp) => {
	let result: any;
	getPlayerItems(player, (data: any) => {
		result = data;
	});
	return result;
});

mp.events.addProc('inventory:getPlayerItemsById', (player: PlayerMp, playerId: string) => {
	let targetPlayer = Object.values(Core.players).find((p: any) => p.id === playerId) || null;
	if (!targetPlayer) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
		return { success: false, message: `Player with ID '${playerId}' not found in server players data.` };
	}

	let targetMp = mp.players.toArray().find((p) => p.rgscId === targetPlayer.rgscId);
	if (!targetMp) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
		return { success: false, message: `Player with ID '${playerId}' is not currently online.` };
	}

	let result: any;
	getPlayerItems(targetMp, (data: any) => {
		result = data;
	});
	return result;
});

mp.events.addProc('inventory:removeItemFromPlayer', (player: PlayerMp, playerId: string, itemName: string, amount: number, metadata: any[]) => {
	let targetPlayer = Object.values(Core.players).find((p: any) => p.id === playerId) || null;
	if (!targetPlayer) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
		return { success: false, message: `Player with ID '${playerId}' not found in server players data.` };
	}

	let targetMp = mp.players.toArray().find((p) => p.rgscId === targetPlayer.rgscId);
	if (!targetMp) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
		return { success: false, message: `Player with ID '${playerId}' is not currently online.` };
	}

	let result: any;
	removeItem(targetMp, itemName, amount, metadata, (data: any) => {
		result = data;
		if (data.success) {
			saveAccount(targetMp); // Save target player's account after inventory change
		}
	});
	return result;
});

mp.events.addProc('inventory:removeItemFromSlot', (player: PlayerMp, slot: number, amount: number) => {
	let result: any;
	removeItemFromSlot(player, slot, amount, (data: any) => {
		result = data;
	});
	return result;
});

let drops: any[] = [];

const dropsProxy = new Proxy(drops, {
	set(target: any, property: any, value: any) {
		console.log(`Drop at index ${property} has been set to`, value);
		target[property] = value;
		let players = mp.players.toArray();
		players.forEach((player: PlayerMp) => {
			player.call('inventory:updateDrops', [target, drops]);
		});
		return true;
	},
	deleteProperty(target: any, property: any) {
		console.log(`Drop at index ${property} has been deleted`);
		delete target[property];
		let players = mp.players.toArray();
		players.forEach((player: PlayerMp) => {
			player.call('inventory:updateDrops', [target, drops]);
		});
		return true;
	}
});

drops = dropsProxy;

export function dropItem(player: PlayerMp, itemName: string, amount: number, cb: Function) {
	let PlayerData = Core.GetPlayerData(player);
	let item = PlayerData.inventory.items.find((i: InventoryItem) => i.name === itemName) || null;
	if (!item) {
		Core.notify(player, 'error', 'Error', `Item ${itemName} does not exist in your inventory`, 5000);
		cb({
			success: false,
			message: `Item '${itemName}' not found in your inventory.`
		});
		return;
	}
	let itmData = getItemByName(itemName);
	if (!itmData?.canBeDropped) {
		Core.notify(player, 'error', 'Error', `Item ${itemName} cannot be dropped`, 5000);
		cb({
			success: false,
			message: `'${itemName}' cannot be dropped. Check item properties.`
		});
		return;
	}
	removeItem(player, itemName, amount, item.metadata, (data: any) => {
		if (data.success) {
			// Find drop by distance between player and other drops
			let drop = drops.find((d: any) => player.dist(d.position) < 2) || null;
			if (!drop) {
				drops.push({
					createdBy: player.name,
					items: [
						{
							name: item.name,
							label: item.label,
							amount,
							metadata: item.metadata
						}
					],
					position: player.position
				});
				Core.notify(player, 'success', 'Success', `You have dropped ${amount}x${item.label}`, 5000);
				cb({
					success: true,
					message: `Successfully dropped ${amount}x ${item.label}. New drop created.`
				});
				chat.sendToAdmins(`^1[INV]^0 ${player.name} has dropped ${amount}x${item.label}`);
				saveAccount(player); // Save account after inventory change
				return;
			} else {
				let itemInDrop = drop.items.find((i: InventoryItem) => i.name === item.name && compareMetadata(i.metadata, item.metadata)) || null;
				if (itemInDrop) {
					itemInDrop.amount += amount;
					Core.notify(player, 'success', 'Success', `You have dropped ${amount}x${item.label}`, 5000);
					cb({
						success: true,
						message: `Successfully dropped ${amount}x ${item.label}. Added to existing drop.`
					});
					chat.sendToAdmins(`^1[INV]^0 ${player.name} has dropped ${amount}x${item.label}`);
					saveAccount(player); // Save account after inventory change
					return;
				} else {
					drop.items.push({
						name: item.name,
						label: item.label,
						amount,
						metadata: item.metadata
					});
					Core.notify(player, 'success', 'Success', `You have dropped ${amount}x${item.label}`, 5000);
					cb({
						success: true,
						message: `Successfully dropped ${amount}x ${item.label}. Added to existing drop.`
					});
					chat.sendToAdmins(`^1[INV]^0 ${player.name} has dropped ${amount}x${item.label}`);
					saveAccount(player); // Save account after inventory change
					return;
				}
			}
		} else {
			cb({
				success: false,
				message: `Failed to remove ${amount}x ${item.label} from your inventory for dropping.`
			});
		}
	});
}

export function getDrops(_player: PlayerMp, cb: Function) {
	cb({
		success: true,
		drops
	});
}

export function getClosestDrop(player: PlayerMp, cb: Function) {
	let closestDrop = drops.find((d: any) => player.dist(d.position) < 2) || null;
	cb({
		success: true,
		drop: closestDrop
	});
}

mp.events.addProc('inventory:dropItem', (player: PlayerMp, slot: number, amount: number) => {
	// Modified to accept slot
	let PlayerData = Core.GetPlayerData(player);
	let itemInSlot = PlayerData.inventory.items.find((i: InventoryItem) => i.slot === slot) || null;
	if (!itemInSlot) {
		return { success: false, message: `No item found in slot ${slot} in your inventory.` }; // Specific error
	}
	let result: any;
	dropItem(player, itemInSlot.name, amount, (data: any) => {
		// Use item name from slot
		result = data;
	});
	return result;
});

mp.events.addProc('inventory:getDrops', (player: PlayerMp) => {
	let result: any;
	getDrops(player, (data: any) => {
		result = data;
	});
	return result;
});

mp.events.addProc('inventory:getClosestDrop', (player: PlayerMp) => {
	let result: any;
	getClosestDrop(player, (data: any) => {
		result = data;
	});
	return result;
});

export function moveItem(player: PlayerMp, from: any, to: any, cb: Function) {
	let PlayerData = Core.GetPlayerData(player);
	let item = PlayerData.inventory.items.find((i: InventoryItem) => i.slot === from) || null;
	if (!item) {
		Core.notify(player, 'error', 'Error', `No item found in slot ${from}`, 5000);
		cb({
			success: false,
			message: `No item found in inventory slot ${from}.`
		});
		return;
	}
	if (item.slot === to) {
		Core.notify(player, 'error', 'Error', `Item is already in slot ${to}`, 5000);
		cb({
			success: false,
			message: `Item is already in slot ${to}. No move needed.`
		});
		return;
	}
	let itemInSlot = PlayerData.inventory.items.find((i: InventoryItem) => i.slot === to) || null;
	if (itemInSlot) {
		itemInSlot.slot = from;
	}
	item.slot = to;
	cb({
		success: true,
		message: `Successfully moved item from slot ${from} to slot ${to}.`
	});
	saveAccount(player); // Save account after inventory change
}

mp.events.addProc(`inventory:moveItem`, (player: PlayerMp, from: any, to: any) => {
	moveItem(player, from, to, (_data: any) => {});
	return Core.players[player.rgscId].inventory;
});

//@sequelize
mp.events.addProc('getClosestVehicleInventory', (player: PlayerMp) => {
	let closestVehicle = mp.vehicles.toArray().find((v: VehicleMp) => player.dist(v.position) < 4) || null;
	if (!closestVehicle) {
		return { success: false, message: `No vehicle found within a 4 meter radius.` };
	}
	let plate = closestVehicle.numberPlate.replace(/\s/g, '');
	return Inventories.findOne({ where: { identifier: plate } })
		.then((vehicleInventory: any) => {
			if (!vehicleInventory) {
				//create
				return Inventories.create({
					identifier: plate,
					data: {
						identifier: plate,
						type: 'vehicle'
					},
					inventory: {
						slots: 10,
						weight: 0,
						maxWeight: 100,
						items: []
					}
				}).then(() => {
					return {
						success: true,
						inventory: {
							data: {
								identifier: plate,
								type: 'vehicle'
							},
							identifier: plate,
							slots: 10,
							weight: 0,
							maxWeight: 100,
							items: []
						},
						message: `Vehicle inventory created for plate: ${plate}.`
					}; // Added message
				});
			} else {
				return {
					success: true,
					inventory: {
						data: {
							identifier: plate,
							type: 'vehicle'
						},
						identifier: plate,
						slots: vehicleInventory.inventory.slots,
						weight: vehicleInventory.inventory.weight,
						maxWeight: vehicleInventory.inventory.maxWeight,
						items: vehicleInventory.inventory.items
					},
					message: `Vehicle inventory retrieved for plate: ${plate}.`
				}; // Added message
			}
		})
		.catch((error: any) => {
			console.error(error);
			return { success: false, message: `Error retrieving vehicle inventory from database. See server console for details.` }; // Specific error
		});
});

mp.events.addProc('getVehicleInventory', (player: PlayerMp, plate: any) => {
	let closestVehicle =
		mp.vehicles.toArray().find((v: VehicleMp) => player.dist(v.position) < 2 && v.numberPlate.replace(/\s/g, '') === plate) || null;
	if (!closestVehicle) {
		return { success: false, message: `No vehicle found within a 2 meter radius with plate: ${plate}.` }; // Specific error
	}
	plate = `${plate}-glovebox`;
	return Inventories.findOne({ where: { identifier: plate } })
		.then((vehicleInventory: any) => {
			if (!vehicleInventory) {
				//create
				return Inventories.create({
					identifier: plate,
					data: {
						identifier: plate,
						type: 'vehicle'
					},
					inventory: {
						slots: 10,
						weight: 0,
						maxWeight: 10,
						items: []
					}
				}).then(() => {
					return {
						success: true,
						inventory: {
							data: {
								identifier: plate,
								type: 'vehicle'
							},
							identifier: plate,
							slots: 10,
							weight: 0,
							maxWeight: 10,
							items: []
						},
						message: `Vehicle glovebox inventory created for plate: ${plate}.`
					}; // Added message
				});
			} else {
				return {
					success: true,
					inventory: {
						data: {
							identifier: plate,
							type: 'vehicle'
						},
						identifier: plate,
						slots: vehicleInventory.inventory.slots,
						weight: vehicleInventory.inventory.weight,
						maxWeight: vehicleInventory.inventory.maxWeight,
						items: vehicleInventory.inventory.items
					},
					message: `Vehicle glovebox inventory retrieved for plate: ${plate}.`
				}; // Added message
			}
		})
		.catch((error: any) => {
			console.error(error);
			return { success: false, message: `Error retrieving vehicle glovebox inventory from database. See server console for details.` }; // Specific error
		});
});

mp.events.addProc('inventory:moveItemToPrimary', async (player, from, to, moveData, quantity) => {
	moveData = JSON.parse(moveData);
	console.log(`Moving item to primary: player=${player.rgscId}, from=${from}, to=${to}, identifier=${moveData.identifier}, quantity=${quantity}`);

	// Get the secondary inventory using the provided identifier
	let inventory = (await Inventories.findOne({ where: { identifier: moveData.identifier } })) as any;
	if (!inventory) {
		console.log(`Secondary inventory not found for identifier ${moveData.identifier}`);
		return { success: false, message: `Secondary inventory with identifier '${moveData.identifier}' not found in database.` }; // Specific error
	}

	// Find the item in the secondary inventory by its slot
	let item = inventory.inventory.items.find((i: any) => i.slot === from) || null;
	if (!item) {
		console.log(`No item found in slot ${from} in secondary inventory`);
		return { success: false, message: `No item found in slot ${from} of the secondary inventory.` }; // Specific error
	}

	// Ensure numeric values for amount and quantity
	item.amount = Number(item.amount);
	quantity = Number(quantity);

	if (item.amount < quantity) {
		console.log(`Not enough ${item.label} in slot ${from} in secondary inventory`);
		return {
			success: false,
			message: `Not enough '${item.label}' in slot ${from} of the secondary inventory. Available: ${item.amount}, Requested: ${quantity}.`
		}; // Specific error
	}

	// Get the item data and verify its existence
	let itemData = getItemByName(item.name);
	if (!itemData) {
		console.log(`Item ${item.name} does not exist`);
		return { success: false, message: `Registered item '${item.name}' does not exist.` }; // Specific error
	}

	// Get the player's current inventory
	let PlayerData = Core.GetPlayerData(player);

	// Look for the same item already in the player's inventory
	let itemInPrimary = PlayerData.inventory.items.find(
		(i: any) => i.name === item.name && JSON.stringify(i.metadata) === JSON.stringify(item.metadata)
	);

	// Check weight in primary inventory before moving
	let canCarry = PlayerData.inventory.weight + item.weight * quantity <= PlayerData.inventory.maxWeight;
	if (!canCarry) {
		Core.notify(player, 'error', 'Error', `You can't carry that much weight`, 5000);
		return {
			success: false,
			message: `You do not have enough space in your primary inventory to carry ${quantity}x ${item.label}.` // Specific error
		};
	}

	// Remove the quantity from the secondary inventory item
	item.amount -= quantity;
	if (item.amount <= 0) {
		inventory.inventory.items = inventory.inventory.items.filter((i: any) => i.slot !== from);
	}

	// Update player's inventory weight (adding weight, since item is moving in)
	PlayerData.inventory.weight += item.weight * quantity;

	// Add the item to the player's inventory: stack if possible, or add as new if not
	if (itemInPrimary && itemData.stackable) {
		itemInPrimary.amount += quantity;
	} else {
		let freeSlot = findFreeSlot(PlayerData.inventory.items);
		if (freeSlot === null) {
			return { success: false, message: `Your primary inventory is full. No free slots available.` }; // Specific error
		}
		PlayerData.inventory.items.push({ ...item, amount: quantity, slot: freeSlot });
	}

	// Update the secondary inventory in the database
	await Inventories.update({ inventory: inventory.inventory }, { where: { identifier: moveData.identifier } });
	console.log(`Item successfully moved to primary`);

	// Maintain the secondary inventory's meta data
	inventory.inventory.data = {
		type: 'vehicle',
		identifier: moveData.identifier
	};

	saveAccount(player); // Save account after inventory change
	return {
		success: true,
		message: `Item moved to primary inventory successfully.`, // Improved success message
		playerInventory: PlayerData.inventory,
		secondaryInventory: inventory.inventory
	};
});

mp.events.addProc('inventory:moveItemToSecondary', async (player, from, to, moveData, quantity) => {
	moveData = JSON.parse(moveData);
	console.log(`Moving item to secondary: player=${player.rgscId}, from=${from}, to=${to}, identifier=${moveData.identifier}, quantity=${quantity}`);
	let PlayerData = Core.GetPlayerData(player);
	let item = PlayerData.inventory.items.find((i: any) => i.slot === from) || null;
	if (!item) {
		console.log(`No item found in slot ${from}`);
		return { success: false, message: `No item found in slot ${from} of your primary inventory.` }; // Specific error
	}

	item.amount = Number(item.amount);
	quantity = Number(quantity);

	if (item.amount < quantity) {
		console.log(`Not enough ${item.label} in slot ${from}`);
		return {
			success: false,
			message: `Not enough '${item.label}' in slot ${from} of your primary inventory. Available: ${item.amount}, Requested: ${quantity}.`
		}; // Specific error
	}

	let itemData = getItemByName(item.name);
	if (!itemData) {
		console.log(`Item ${item.name} does not exist`);
		return { success: false, message: `Registered item '${item.name}' does not exist.` }; // Specific error
	}

	let inventory = (await Inventories.findOne({ where: { identifier: moveData.identifier } })) as any;
	if (!inventory) {
		console.log(`Secondary inventory not found for identifier ${moveData.identifier}`);
		return { success: false, message: `Secondary inventory with identifier '${moveData.identifier}' not found in database.` }; // Specific error
	}

	// Check weight in secondary inventory before moving
	let canCarry = inventory.inventory.weight + item.weight * quantity <= inventory.inventory.maxWeight;
	if (!canCarry) {
		Core.notify(player, 'error', 'Error', `Vehicle inventory is full`, 5000);
		return {
			success: false,
			message: `Secondary inventory (identifier: ${moveData.identifier}) does not have enough space to carry ${quantity}x ${item.label}.` // Specific error
		};
	}

	let itemInInv = inventory.inventory.items.find((i: any) => i.name === item.name && JSON.stringify(i.metadata) === JSON.stringify(item.metadata));

	item.amount -= quantity;
	PlayerData.inventory.weight -= item.weight * quantity;
	if (item.amount <= 0) {
		PlayerData.inventory.items = PlayerData.inventory.items.filter((i: any) => i.slot !== from);
	}

	if (itemInInv && itemData.stackable) {
		itemInInv.amount += quantity;
	} else {
		let freeSlot = findFreeSlot(inventory.inventory.items);
		if (freeSlot === null) {
			return { success: false, message: `Secondary inventory (identifier: ${moveData.identifier}) is full. No free slots available.` }; // Specific error
		}
		inventory.inventory.items.push({ ...item, amount: quantity, slot: freeSlot });
	}

	await Inventories.update({ inventory: inventory.inventory }, { where: { identifier: moveData.identifier } });
	console.log(`Item successfully moved to secondary`);
	inventory.inventory.data = {
		type: 'vehicle',
		identifier: moveData.identifier
	};

	saveAccount(player); // Save account after inventory change
	return {
		success: true,
		message: `Item moved to secondary inventory successfully.`,
		playerInventory: PlayerData.inventory,
		secondaryInventory: inventory.inventory
	}; // Improved success message
});

function findFreeSlot(items: any) {
	let usedSlots = items.map((i: any) => i.slot);
	for (let i = 1; i <= 100; i++) {
		// Assuming max 100 slots, adjust if needed
		if (!usedSlots.includes(i)) return i;
	}
	return null;
}

//mp.events.callRemote('admin:giveItem', playerId, itemName, amount);

mp.events.add('admin:giveItem', (player: PlayerMp, playerId: any, itemName: string, amount: number) => {
	let targetPlayer = Object.values(Core.players).find((p: any) => p.id === parseInt(playerId)) || null;
	if (!targetPlayer) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
		return { success: false, message: `Player with ID '${playerId}' not found in server players data.` }; // Specific error
	}

	let targetMp = mp.players.toArray().find((p) => p.rgscId === targetPlayer.rgscId);
	if (!targetMp) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
		return { success: false, message: `Player with ID '${playerId}' is not currently online.` }; // Specific error
	}

	chat.sendToAdmins(`^1[INV]^0 ${player.name} has given ${amount}x${itemName} to ${targetMp.name}`);

	let result: any;
	addItem(targetMp, itemName, amount, [], (data: any) => {
		result = data;
		if (data.success) {
			saveAccount(targetMp); // Save target player's account after inventory change
		}
	});
	return result;
});

mp.events.add('admin:removeItem', (player: PlayerMp, playerId: any, itemName: string, amount: number) => {
	let targetPlayer = Object.values(Core.players).find((p: any) => p.id === parseInt(playerId)) || null;
	if (!targetPlayer) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
		return { success: false, message: `Player with ID '${playerId}' not found in server players data.` }; // Specific error
	}

	let targetMp = mp.players.toArray().find((p) => p.rgscId === targetPlayer.rgscId);
	if (!targetMp) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
		return { success: false, message: `Player with ID '${playerId}' is not currently online.` }; // Specific error
	}

	chat.sendToAdmins(`^1[INV]^0 ${player.name} has removed ${amount}x${itemName} from ${targetMp.name}`);

	let result: any;
	removeItem(targetMp, itemName, amount, [], (data: any) => {
		result = data;
		if (data.success) {
			saveAccount(targetMp); // Save target player's account after inventory change
		}
	});
	return result;
});

mp.events.add('admin:setMoney', (player: PlayerMp, playerId: any, moneyType: string, amount: number) => {
	let targetPlayer = Object.values(Core.players).find((p: any) => p.id === parseInt(playerId)) || null;
	if (!targetPlayer) {
		return { success: false, message: `Player with ID '${playerId}' not found in server players data.` }; // Specific error
	}

	if (moneyType === 'cash') {
		targetPlayer.cash = amount;
	} else if (moneyType === 'bank') {
		targetPlayer.bank = amount;
	} else {
		return { success: false, message: `Invalid money type '${moneyType}'. Must be 'cash' or 'bank'.` }; // Specific error
	}

	chat.sendToAdmins(`^1[INV]^0 ${player.name} has set ${moneyType} to $${Core.formatNumber(amount)} for ${targetPlayer.name}`);

	return { success: true, message: `Set ${moneyType} to ${amount} for player ${targetPlayer.name}.` }; // Improved success message
});

mp.events.add('admin:giveMoney', (player: PlayerMp, playerId: any, moneyType: string, amount: string) => {
	let targetPlayer = Object.values(Core.players).find((p: any) => p.id === parseInt(playerId)) || null;
	if (!targetPlayer) {
		return { success: false, message: `Player with ID '${playerId}' not found in server players data.` }; // Specific error
	}

	if (moneyType === 'cash') {
		targetPlayer.cash = parseInt(targetPlayer.cash) + parseInt(amount);
	} else if (moneyType === 'bank') {
		targetPlayer.bank = parseInt(targetPlayer.bank) + parseInt(amount);
	} else {
		return { success: false, message: `Invalid money type '${moneyType}'. Must be 'cash' or 'bank'.` }; // Specific error
	}

	chat.sendToAdmins(`^1[INV]^0 ${player.name} has given $${Core.formatNumber(parseInt(amount))} ${moneyType} to ${targetPlayer.name}`);

	return { success: true, message: `Gave $${Core.formatNumber(parseInt(amount))} ${moneyType} to player ${targetPlayer.name}.` }; // Improved success message
});

mp.events.addProc('inventory:giveItemToPlayer', (player: PlayerMp, slot: any, playerId: any, quantity: any) => {
	playerId = parseInt(playerId);
	slot = parseInt(slot);
	quantity = parseInt(quantity);
	let targetPlayer = Object.values(Core.players).find((p: any) => p.id === parseInt(playerId)) || null;
	if (!targetPlayer) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
		return { success: false, message: `Player with ID '${playerId}' not found in server players data.` }; // Specific error
	}

	let targetMp = mp.players.toArray().find((p) => p.rgscId === targetPlayer.license);
	if (!targetMp) {
		Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
		return { success: false, message: `Player with ID '${playerId}' is not currently online.` }; // Specific error
	}

	let PlayerData = Core.GetPlayerData(player);

	//check if dropped item is a weapon, and if so, check if player has the weapon equipped, and if so, unequip it and remove it from the player

	let item = PlayerData.inventory.items.find((i: InventoryItem) => i.slot === slot) || null;

	if (!item) {
		Core.notify(player, 'error', 'Error', `No item found in slot ${slot}`, 5000);
		return { success: false, message: `No item found in slot ${slot} of your inventory.` }; // Specific error
	}
	let itemData = getItemByName(item.name);
	if (!itemData) {
		Core.notify(player, 'error', 'Error', `Item ${item.name} does not exist`, 5000);
		return { success: false, message: `Registered item '${item.name}' does not exist.` }; // Specific error
	}

	//can target carry?
	let targetPlayerData = Core.GetPlayerData(targetMp);
	let canCarry = targetPlayerData.inventory.weight + item.weight * quantity <= targetPlayerData.inventory.maxWeight;
	if (!canCarry) {
		Core.notify(player, 'error', 'Error', `Player ${targetMp.name} can't carry that much weight`, 5000);
		return {
			success: false,
			message: `Player ${targetMp.name} does not have enough space in their inventory to carry ${quantity}x ${item.label}.`
		}; // Specific error
	}

	if (!itemData.canBeGiven) {
		Core.notify(player, 'error', 'Error', `Item ${item.name} cannot be given`, 5000);
		return { success: false, message: `'${item.label}' cannot be given to other players. Check item properties.` }; // Specific error
	}

	let result: any;
	let ammo = 0;
	if (isWeapon(item.name)) {
		let weapon = PlayerData.weapons.find((w: any) => w.name === item.name) || null;
		if (weapon.equipped) {
			ammo = weapon.ammo;
			PlayerData.weapons = PlayerData.weapons.filter((w: any) => w.name !== item.name);
			Account.update({ weapons: PlayerData.weapons }, { where: { license: player.rgscId } });
			player.call('corefx:unequipWeapon', [item.name]);
		}

		removeItemFromSlot(player, slot, quantity, (removeData: any) => {
			result = removeData;
			if (removeData.success) {
				saveAccount(player); // Save sender player's account after inventory change
				addItem(targetMp, item.name, quantity, item.metadata, (data: any) => {
					result = data;
					if (data.success) {
						saveAccount(targetMp); // Save target player's account after inventory change
						//add the weapon (by weapon type)
						addItem(targetMp, `${weapon.type}_ammo`, ammo, [], (data: any) => {
							result = data;
							if (data.success) {
								saveAccount(targetMp); // Save target player's account after inventory change
							}
						});
					}
				});
			}
		});
	} else {
		removeItemFromSlot(player, slot, quantity, (removeData: any) => {
			result = removeData;
			if (removeData.success) {
				saveAccount(player); // Save sender player's account after inventory change
				addItem(targetMp, item.name, quantity, item.metadata, (data: any) => {
					result = data;
					if (data.success) {
						saveAccount(targetMp); // Save target player's account after inventory change
					}
				});
			}
		});
	}

	return result;
});

async function saveAccount(player: PlayerMp) {
	if (!player || !player.rgscId || !Core.players[player.rgscId]) return;

	const accountData = Core.players[player.rgscId];
	accountData.position = player.position;
	accountData.heading = player.heading;
	const inventoryData = accountData.inventory; // Get inventory data

	console.log(`[AutoSave] Saving progress for ${player.name}...`);

	try {
		await Account.update(accountData, { where: { license: player.rgscId } });
		console.log(`[AutoSave] Account progress saved for ${player.name}.`);

		await Inventories.update({ inventory: inventoryData }, { where: { identifier: player.rgscId } }); // Save inventory
		console.log(`[AutoSave] Inventory saved for ${player.name}.`);
	} catch (error) {
		console.error(`[AutoSave] Error saving data for ${player.name}:`, error);
	}

	let isOnline = mp.players.toArray().find((p) => p.rgscId === player.rgscId);
	if (!isOnline) {
		console.log(`[AutoSave] ${player.name} is offline. Removing from Core.players.`);
		delete Core.players[player.rgscId];
	} else {
		//sync data
		player.call('corefx:updateData', [accountData]);
	}
}

function handleWeapon(player: PlayerMp, weaponName: string, weaponLabel: string, ammo: number, type: string) {
	let Player = Core.GetPlayerData(player);

	if (!Player.weapons) {
		// Dacă jucătorul nu are un array de arme, îl inițializăm și echipăm arma
		Player.weapons = [
			{
				name: weaponName,
				label: weaponLabel,
				equipped: true,
				type: type,
				ammo: ammo
			}
		];
		player.call('corefx:equipWeapon', [weaponName, ammo, weaponLabel]);
	} else {
		let currentWeapon = Player.weapons.find((w: any) => w.equipped);
		let weaponData = Player.weapons.find((w: any) => w.name === weaponName);

		if (currentWeapon && currentWeapon.name !== weaponName) {
			// Dacă are o armă echipată și e alta decât cea curentă, o înlocuim
			currentWeapon.equipped = false;
			let newAmmo = weaponData ? weaponData.ammo : 0;
			if (weaponData) {
				weaponData.equipped = true;
			} else {
				Player.weapons.push({
					name: weaponName,
					label: weaponLabel,
					equipped: true,
					type: type,
					ammo: ammo
				});
			}
			//unequip old one
			player.call('corefx:unequipWeapon', [currentWeapon.name]);

			player.call('corefx:equipWeapon', [weaponName, newAmmo || 0, weaponLabel]);
		} else if (weaponData && !weaponData.equipped) {
			// Dacă arma există, dar nu e echipată, o echipăm
			weaponData.equipped = true;
			player.call('corefx:equipWeapon', [weaponName, weaponData.ammo || 0, weaponLabel]);
		} else if (weaponData && weaponData.equipped) {
			// Dacă arma e deja echipată, o dezechipăm
			weaponData.equipped = false;
			player.call('corefx:unequipWeapon', [weaponName]);
		} else if (!weaponData) {
			// Dacă arma nu există, o adăugăm și o echipăm
			Player.weapons.push({
				name: weaponName,
				label: weaponLabel,
				equipped: true,
				type: type,
				ammo: ammo
			});
			player.call('corefx:equipWeapon', [weaponName, ammo, weaponLabel]);
		}
	}

	// Salvăm modificările în baza de date și sincronizăm datele
	Account.update({ weapons: Player.weapons }, { where: { license: player.rgscId } });
	player.call('corefx:syncData', [Player]);
}

registerItem(
	'weapon_assaultrifle',
	'Assault Rifle',
	'Un rifle de asalt',
	0.5,
	false,
	true,
	true,
	true,
	true,
	false,
	false,
	(player: PlayerMp, amount: number) => {
		handleWeapon(player, 'weapon_assaultrifle', 'Assault Rifle', amount, 'rifle');
	}
);

//corefx:updateWeaponAmmoToEquiped
mp.events.add('corefx:updateWeaponAmmoToEquiped', (player: PlayerMp, ammo: number) => {
	let Player = Core.GetPlayerData(player);
	let weaponData = Player.weapons.find((w: any) => w.equipped);
	if (weaponData) {
		weaponData.ammo = ammo;
		Account.update({ weapons: Player.weapons }, { where: { license: player.rgscId } });
	}
});

//corefx:updateWeaponAmmo
mp.events.add('corefx:updateWeaponAmmo', (player: PlayerMp, weaponName: string, ammo: number) => {
	let Player = Core.GetPlayerData(player);
	let weaponData = Player.weapons.find((w: any) => w.name === weaponName);
	if (weaponData) {
		weaponData.ammo = ammo;
		Account.update({ weapons: Player.weapons }, { where: { license: player.rgscId } });
	}
});

//rifle_ammo (check if current ammo has rifle type)
registerItem('rifle_ammo', 'Rifle Ammo', 'Muniție pentru puști', 0.01, true, true, true, true, true, true, true, (player: PlayerMp, amount: any) => {
	console.log(`Adding rifle ammo to player ${player.name}: ${amount}`);
	let Player = Core.GetPlayerData(player);
	let weaponData = Player.weapons.find((w: any) => w.equipped && w.type === 'rifle');
	console.log(weaponData);
	if (weaponData) {
		weaponData.ammo = weaponData.ammo + parseInt(amount);
		removeItem(player, 'rifle_ammo', amount, [], () => {
			player.call('corefx:updateWeaponAmmo', [weaponData.name, weaponData.ammo]);
		});
	} else {
		Core.notify(player, 'error', 'Error', `You don't have a rifle equipped`, 5000);
	}
});

registerItem(
	'pistol_ammo',
	'Pistol Ammo',
	'Muniție pentru pistoale',
	0.01,
	true,
	true,
	true,
	true,
	true,
	true,
	true,
	(player: PlayerMp, amount: any) => {
		console.log(`Adding rifle ammo to player ${player.name}: ${amount}`);
		let Player = Core.GetPlayerData(player);
		let weaponData = Player.weapons.find((w: any) => w.equipped && w.type === 'pistol');
		console.log(weaponData);
		if (weaponData) {
			weaponData.ammo = weaponData.ammo + parseInt(amount);
			removeItem(player, 'pistol_ammo', amount, [], () => {
				player.call('corefx:updateWeaponAmmo', [weaponData.name, weaponData.ammo]);
			});
		} else {
			Core.notify(player, 'error', 'Error', `You don't have a pistol equipped`, 5000);
		}
	}
);

registerItem(
	'weapon_gadgetpistol',
	'Gadget Pistol',
	'Gadget Pistol',
	0.5,
	false,
	true,
	true,
	true,
	true,
	false,
	false,
	(player: PlayerMp, amount: number) => {
		handleWeapon(player, 'weapon_gadgetpistol', 'Gadget Pistol', amount, 'pistol');
	}
);

registerItem(
	'weapon_pumpshotgun',
	'Pump Shotgun',
	'Pump Shotgun',
	0.5,
	false,
	true,
	true,
	true,
	true,
	false,
	false,
	(player: PlayerMp, amount: number) => {
		handleWeapon(player, 'weapon_pumpshotgun', 'Pump Shotgun', amount, 'shotgun');
	}
);
