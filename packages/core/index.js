'use strict';

var path = require('path');
var dotenv = require('dotenv');
var sequelize$1 = require('sequelize');
var fs = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

dotenv.config({
    path: path__default["default"].resolve('.env')
});

// Define ASCII colors for logging
const ascii_colors = {
    black: '\u001b[30m',
    red: '\u001b[31m',
    green: '\u001b[32m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    magenta: '\u001b[35m',
    cyan: '\u001b[36m',
    white: '\u001b[37m',
    reset: '\u001b[0m'
};
// Initialize Sequelize with MySQL connection
const sequelize = new sequelize$1.Sequelize({
    dialect: 'mysql',
    host: 'localhost',
    database: 'reversy',
    username: 'root',
    password: '',
    pool: {
        max: 10,
        min: 0,
        acquire: 10000,
        idle: 10000
    },
    logging: false // Set to true or a function for SQL logging
});
// Test the connection and log the result
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log(`${ascii_colors.green}Connected to the database via Sequelize.${ascii_colors.reset}`);
    } catch (error) {
        console.error(`${ascii_colors.red}Error connecting to the database:${ascii_colors.reset}`, error);
    }
}
testConnection();
// Define the Account model
let Account = class Account extends sequelize$1.Model {
};
Account.init({
    id: {
        type: sequelize$1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false
    },
    license: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    cash: {
        type: sequelize$1.DataTypes.INTEGER,
        defaultValue: 0
    },
    bank: {
        type: sequelize$1.DataTypes.INTEGER,
        defaultValue: 0
    },
    position: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    inventory: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    character: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    licenses: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    faction: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    weapons: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    created_at: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW
    },
    updated_at: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW,
        onUpdate: 'CURRENT_TIMESTAMP'
    },
    last_login: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW
    },
    dead: {
        type: sequelize$1.DataTypes.BOOLEAN,
        defaultValue: false
    },
    deadTime: {
        type: sequelize$1.DataTypes.INTEGER,
        defaultValue: 300
    },
    admin: {
        type: sequelize$1.DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    sequelize,
    tableName: 'accounts',
    timestamps: false // Disable if you handle timestamps manually
});
// Synchronize the model with the database
(async ()=>{
    await Account.sync({
        force: false
    }); // Set force: true to drop and recreate
})();
//sequelize to create inventories table, with id, identifier, inventory(json(slots, weight, maxWeight, items))
// Define the Inventory model
let Inventories = class Inventories extends sequelize$1.Model {
};
Inventories.init({
    id: {
        type: sequelize$1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    identifier: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    inventory: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'inventories',
    timestamps: false // Disable if you handle timestamps manually
});
// Synchronize the model with the database
(async ()=>{
    await Inventories.sync({
        force: false
    }); // Set force: true to drop and recreate
})();
let VehicleShops = class VehicleShops extends sequelize$1.Model {
};
VehicleShops.init({
    id: {
        type: sequelize$1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false
    },
    blip: {
        type: sequelize$1.DataTypes.INTEGER,
        allowNull: false
    },
    blipColor: {
        type: sequelize$1.DataTypes.INTEGER,
        allowNull: false
    },
    ped_pos: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    veh_pos: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    vehicles: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    testing_spots: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    created_at: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW
    },
    updated_at: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW,
        onUpdate: 'CURRENT_TIMESTAMP'
    }
}, {
    sequelize,
    tableName: 'vehicle_shops',
    timestamps: false // Disable if you handle timestamps manually
});
// Synchronize the model with the database
(async ()=>{
    await VehicleShops.sync({
        force: false
    }); // Set force: true to drop and recreate
})();
// Define the Vehicle model
let Vehicles = class Vehicles extends sequelize$1.Model {
};
Vehicles.init({
    id: {
        type: sequelize$1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    model: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false
    },
    label: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false
    },
    plate: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false
    },
    owner: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false
    },
    mods: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    position: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    created_at: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW
    },
    updated_at: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW,
        onUpdate: 'CURRENT_TIMESTAMP'
    }
}, {
    sequelize,
    tableName: 'owned_vehicles',
    timestamps: false // Disable if you handle timestamps manually
});
let Blips = class Blips extends sequelize$1.Model {
};
Blips.init({
    id: {
        type: sequelize$1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: sequelize$1.DataTypes.STRING,
        allowNull: false
    },
    color: {
        type: sequelize$1.DataTypes.INTEGER,
        allowNull: false
    },
    position: {
        type: sequelize$1.DataTypes.JSON,
        allowNull: false
    },
    sprite: {
        type: sequelize$1.DataTypes.INTEGER,
        allowNull: false
    },
    scale: {
        type: sequelize$1.DataTypes.FLOAT,
        allowNull: false
    },
    shortRange: {
        type: sequelize$1.DataTypes.BOOLEAN,
        allowNull: false
    },
    dimension: {
        type: sequelize$1.DataTypes.INTEGER,
        allowNull: false
    },
    created_at: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW
    },
    updated_at: {
        type: sequelize$1.DataTypes.DATE,
        defaultValue: sequelize$1.DataTypes.NOW,
        onUpdate: 'CURRENT_TIMESTAMP'
    }
}, {
    sequelize,
    tableName: 'blips',
    timestamps: false // Disable if you handle timestamps manually
});
(async ()=>{
    await Blips.sync({
        force: false
    });
})();
// Synchronize the model with the database
(async ()=>{
    await Vehicles.sync({
        force: false
    }); // Set force: true to drop and recreate
})();

let registeredItems = {
};
function isWeapon(itemName) {
    return itemName.startsWith('weapon_');
}
function isAmmo(itemName) {
    return itemName.endsWith('_ammo');
}
function registerItem(itemName, label, description, weight, stackable, usable, canBeDropped, canBeGiven, canBeUsed, canBeStacked, canBeRemoved, use) {
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
function getItemByName(name) {
    return registeredItems[name] || null;
}
// Helper: deep compare metadata arrays
function compareMetadata(a, b) {
    if (a.length !== b.length) return false;
    for(let i = 0; i < a.length; i++){
        if (a[i] !== b[i]) return false;
    }
    return true;
}
// Helper: find first free slot in the inventory
function getFreeSlot(player) {
    let PlayerData = Core.GetPlayerData(player);
    const totalSlots = PlayerData.inventory.slots;
    const usedSlots = PlayerData.inventory.items.map((item)=>item.slot
    );
    for(let i = 1; i <= totalSlots; i++){
        if (!usedSlots.includes(i)) {
            return i;
        }
    }
    return null;
}
function addItem(player, itemName, amount, metadata, cb) {
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
        const existingItems = PlayerData.inventory.items.filter((invItem)=>invItem.name === item.name
        );
        const matchingItem = existingItems.find((invItem)=>compareMetadata(invItem.metadata, metadata)
        );
        if (matchingItem) {
            matchingItem.amount += amount;
            PlayerData.inventory.weight += item.weight * amount;
            Core.notify(player, 'success', 'Success', `You have received ${amount}x${item.label}`, 5000);
            cb({
                success: true,
                message: `Successfully added ${amount}x ${item.label} to existing stack.`
            });
            chat.sendToAdmins(`^1[INV]^0 ${player.name} has received ${amount}x${item.label}`);
            saveAccount$1(player); // Save account after inventory change
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
    saveAccount$1(player); // Save account after inventory change
}
function removeItem(player, itemName, amount, metadata, cb, forced = false) {
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
    let itemInInventory = PlayerData.inventory.items.find((i)=>i.name === item.name && compareMetadata(i.metadata, metadata)
    ) || null;
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
        PlayerData.inventory.items = PlayerData.inventory.items.filter((i)=>i.slot !== itemInInventory.slot
        );
    }
    Core.notify(player, 'success', 'Success', `You have lost ${amount}x${item.label}`, 5000);
    cb({
        success: true,
        message: `Successfully removed ${amount}x ${item.label} from your inventory.`
    });
    chat.sendToAdmins(`^1[INV]^0 ${player.name} has lost ${amount}x${item.label}`);
    saveAccount$1(player); // Save account after inventory change
}
function getPlayerItems(player, cb) {
    let PlayerData = Core.GetPlayerData(player);
    cb({
        success: true,
        items: PlayerData.inventory.items
    });
}
function useItem(player, itemName, amount = 1, cb) {
    console.log(`Using item ${itemName} with amount ${amount}`);
    let PlayerData = Core.GetPlayerData(player);
    let item = PlayerData.inventory.items.find((i)=>i.name === itemName
    ) || null;
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
            removeItem(player, itemName, amount, item.metadata, (removeData)=>{
                if (removeData.success) {
                    itemData.use(player, amount);
                    cb({
                        success: true,
                        message: `Successfully used ${amount}x ${item.label} and removed from inventory.`
                    });
                    saveAccount$1(player); // Save account after inventory change
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
            saveAccount$1(player); // Save account after inventory change
        }
    } else {
        itemData.use(player, amount);
        cb({
            success: true,
            message: `Successfully used ${amount}x ${item.label}.`
        });
        saveAccount$1(player); // Save account after inventory change
    }
}
// New function: remove item from a specific slot
function removeItemFromSlot(player, slot, amount, cb) {
    let PlayerData = Core.GetPlayerData(player);
    let itemInSlot = PlayerData.inventory.items.find((i)=>i.slot === slot
    );
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
        PlayerData.inventory.items = PlayerData.inventory.items.filter((i)=>i.slot !== slot
        );
    }
    Core.notify(player, 'success', 'Success', `You have removed ${amount}x${itemInSlot.label} from slot ${slot}`, 5000);
    cb({
        success: true,
        message: `Successfully removed ${amount}x ${itemInSlot.label} from slot ${slot}.`
    });
    chat.sendToAdmins(`^1[INV]^0 ${player.name} removed ${amount}x${itemInSlot.label} from slot ${slot}`);
    saveAccount$1(player); // Save account after inventory change
}
registerItem('water_bottle', 'Sticla de apa', 'O sticla de apa', 0.5, true, true, true, true, true, true, true, (player, amount)=>{
    Core.notify(player, 'success', 'Success', `You have used ${amount}x water`, 5000);
});
registerItem('apple', 'Mar', 'Un mar', 0.5, true, true, true, true, true, true, true, (player, amount)=>{
    Core.notify(player, 'success', 'Success', `You have used ${amount}x food`, 5000);
});
// Transforming events to procedures (procs):
mp.events.addProc('inventory:addItem', (player, itemName, amount, metadata)=>{
    let result;
    addItem(player, itemName, amount, metadata, (data)=>{
        result = data;
    });
    return result;
});
mp.events.addProc('inventory:useItem', (player, slot, amount)=>{
    // Modified to accept slot
    let PlayerData = Core.GetPlayerData(player);
    let itemDataInInventory = PlayerData.inventory.items.find((i)=>i.slot === slot
    ) || null; // Find by slot
    if (!itemDataInInventory) {
        return {
            success: false,
            message: `No item found in slot ${slot} in your inventory.`
        }; // Specific error
    }
    let result;
    useItem(player, itemDataInInventory.name, amount, (data)=>{
        // Use item name from inventory
        result = data;
        if (data.success && itemDataInInventory) {
            // Use the metadata from the found item when removing it
            return result;
        }
    });
    return result;
});
mp.events.addProc('inventory:removeItem', (player, itemName, amount, metadata)=>{
    let result;
    removeItem(player, itemName, amount, metadata, (data)=>{
        result = data;
    });
    return result;
});
mp.events.addProc('inventory:giveItem', (player, playerId, itemName, amount, metadata)=>{
    let targetPlayer = Object.values(Core.players).find((p)=>p.id === playerId
    ) || null;
    if (!targetPlayer) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' not found in server players data.`
        };
    }
    let targetMp = mp.players.toArray().find((p)=>p.rgscId === targetPlayer.rgscId
    );
    if (!targetMp) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' is not currently online.`
        };
    }
    let result;
    addItem(targetMp, itemName, amount, metadata, (data)=>{
        result = data;
        if (data.success) {
            saveAccount$1(targetMp); // Save target player's account after inventory change
        }
    });
    return result;
});
mp.events.addProc('inventory:getPlayerInventory', (player)=>{
    return Core.players[player.rgscId].inventory;
});
mp.events.addProc('inventory:getPlayerItems', (player)=>{
    let result;
    getPlayerItems(player, (data)=>{
        result = data;
    });
    return result;
});
mp.events.addProc('inventory:getPlayerItemsById', (player, playerId)=>{
    let targetPlayer = Object.values(Core.players).find((p)=>p.id === playerId
    ) || null;
    if (!targetPlayer) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' not found in server players data.`
        };
    }
    let targetMp = mp.players.toArray().find((p)=>p.rgscId === targetPlayer.rgscId
    );
    if (!targetMp) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' is not currently online.`
        };
    }
    let result;
    getPlayerItems(targetMp, (data)=>{
        result = data;
    });
    return result;
});
mp.events.addProc('inventory:removeItemFromPlayer', (player, playerId, itemName, amount, metadata)=>{
    let targetPlayer = Object.values(Core.players).find((p)=>p.id === playerId
    ) || null;
    if (!targetPlayer) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' not found in server players data.`
        };
    }
    let targetMp = mp.players.toArray().find((p)=>p.rgscId === targetPlayer.rgscId
    );
    if (!targetMp) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' is not currently online.`
        };
    }
    let result;
    removeItem(targetMp, itemName, amount, metadata, (data)=>{
        result = data;
        if (data.success) {
            saveAccount$1(targetMp); // Save target player's account after inventory change
        }
    });
    return result;
});
mp.events.addProc('inventory:removeItemFromSlot', (player, slot, amount)=>{
    let result;
    removeItemFromSlot(player, slot, amount, (data)=>{
        result = data;
    });
    return result;
});
let drops = [];
const dropsProxy = new Proxy(drops, {
    set (target, property, value) {
        console.log(`Drop at index ${property} has been set to`, value);
        target[property] = value;
        let players = mp.players.toArray();
        players.forEach((player)=>{
            player.call('inventory:updateDrops', [
                target,
                drops
            ]);
        });
        return true;
    },
    deleteProperty (target, property) {
        console.log(`Drop at index ${property} has been deleted`);
        delete target[property];
        let players = mp.players.toArray();
        players.forEach((player)=>{
            player.call('inventory:updateDrops', [
                target,
                drops
            ]);
        });
        return true;
    }
});
drops = dropsProxy;
function dropItem(player, itemName, amount, cb) {
    let PlayerData = Core.GetPlayerData(player);
    let item = PlayerData.inventory.items.find((i)=>i.name === itemName
    ) || null;
    if (!item) {
        Core.notify(player, 'error', 'Error', `Item ${itemName} does not exist in your inventory`, 5000);
        cb({
            success: false,
            message: `Item '${itemName}' not found in your inventory.`
        });
        return;
    }
    let itmData = getItemByName(itemName);
    if (!(itmData === null || itmData === void 0 ? void 0 : itmData.canBeDropped)) {
        Core.notify(player, 'error', 'Error', `Item ${itemName} cannot be dropped`, 5000);
        cb({
            success: false,
            message: `'${itemName}' cannot be dropped. Check item properties.`
        });
        return;
    }
    removeItem(player, itemName, amount, item.metadata, (data)=>{
        if (data.success) {
            // Find drop by distance between player and other drops
            let drop = drops.find((d)=>player.dist(d.position) < 2
            ) || null;
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
                saveAccount$1(player); // Save account after inventory change
                return;
            } else {
                let itemInDrop = drop.items.find((i)=>i.name === item.name && compareMetadata(i.metadata, item.metadata)
                ) || null;
                if (itemInDrop) {
                    itemInDrop.amount += amount;
                    Core.notify(player, 'success', 'Success', `You have dropped ${amount}x${item.label}`, 5000);
                    cb({
                        success: true,
                        message: `Successfully dropped ${amount}x ${item.label}. Added to existing drop.`
                    });
                    chat.sendToAdmins(`^1[INV]^0 ${player.name} has dropped ${amount}x${item.label}`);
                    saveAccount$1(player); // Save account after inventory change
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
                    saveAccount$1(player); // Save account after inventory change
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
function getDrops(_player, cb) {
    cb({
        success: true,
        drops
    });
}
function getClosestDrop(player, cb) {
    let closestDrop = drops.find((d)=>player.dist(d.position) < 2
    ) || null;
    cb({
        success: true,
        drop: closestDrop
    });
}
mp.events.addProc('inventory:dropItem', (player, slot, amount)=>{
    // Modified to accept slot
    let PlayerData = Core.GetPlayerData(player);
    let itemInSlot = PlayerData.inventory.items.find((i)=>i.slot === slot
    ) || null;
    if (!itemInSlot) {
        return {
            success: false,
            message: `No item found in slot ${slot} in your inventory.`
        }; // Specific error
    }
    let result;
    dropItem(player, itemInSlot.name, amount, (data)=>{
        // Use item name from slot
        result = data;
    });
    return result;
});
mp.events.addProc('inventory:getDrops', (player)=>{
    let result;
    getDrops(player, (data)=>{
        result = data;
    });
    return result;
});
mp.events.addProc('inventory:getClosestDrop', (player)=>{
    let result;
    getClosestDrop(player, (data)=>{
        result = data;
    });
    return result;
});
function moveItem(player, from, to, cb) {
    let PlayerData = Core.GetPlayerData(player);
    let item = PlayerData.inventory.items.find((i)=>i.slot === from
    ) || null;
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
    let itemInSlot = PlayerData.inventory.items.find((i)=>i.slot === to
    ) || null;
    if (itemInSlot) {
        itemInSlot.slot = from;
    }
    item.slot = to;
    cb({
        success: true,
        message: `Successfully moved item from slot ${from} to slot ${to}.`
    });
    saveAccount$1(player); // Save account after inventory change
}
mp.events.addProc(`inventory:moveItem`, (player, from, to)=>{
    moveItem(player, from, to, (_data)=>{
    });
    return Core.players[player.rgscId].inventory;
});
//@sequelize
mp.events.addProc('getClosestVehicleInventory', (player)=>{
    let closestVehicle = mp.vehicles.toArray().find((v)=>player.dist(v.position) < 4
    ) || null;
    if (!closestVehicle) {
        return {
            success: false,
            message: `No vehicle found within a 4 meter radius.`
        };
    }
    let plate = closestVehicle.numberPlate.replace(/\s/g, '');
    return Inventories.findOne({
        where: {
            identifier: plate
        }
    }).then((vehicleInventory)=>{
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
            }).then(()=>{
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
    }).catch((error)=>{
        console.error(error);
        return {
            success: false,
            message: `Error retrieving vehicle inventory from database. See server console for details.`
        }; // Specific error
    });
});
mp.events.addProc('getVehicleInventory', (player, plate)=>{
    let closestVehicle = mp.vehicles.toArray().find((v)=>player.dist(v.position) < 2 && v.numberPlate.replace(/\s/g, '') === plate
    ) || null;
    if (!closestVehicle) {
        return {
            success: false,
            message: `No vehicle found within a 2 meter radius with plate: ${plate}.`
        }; // Specific error
    }
    plate = `${plate}-glovebox`;
    return Inventories.findOne({
        where: {
            identifier: plate
        }
    }).then((vehicleInventory)=>{
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
            }).then(()=>{
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
    }).catch((error)=>{
        console.error(error);
        return {
            success: false,
            message: `Error retrieving vehicle glovebox inventory from database. See server console for details.`
        }; // Specific error
    });
});
mp.events.addProc('inventory:moveItemToPrimary', async (player, from, to, moveData, quantity)=>{
    moveData = JSON.parse(moveData);
    console.log(`Moving item to primary: player=${player.rgscId}, from=${from}, to=${to}, identifier=${moveData.identifier}, quantity=${quantity}`);
    // Get the secondary inventory using the provided identifier
    let inventory = await Inventories.findOne({
        where: {
            identifier: moveData.identifier
        }
    });
    if (!inventory) {
        console.log(`Secondary inventory not found for identifier ${moveData.identifier}`);
        return {
            success: false,
            message: `Secondary inventory with identifier '${moveData.identifier}' not found in database.`
        }; // Specific error
    }
    // Find the item in the secondary inventory by its slot
    let item = inventory.inventory.items.find((i)=>i.slot === from
    ) || null;
    if (!item) {
        console.log(`No item found in slot ${from} in secondary inventory`);
        return {
            success: false,
            message: `No item found in slot ${from} of the secondary inventory.`
        }; // Specific error
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
        return {
            success: false,
            message: `Registered item '${item.name}' does not exist.`
        }; // Specific error
    }
    // Get the player's current inventory
    let PlayerData = Core.GetPlayerData(player);
    // Look for the same item already in the player's inventory
    let itemInPrimary = PlayerData.inventory.items.find((i)=>i.name === item.name && JSON.stringify(i.metadata) === JSON.stringify(item.metadata)
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
        inventory.inventory.items = inventory.inventory.items.filter((i)=>i.slot !== from
        );
    }
    // Update player's inventory weight (adding weight, since item is moving in)
    PlayerData.inventory.weight += item.weight * quantity;
    // Add the item to the player's inventory: stack if possible, or add as new if not
    if (itemInPrimary && itemData.stackable) {
        itemInPrimary.amount += quantity;
    } else {
        let freeSlot = findFreeSlot(PlayerData.inventory.items);
        if (freeSlot === null) {
            return {
                success: false,
                message: `Your primary inventory is full. No free slots available.`
            }; // Specific error
        }
        PlayerData.inventory.items.push({
            ...item,
            amount: quantity,
            slot: freeSlot
        });
    }
    // Update the secondary inventory in the database
    await Inventories.update({
        inventory: inventory.inventory
    }, {
        where: {
            identifier: moveData.identifier
        }
    });
    console.log(`Item successfully moved to primary`);
    // Maintain the secondary inventory's meta data
    inventory.inventory.data = {
        type: 'vehicle',
        identifier: moveData.identifier
    };
    saveAccount$1(player); // Save account after inventory change
    return {
        success: true,
        message: `Item moved to primary inventory successfully.`,
        playerInventory: PlayerData.inventory,
        secondaryInventory: inventory.inventory
    };
});
mp.events.addProc('inventory:moveItemToSecondary', async (player, from, to, moveData, quantity)=>{
    moveData = JSON.parse(moveData);
    console.log(`Moving item to secondary: player=${player.rgscId}, from=${from}, to=${to}, identifier=${moveData.identifier}, quantity=${quantity}`);
    let PlayerData = Core.GetPlayerData(player);
    let item = PlayerData.inventory.items.find((i)=>i.slot === from
    ) || null;
    if (!item) {
        console.log(`No item found in slot ${from}`);
        return {
            success: false,
            message: `No item found in slot ${from} of your primary inventory.`
        }; // Specific error
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
        return {
            success: false,
            message: `Registered item '${item.name}' does not exist.`
        }; // Specific error
    }
    let inventory = await Inventories.findOne({
        where: {
            identifier: moveData.identifier
        }
    });
    if (!inventory) {
        console.log(`Secondary inventory not found for identifier ${moveData.identifier}`);
        return {
            success: false,
            message: `Secondary inventory with identifier '${moveData.identifier}' not found in database.`
        }; // Specific error
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
    let itemInInv = inventory.inventory.items.find((i)=>i.name === item.name && JSON.stringify(i.metadata) === JSON.stringify(item.metadata)
    );
    item.amount -= quantity;
    PlayerData.inventory.weight -= item.weight * quantity;
    if (item.amount <= 0) {
        PlayerData.inventory.items = PlayerData.inventory.items.filter((i)=>i.slot !== from
        );
    }
    if (itemInInv && itemData.stackable) {
        itemInInv.amount += quantity;
    } else {
        let freeSlot = findFreeSlot(inventory.inventory.items);
        if (freeSlot === null) {
            return {
                success: false,
                message: `Secondary inventory (identifier: ${moveData.identifier}) is full. No free slots available.`
            }; // Specific error
        }
        inventory.inventory.items.push({
            ...item,
            amount: quantity,
            slot: freeSlot
        });
    }
    await Inventories.update({
        inventory: inventory.inventory
    }, {
        where: {
            identifier: moveData.identifier
        }
    });
    console.log(`Item successfully moved to secondary`);
    inventory.inventory.data = {
        type: 'vehicle',
        identifier: moveData.identifier
    };
    saveAccount$1(player); // Save account after inventory change
    return {
        success: true,
        message: `Item moved to secondary inventory successfully.`,
        playerInventory: PlayerData.inventory,
        secondaryInventory: inventory.inventory
    }; // Improved success message
});
function findFreeSlot(items) {
    let usedSlots = items.map((i)=>i.slot
    );
    for(let i1 = 1; i1 <= 100; i1++){
        // Assuming max 100 slots, adjust if needed
        if (!usedSlots.includes(i1)) return i1;
    }
    return null;
}
//mp.events.callRemote('admin:giveItem', playerId, itemName, amount);
mp.events.add('admin:giveItem', (player, playerId, itemName, amount)=>{
    let targetPlayer = Object.values(Core.players).find((p)=>p.id === parseInt(playerId)
    ) || null;
    if (!targetPlayer) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' not found in server players data.`
        }; // Specific error
    }
    let targetMp = mp.players.toArray().find((p)=>p.rgscId === targetPlayer.rgscId
    );
    if (!targetMp) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' is not currently online.`
        }; // Specific error
    }
    chat.sendToAdmins(`^1[INV]^0 ${player.name} has given ${amount}x${itemName} to ${targetMp.name}`);
    let result;
    addItem(targetMp, itemName, amount, [], (data)=>{
        result = data;
        if (data.success) {
            saveAccount$1(targetMp); // Save target player's account after inventory change
        }
    });
    return result;
});
mp.events.add('admin:removeItem', (player, playerId, itemName, amount)=>{
    let targetPlayer = Object.values(Core.players).find((p)=>p.id === parseInt(playerId)
    ) || null;
    if (!targetPlayer) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' not found in server players data.`
        }; // Specific error
    }
    let targetMp = mp.players.toArray().find((p)=>p.rgscId === targetPlayer.rgscId
    );
    if (!targetMp) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' is not currently online.`
        }; // Specific error
    }
    chat.sendToAdmins(`^1[INV]^0 ${player.name} has removed ${amount}x${itemName} from ${targetMp.name}`);
    let result;
    removeItem(targetMp, itemName, amount, [], (data)=>{
        result = data;
        if (data.success) {
            saveAccount$1(targetMp); // Save target player's account after inventory change
        }
    });
    return result;
});
mp.events.add('admin:setMoney', (player, playerId, moneyType, amount)=>{
    let targetPlayer = Object.values(Core.players).find((p)=>p.id === parseInt(playerId)
    ) || null;
    if (!targetPlayer) {
        return {
            success: false,
            message: `Player with ID '${playerId}' not found in server players data.`
        }; // Specific error
    }
    if (moneyType === 'cash') {
        targetPlayer.cash = amount;
    } else if (moneyType === 'bank') {
        targetPlayer.bank = amount;
    } else {
        return {
            success: false,
            message: `Invalid money type '${moneyType}'. Must be 'cash' or 'bank'.`
        }; // Specific error
    }
    chat.sendToAdmins(`^1[INV]^0 ${player.name} has set ${moneyType} to $${Core.formatNumber(amount)} for ${targetPlayer.name}`);
    return {
        success: true,
        message: `Set ${moneyType} to ${amount} for player ${targetPlayer.name}.`
    }; // Improved success message
});
mp.events.add('admin:giveMoney', (player, playerId, moneyType, amount)=>{
    let targetPlayer = Object.values(Core.players).find((p)=>p.id === parseInt(playerId)
    ) || null;
    if (!targetPlayer) {
        return {
            success: false,
            message: `Player with ID '${playerId}' not found in server players data.`
        }; // Specific error
    }
    if (moneyType === 'cash') {
        targetPlayer.cash = parseInt(targetPlayer.cash) + parseInt(amount);
    } else if (moneyType === 'bank') {
        targetPlayer.bank = parseInt(targetPlayer.bank) + parseInt(amount);
    } else {
        return {
            success: false,
            message: `Invalid money type '${moneyType}'. Must be 'cash' or 'bank'.`
        }; // Specific error
    }
    chat.sendToAdmins(`^1[INV]^0 ${player.name} has given $${Core.formatNumber(parseInt(amount))} ${moneyType} to ${targetPlayer.name}`);
    return {
        success: true,
        message: `Gave $${Core.formatNumber(parseInt(amount))} ${moneyType} to player ${targetPlayer.name}.`
    }; // Improved success message
});
mp.events.addProc('inventory:giveItemToPlayer', (player, slot, playerId, quantity)=>{
    playerId = parseInt(playerId);
    slot = parseInt(slot);
    quantity = parseInt(quantity);
    let targetPlayer = Object.values(Core.players).find((p)=>p.id === parseInt(playerId)
    ) || null;
    if (!targetPlayer) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} does not exist`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' not found in server players data.`
        }; // Specific error
    }
    let targetMp = mp.players.toArray().find((p)=>p.rgscId === targetPlayer.license
    );
    if (!targetMp) {
        Core.notify(player, 'error', 'Error', `Player ${playerId} is not online`, 5000);
        return {
            success: false,
            message: `Player with ID '${playerId}' is not currently online.`
        }; // Specific error
    }
    let PlayerData = Core.GetPlayerData(player);
    //check if dropped item is a weapon, and if so, check if player has the weapon equipped, and if so, unequip it and remove it from the player
    let item = PlayerData.inventory.items.find((i)=>i.slot === slot
    ) || null;
    if (!item) {
        Core.notify(player, 'error', 'Error', `No item found in slot ${slot}`, 5000);
        return {
            success: false,
            message: `No item found in slot ${slot} of your inventory.`
        }; // Specific error
    }
    let itemData = getItemByName(item.name);
    if (!itemData) {
        Core.notify(player, 'error', 'Error', `Item ${item.name} does not exist`, 5000);
        return {
            success: false,
            message: `Registered item '${item.name}' does not exist.`
        }; // Specific error
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
        return {
            success: false,
            message: `'${item.label}' cannot be given to other players. Check item properties.`
        }; // Specific error
    }
    let result;
    let ammo = 0;
    if (isWeapon(item.name)) {
        let weapon = PlayerData.weapons.find((w)=>w.name === item.name
        ) || null;
        if (weapon.equipped) {
            ammo = weapon.ammo;
            PlayerData.weapons = PlayerData.weapons.filter((w)=>w.name !== item.name
            );
            Account.update({
                weapons: PlayerData.weapons
            }, {
                where: {
                    license: player.rgscId
                }
            });
            player.call('corefx:unequipWeapon', [
                item.name
            ]);
        }
        removeItemFromSlot(player, slot, quantity, (removeData)=>{
            result = removeData;
            if (removeData.success) {
                saveAccount$1(player); // Save sender player's account after inventory change
                addItem(targetMp, item.name, quantity, item.metadata, (data1)=>{
                    result = data1;
                    if (data1.success) {
                        saveAccount$1(targetMp); // Save target player's account after inventory change
                        //add the weapon (by weapon type)
                        addItem(targetMp, `${weapon.type}_ammo`, ammo, [], (data)=>{
                            result = data;
                            if (data.success) {
                                saveAccount$1(targetMp); // Save target player's account after inventory change
                            }
                        });
                    }
                });
            }
        });
    } else {
        removeItemFromSlot(player, slot, quantity, (removeData)=>{
            result = removeData;
            if (removeData.success) {
                saveAccount$1(player); // Save sender player's account after inventory change
                addItem(targetMp, item.name, quantity, item.metadata, (data)=>{
                    result = data;
                    if (data.success) {
                        saveAccount$1(targetMp); // Save target player's account after inventory change
                    }
                });
            }
        });
    }
    return result;
});
async function saveAccount$1(player) {
    if (!player || !player.rgscId || !Core.players[player.rgscId]) return;
    const accountData = Core.players[player.rgscId];
    accountData.position = player.position;
    accountData.heading = player.heading;
    const inventoryData = accountData.inventory; // Get inventory data
    console.log(`[AutoSave] Saving progress for ${player.name}...`);
    try {
        await Account.update(accountData, {
            where: {
                license: player.rgscId
            }
        });
        console.log(`[AutoSave] Account progress saved for ${player.name}.`);
        await Inventories.update({
            inventory: inventoryData
        }, {
            where: {
                identifier: player.rgscId
            }
        }); // Save inventory
        console.log(`[AutoSave] Inventory saved for ${player.name}.`);
    } catch (error) {
        console.error(`[AutoSave] Error saving data for ${player.name}:`, error);
    }
    let isOnline = mp.players.toArray().find((p)=>p.rgscId === player.rgscId
    );
    if (!isOnline) {
        console.log(`[AutoSave] ${player.name} is offline. Removing from Core.players.`);
        delete Core.players[player.rgscId];
    } else {
        //sync data
        player.call('corefx:updateData', [
            accountData
        ]);
    }
}
function handleWeapon(player, weaponName, weaponLabel, ammo, type) {
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
        player.call('corefx:equipWeapon', [
            weaponName,
            ammo,
            weaponLabel
        ]);
    } else {
        let currentWeapon = Player.weapons.find((w)=>w.equipped
        );
        let weaponData = Player.weapons.find((w)=>w.name === weaponName
        );
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
            player.call('corefx:unequipWeapon', [
                currentWeapon.name
            ]);
            player.call('corefx:equipWeapon', [
                weaponName,
                newAmmo || 0,
                weaponLabel
            ]);
        } else if (weaponData && !weaponData.equipped) {
            // Dacă arma există, dar nu e echipată, o echipăm
            weaponData.equipped = true;
            player.call('corefx:equipWeapon', [
                weaponName,
                weaponData.ammo || 0,
                weaponLabel
            ]);
        } else if (weaponData && weaponData.equipped) {
            // Dacă arma e deja echipată, o dezechipăm
            weaponData.equipped = false;
            player.call('corefx:unequipWeapon', [
                weaponName
            ]);
        } else if (!weaponData) {
            // Dacă arma nu există, o adăugăm și o echipăm
            Player.weapons.push({
                name: weaponName,
                label: weaponLabel,
                equipped: true,
                type: type,
                ammo: ammo
            });
            player.call('corefx:equipWeapon', [
                weaponName,
                ammo,
                weaponLabel
            ]);
        }
    }
    // Salvăm modificările în baza de date și sincronizăm datele
    Account.update({
        weapons: Player.weapons
    }, {
        where: {
            license: player.rgscId
        }
    });
    player.call('corefx:syncData', [
        Player
    ]);
}
registerItem('weapon_assaultrifle', 'Assault Rifle', 'Un rifle de asalt', 0.5, false, true, true, true, true, false, false, (player, amount)=>{
    handleWeapon(player, 'weapon_assaultrifle', 'Assault Rifle', amount, 'rifle');
});
//corefx:updateWeaponAmmoToEquiped
mp.events.add('corefx:updateWeaponAmmoToEquiped', (player, ammo)=>{
    let Player = Core.GetPlayerData(player);
    let weaponData = Player.weapons.find((w)=>w.equipped
    );
    if (weaponData) {
        weaponData.ammo = ammo;
        Account.update({
            weapons: Player.weapons
        }, {
            where: {
                license: player.rgscId
            }
        });
    }
});
//corefx:updateWeaponAmmo
mp.events.add('corefx:updateWeaponAmmo', (player, weaponName, ammo)=>{
    let Player = Core.GetPlayerData(player);
    let weaponData = Player.weapons.find((w)=>w.name === weaponName
    );
    if (weaponData) {
        weaponData.ammo = ammo;
        Account.update({
            weapons: Player.weapons
        }, {
            where: {
                license: player.rgscId
            }
        });
    }
});
//rifle_ammo (check if current ammo has rifle type)
registerItem('rifle_ammo', 'Rifle Ammo', 'Muniție pentru puști', 0.01, true, true, true, true, true, true, true, (player, amount)=>{
    console.log(`Adding rifle ammo to player ${player.name}: ${amount}`);
    let Player = Core.GetPlayerData(player);
    let weaponData = Player.weapons.find((w)=>w.equipped && w.type === 'rifle'
    );
    console.log(weaponData);
    if (weaponData) {
        weaponData.ammo = weaponData.ammo + parseInt(amount);
        removeItem(player, 'rifle_ammo', amount, [], ()=>{
            player.call('corefx:updateWeaponAmmo', [
                weaponData.name,
                weaponData.ammo
            ]);
        });
    } else {
        Core.notify(player, 'error', 'Error', `You don't have a rifle equipped`, 5000);
    }
});
registerItem('pistol_ammo', 'Pistol Ammo', 'Muniție pentru pistoale', 0.01, true, true, true, true, true, true, true, (player, amount)=>{
    console.log(`Adding rifle ammo to player ${player.name}: ${amount}`);
    let Player = Core.GetPlayerData(player);
    let weaponData = Player.weapons.find((w)=>w.equipped && w.type === 'pistol'
    );
    console.log(weaponData);
    if (weaponData) {
        weaponData.ammo = weaponData.ammo + parseInt(amount);
        removeItem(player, 'pistol_ammo', amount, [], ()=>{
            player.call('corefx:updateWeaponAmmo', [
                weaponData.name,
                weaponData.ammo
            ]);
        });
    } else {
        Core.notify(player, 'error', 'Error', `You don't have a pistol equipped`, 5000);
    }
});
registerItem('weapon_gadgetpistol', 'Gadget Pistol', 'Gadget Pistol', 0.5, false, true, true, true, true, false, false, (player, amount)=>{
    handleWeapon(player, 'weapon_gadgetpistol', 'Gadget Pistol', amount, 'pistol');
});
registerItem('weapon_pumpshotgun', 'Pump Shotgun', 'Pump Shotgun', 0.5, false, true, true, true, true, false, false, (player, amount)=>{
    handleWeapon(player, 'weapon_pumpshotgun', 'Pump Shotgun', amount, 'shotgun');
});

var commands = {
};
var chat = {
    sendToAll: (message)=>{
        mp.players.forEach((p)=>{
            p.call('chat:addMessage', [
                message
            ]);
        });
    },
    sendChatMessage: (player, message)=>{
        if (!mp.players.exists(player)) return;
        var name = player.name;
        Core.players[player.rgscId];
        //save to chatLog
        var log = `[CHATLOG GLOBAL] ${Core.adminGrades[Core.players[player.rgscId].admin]} ${name}: ${message} at ${new Date().toLocaleString()}\n`;
        fs__default["default"].existsSync('chatLog.txt') ? fs__default["default"].appendFileSync('chatLog.txt', log) : fs__default["default"].writeFileSync('chatLog.txt', log);
        mp.players.forEach((p)=>{
            p.call('chat:addMessage', [
                `${Core.adminGrades[Core.players[player.rgscId].admin]} ${name}: ${message}`
            ]);
        });
    },
    sendToPlayer: (player, message)=>{
        if (!mp.players.exists(player)) return;
        var log = `[CHATLOG TO PLAYER] ${message} at ${new Date().toLocaleString()}\n`;
        fs__default["default"].existsSync('chatLog.txt') ? fs__default["default"].appendFileSync('chatLog.txt', log) : fs__default["default"].writeFileSync('chatLog.txt', log);
        player.call('chat:addMessage', [
            message
        ]);
    },
    sendToAdmins: (message)=>{
        var log = `[CHATLOG ADMIN] ${message} at ${new Date().toLocaleString()}\n`;
        fs__default["default"].existsSync('chatLog.txt') ? fs__default["default"].appendFileSync('chatLog.txt', log) : fs__default["default"].writeFileSync('chatLog.txt', log);
        mp.players.forEach((p)=>{
            var PlayerData = Core.players[p.rgscId];
            if (PlayerData.admin > 0) {
                p.call('chat:addMessage', [
                    message
                ]);
            }
        });
    },
    registerCommand: (command, callback, description, usage, admin = 0)=>{
        if (commands[command]) {
            console.error(`Command ${command} already exists.`);
            return;
        }
        commands[command] = {
            name: command,
            callback,
            description,
            usage,
            admin
        };
    },
    processCommand: (player, message)=>{
        if (message.startsWith('/')) {
            const [cmdName, ...args] = message.slice(1).split(' ');
            const cmd = commands[cmdName];
            if (cmd) {
                var PlayerData = Core.players[player.rgscId];
                if (PlayerData.admin < cmd.admin) {
                    chat.sendToPlayer(player, '^2[ERROR]^0 You do not have permission to use this command.');
                    return;
                }
                // --- ARGUMENT CHECKING ---
                const requiredArgs = (cmd.usage.match(/\[(.*?)\]/g) || []).map((arg)=>arg.slice(1, -1)
                );
                const numRequiredArgs = requiredArgs.length;
                if (args.length < numRequiredArgs) {
                    chat.sendToPlayer(player, `^1[USAGE] ^0${cmd.usage}`);
                    return;
                }
                // Verifică dacă primul argument este un număr valid dacă usage-ul cere un număr
                if (requiredArgs[0] && requiredArgs[0].toLowerCase().includes('id')) {
                    const id = parseInt(args[0], 10);
                    if (isNaN(id) && args[0] !== '0') {
                        chat.sendToPlayer(player, `^1[ERROR] ^0Invalid ID format.`);
                        return;
                    }
                }
                // Salvează comanda în log
                var log = `${player.name} used command /${cmdName} ${args.join(' ')} at ${new Date().toLocaleString()}\n`;
                fs__default["default"].existsSync('commandLogs.txt') ? fs__default["default"].appendFileSync('commandLogs.txt', log) : fs__default["default"].writeFileSync('commandLogs.txt', log);
                cmd.callback(player, args);
            } else {
                chat.sendToPlayer(player, `^2[ERROR] Command /${cmdName} does not exist.`);
            }
        } else {
            chat.sendChatMessage(player, message);
        }
    }
};
// Event handler for incoming messages from clients
mp.events.add('chat:message', (player, message)=>{
    chat.processCommand(player, message);
});
mp.events.add('chat:command', (player, message)=>{
    chat.processCommand(player, message);
});
chat.registerCommand('clear', (player, _args)=>{
    chat.sendToAll('^1[INFO] ^0Chat has been cleared by an administrator.');
    mp.players.forEach((p)=>{
        p.call('chat:clear');
    });
    chat.sendToAdmins(`^1[CHAT] ^0${player.name} has cleared the chat.`);
}, 'Clears the chat', '/clear', 0);
//getCommands proc
// register RPC 'test_proc' in server-side
// mp.events.addProc('test_proc', (player, text) => {
//     return 'hey beast: ' + text;
//   });
mp.events.addProc('getServerCommands', (_player)=>{
    var cmds = Object.keys(commands).map((cmd)=>{
        return {
            name: commands[cmd].name,
            description: commands[cmd].description,
            usage: commands[cmd].usage,
            admin: commands[cmd].admin
        };
    });
    return cmds;
});
chat.registerCommand('savepos', (player, args)=>{
    //save to file positions.json
    var pos = player.position;
    var heading = player.heading;
    var name = args[0] || 'default';
    var data = {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        h: heading
    };
    fs__default["default"].existsSync('positions.json') ? fs__default["default"].appendFileSync('positions.json', JSON.stringify({
        [name]: data
    })) : fs__default["default"].writeFileSync('positions.json', JSON.stringify({
        [name]: data
    }));
    chat.sendToPlayer(player, `^1[INFO] ^0Position saved as ${name}.`);
}, 'Saves your current position', '/savepos [name]', 0);
chat.registerCommand('veh', (player, args)=>{
    var model = args[0];
    if (!model) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/veh [model]`);
        return;
    }
    var pos = player.position;
    var randomColor = ()=>Math.floor(Math.random() * 256)
    ;
    var veh = mp.vehicles.new(mp.joaat(model), new mp.Vector3(pos.x, pos.y, pos.z), {
        numberPlate: 'ADMIN',
        color: [
            [
                randomColor(),
                randomColor(),
                randomColor()
            ],
            [
                randomColor(),
                randomColor(),
                randomColor()
            ]
        ]
    });
    chat.sendToPlayer(player, `^1[INFO] ^0Vehicle spawned.`);
    player.putIntoVehicle(veh, 0);
}, 'Spawns a vehicle', '/veh [model]', 1);
mp.events.add("vehicleShops:test", (player, model, spot)=>{
    console.log(model, spot);
    var veh = mp.vehicles.new(mp.joaat(model), new mp.Vector3(spot.x, spot.y, spot.z), {
        heading: spot.h,
        numberPlate: 'TESTDRIVE',
        color: [
            [
                255,
                255,
                255
            ],
            [
                255,
                255,
                255
            ]
        ]
    });
    chat.sendToPlayer(player, `^1[INFO] ^0Test drive a inceput. Ai la dispozitie 2 minute, sau poti parasii masina oricand.`);
    //interval 1s to check if player is in vehicle
    let interval = setInterval(()=>{
        if (!mp.vehicles.exists(veh)) {
            chat.sendToPlayer(player, `^1[INFO] ^0Test drive a fost terminat. Masina a fost stearsa.`);
            clearInterval(interval);
        } else if (mp.vehicles.exists(veh) && player.vehicle && player.vehicle.id != veh.id) {
            chat.sendToPlayer(player, `^1[INFO] ^0Test drive a fost terminat. Masina a fost stearsa.`);
            clearInterval(interval);
            veh.destroy();
        }
    }, 1000);
    setTimeout(()=>{
        clearInterval(interval);
        if (veh && mp.vehicles.exists(veh)) {
            veh.destroy();
            chat.sendToPlayer(player, `^1[INFO] ^0Test drive a expirat. Masina a fost stearsa.`);
        }
    }, 120000);
    //set heading to vehicle
    veh.rotation = new mp.Vector3(0, 0, spot.h);
    player.putIntoVehicle(veh, 0);
});
//dv
chat.registerCommand('dv', (player, _args)=>{
    if (player.vehicle) {
        player.vehicle.destroy();
        chat.sendToPlayer(player, `^1[INFO] ^0Vehicle deleted.`);
    } else {
        chat.sendToPlayer(player, `^1[INFO] ^0You are not in a vehicle.`);
    }
}, 'Deletes your current vehicle', '/dv', 1);
//cleanup [seconds] to remove all vehicles unoccupied
chat.registerCommand('cleanup', (player, args)=>{
    var seconds = parseInt(args[0]);
    if (!seconds) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/cleanup [seconds]`);
        return;
    }
    let totalDeleted = 0;
    chat.sendToAll(`^1[INFO] ^0All unoccupied vehicles will be removed in ${seconds} seconds.`);
    mp.vehicles.forEach((veh)=>{
        if (!veh.getOccupants().length) {
            totalDeleted++;
            setTimeout(()=>{
                veh.destroy();
            }, seconds * 1000);
        }
    });
    setTimeout(()=>{
        chat.sendToAdmins(`^1[INFO] ^0${totalDeleted} unoccupied vehicles have been deleted.`);
    }, seconds * 1000);
}, 'Removes all unoccupied vehicles after a certain amount of time', '/cleanup [seconds]', 1);
//cleanarea [radius] to remove all vehicles and objects
chat.registerCommand('cleanarea', (player, args)=>{
    var radius = parseInt(args[0]);
    if (!radius) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/cleanarea [radius]`);
        return;
    }
    let totalDeleted = 0;
    chat.sendToAll(`^1[INFO] ^0All vehicles and objects will be removed in a ${radius}m radius.`);
    mp.vehicles.forEach((veh)=>{
        if (veh.position.subtract(player.position).length() < radius) {
            totalDeleted++;
            veh.destroy();
        }
    });
    mp.objects.forEach((obj)=>{
        if (obj.position.subtract(player.position).length() < radius) {
            totalDeleted++;
            obj.destroy();
        }
    });
    chat.sendToAdmins(`^1[INFO] ^0${totalDeleted} vehicles and objects have been deleted.`);
}, 'Removes ALL vehicles and objects in a certain radius', '/cleanarea [radius]', 1);
//admins
chat.registerCommand('admins', (player, _args)=>{
    //to show like below:
    //---------- Admins Online ----------
    // Name(id) - Admin Level Name (ON-DUTY / OFF-DUTY)
    //------------------------------------
    var admins = mp.players.toArray().filter((p)=>Core.players[p.rgscId].admin > 0
    );
    chat.sendToPlayer(player, `^1---------- Admins Online ----------`);
    admins.forEach((admin)=>{
        var PlayerData = Core.players[admin.rgscId];
        chat.sendToPlayer(player, `^0${admin.name}(${admin.id}) - ${Core.adminGrades[parseInt(PlayerData.admin)]}(${PlayerData.onDuty ? '^3ON-DUTY^0' : '^2OFF-DUTY^0'})`);
    });
    chat.sendToPlayer(player, `^1---------- Admins Online ----------`);
}, 'Lists all online administrators', '/admins', 0);
//aduty
chat.registerCommand('aduty', (player, _args)=>{
    var PlayerData = Core.players[player.rgscId];
    PlayerData.onDuty = !PlayerData.onDuty;
    chat.sendToAdmins(`^1[INFO] ^0${player.name} is now ${PlayerData.onDuty ? '^3ON-DUTY^0' : '^2OFF-DUTY^0'}.`);
}, 'Toggle your duty status', '/aduty', 1);
//n (newbie question) - to send to admins
let newbieQuestions = [];
chat.registerCommand('n', (player, args)=>{
    var question = args.join(' ');
    if (!question) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/n [question]`);
        return;
    }
    newbieQuestions.push({
        player: Core.players[player.rgscId].id,
        question: question
    });
    chat.sendToAdmins(`^3[NEWBIE] ${player.name} has asked: ${question} ^0(/nr ${Core.players[player.rgscId].id} [answer] to respond)`);
}, 'Ask a question to the admins', '/n [question]', 0);
//nr (newbie response) - to respond to a newbie question
chat.registerCommand('nr', (player, args)=>{
    var id = parseInt(args[0]);
    var response = args.slice(1).join(' ');
    if (!id || !response) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/nr [id] [response]`);
        return;
    }
    var question = newbieQuestions.find((q)=>q.player === id
    );
    if (!question) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Question not found.`);
        return;
    }
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === question.player
    );
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    chat.sendToPlayer(target, `^3[NEWBIE] ${player.name} has responded: ${response}`);
    chat.sendToPlayer(player, `^3[NEWBIE] ^0You have responded to ${target.name}'s question.`);
}, 'Respond to a newbie question', '/nr [id] [response]', 1);
let tickets = [];
chat.registerCommand('ctk', (player, args)=>{
    var reason = args.join(' ');
    if (!reason) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/ctk [reason]`);
        return;
    }
    tickets.push({
        player: Core.players[player.rgscId].id,
        reason: reason
    });
    chat.sendToAdmins(`^3[TICKET] ${player.name} has created a ticket: ${reason} ^0(/tk ${Core.players[player.rgscId].id})`);
}, 'Create a ticket', '/ctk [reason]', 0);
//tk - teleport to player
chat.registerCommand('tk', (player, args)=>{
    var id = parseInt(args[0]);
    if (!id) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/tk [id]`);
        return;
    }
    try {
        var ticket = tickets.find((t)=>t.player === id
        );
        if (!ticket) {
            chat.sendToPlayer(player, `^2[ERROR] ^0Ticket not found.`);
            return;
        }
        var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === ticket.player
        );
        if (!target) {
            chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
            return;
        }
        //send message to target
        chat.sendToPlayer(target, `^3[TICKET] ^0${player.name} has taken your ticket.`);
        //remove ticket
        tickets = tickets.filter((t)=>t.player !== id
        );
        player.position = target.position;
        chat.sendToPlayer(player, `^1[INFO] ^0You have teleported to ${target.name}.`);
    } catch (e) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player or ticket not found.`);
    }
}, 'Teleport to a player', '/tk [id]', 1);
//setadmin [id] [level]
chat.registerCommand('setadmin', (player, args)=>{
    var id = parseInt(args[0]);
    var level = parseInt(args[1]);
    if (isNaN(id) || isNaN(level)) {
        chat.sendToPlayer(player, `^1[USAGE]x ^0/setadmin [id] [level]`);
        return;
    }
    if (level > 13) return chat.sendToPlayer(player, `^1[ERROR] ^0Invalid admin level (0 - 13).`);
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === id
    );
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    if (target.id == player.id) return chat.sendToPlayer(player, `^1[ERROR] ^0You cannot modify your own admin level.`);
    var PlayerData = Core.players[target.rgscId];
    if (PlayerData.admin >= 13) return chat.sendToPlayer(player, `^1[ERROR] ^0You cannot modify this player admin's level.`);
    PlayerData.admin = level;
    Account.update({
        admin: level
    }, {
        where: {
            license: target.rgscId
        }
    });
    let removedAdminBool = level === 0 ? true : false;
    if (removedAdminBool) {
        chat.sendToPlayer(target, `^1[ADMIN] ^0Your admin level has been removed.`);
        chat.sendToAdmins(`^1[ADMIN] ^0${player.name} has removed ${target.name}'s admin level.`);
    } else {
        chat.sendToAdmins(`^1[ADMIN] ^0${player.name} has set ${target.name}'s admin level to ${Core.adminGrades[level]}.`);
    }
}, 'Set a player\'s admin level', '/setadmin [id] [level]', 0);
//tptome [id]
chat.registerCommand('tptome', (player, args)=>{
    var id = parseInt(args[0]);
    if (!id) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/tptome [id]`);
        return;
    }
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === id
    );
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    target.position = player.position;
    chat.sendToPlayer(player, `^1[INFO] ^0You have teleported ${target.name} to you.`);
}, 'Teleport a player to you', '/tptome [id]', 1);
//tpto [id]
chat.registerCommand('tpto', (player, args)=>{
    var id = parseInt(args[0]);
    if (!id) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/tpto [id]`);
        return;
    }
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === id
    );
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    player.position = target.position;
    chat.sendToPlayer(player, `^1[INFO] ^0You have teleported to ${target.name}.`);
}, 'Teleport to a player', '/tpto [id]', 1);
//fix
chat.registerCommand('fix', (player, _args)=>{
    if (player.vehicle) {
        player.vehicle.repair();
        chat.sendToPlayer(player, `^1[INFO] ^0Vehicle repaired.`);
    } else {
        chat.sendToPlayer(player, `^1[INFO] ^0You are not in a vehicle.`);
    }
}, 'Repairs your current vehicle', '/fix', 0);
mp.events.addProc('getServerData', ()=>{
    return {
        tickets: tickets.length,
        questions: newbieQuestions.length
    };
});
//weather [weather]
chat.registerCommand('weather', (player, args)=>{
    var weather = args[0];
    if (!weather) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/weather [weather]`);
        return;
    }
    mp.world.weather = weather;
    chat.sendToPlayer(player, `^1[INFO] ^0Weather set to ${weather}.`);
}, 'Set the weather', '/weather [weather]', 1);
//time [hour] [minute]
chat.registerCommand('time', (player, args)=>{
    var hour = parseInt(args[0]);
    var minute = parseInt(args[1]);
    if (isNaN(hour) || isNaN(minute)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/time [hour] [minute]`);
        return;
    }
    mp.world.time.hour = hour;
    mp.world.time.minute = minute;
    chat.sendToPlayer(player, `^1[INFO] ^0Time set to ${hour}:${minute}.`);
}, 'Set the time', '/time [hour] [minute]', 1);
chat.registerCommand('giveitem', (player, args)=>{
    var id = parseInt(args[0]);
    var item = args[1];
    var amount = parseInt(args[2]);
    if (isNaN(id) || !item || isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/giveitem [id] [item] [amount]`);
        return;
    }
    console.log(id, item, amount);
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === id
    );
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    addItem(target, item, amount, [], (result)=>{
        if (result.success) {
            if (target) {
                chat.sendToPlayer(target, `^1[INFO] ^0You have received ${amount}x ${item} from ${player.name}.`);
                chat.sendToPlayer(player, `^1[INFO] ^0You have given ${amount}x ${item} to ${target.name}.`);
            } else {
                chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
            }
        } else {
            chat.sendToPlayer(player, `^2[ERROR] ^0Invalid item.`);
        }
    });
}, 'Give an item to a player', '/giveitem [id] [item] [amount]', 8);
//removeitem [id] [item] [amount]
chat.registerCommand('removeitem', (player, args)=>{
    var id = parseInt(args[0]);
    var item = args[1];
    var amount = parseInt(args[2]);
    if (isNaN(id) || !item || isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/removeitem [id] [item] [amount]`);
        return;
    }
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === id
    );
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    addItem(target, item, -amount, [], (result)=>{
        if (result.success) {
            if (target) {
                chat.sendToPlayer(target, `^1[INFO] ^0${amount}x ${item} has been removed from your inventory by ${player.name}.`);
                chat.sendToPlayer(player, `^1[INFO] ^0You have removed ${amount}x ${item} from ${target.name}'s inventory.`);
            } else {
                chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
            }
        } else {
            chat.sendToPlayer(player, `^2[ERROR] ^0Invalid item.`);
        }
    });
}, 'Remove an item from a player', '/removeitem [id] [item] [amount]', 8);
//myitems
chat.registerCommand('myitems', (player, _args)=>{
    var PlayerData = Core.players[player.rgscId];
    chat.sendToPlayer(player, `^1---------- Inventory ----------`);
    PlayerData.inventory.items.forEach((item)=>{
        chat.sendToPlayer(player, `Name: ${item.name} Label: ${item.label} Amount: ${item.amount} Slot: ${item.slot}`);
    });
    chat.sendToPlayer(player, `^1---------- Inventory ----------`);
}, 'View your inventory', '/myitems', 0);
//givemoney [id] [type] [amount]
chat.registerCommand('givemoney', (player, args)=>{
    var id = parseInt(args[0]);
    var type = args[1];
    var amount = parseInt(args[2]);
    if (isNaN(id) || !type || isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/givemoney [id] [type] [amount]`);
        return;
    }
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === id
    );
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    var PlayerData = Core.players[target.rgscId];
    PlayerData[type] += amount;
    chat.sendToAdmins(`^1[INFO] ^0${player.name} has given $${Core.formatNumber(amount)} to ${target.name}.`);
    chat.sendToPlayer(target, `^1[INFO] ^0You have received $${Core.formatNumber(amount)} from ${player.name}.`);
    chat.sendToPlayer(player, `^1[INFO] ^0You have given $${Core.formatNumber(amount)} to ${target.name}.`);
}, 'Give money to a player', '/givemoney [id] [type] [amount]', 8);
chat.registerCommand('useitem', (player, args)=>{
    var item = args[0];
    var amount = parseInt(args[1]);
    if (isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/useitem [item] [amount]`);
        return;
    }
    useItem(player, item, amount, (result)=>{
        if (result.success) {
            chat.sendToPlayer(player, `^1[INFO] ^0You have used ${amount}x ${item}.`);
        } else {
            chat.sendToPlayer(player, `^2[ERROR] ^0Item use failed.`);
        }
    });
}, 'Use an item from your inventory', '/useitem [item] [amount]', 0);
//dropItem
chat.registerCommand('dropitem', (player, args)=>{
    var item = args[0];
    var amount = parseInt(args[1]);
    if (isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/dropitem [item] [amount]`);
        return;
    }
    dropItem(player, item, amount, (result)=>{
        if (result.success) {
            chat.sendToPlayer(player, `^1[INFO] ^0You have dropped ${amount}x ${item}.`);
        } else {
            chat.sendToPlayer(player, `^2[ERROR] ^0Item drop failed.`);
        }
    });
}, 'Drop an item from your inventory', '/dropitem [item] [amount]', 0);
chat.registerCommand('addonvehs', (player)=>{
    chat.sendToPlayer(player, `^1---------- Addon Vehicles ----------`);
    fs__default["default"].readdirSync('./client_packages/game_resources/dlcpacks/').forEach((file)=>{
        if (fs__default["default"].lstatSync(`./client_packages/game_resources/dlcpacks/${file}`).isDirectory() && file.startsWith('veh_')) {
            chat.sendToPlayer(player, `^1[VEH] ^0${file}`);
        }
    });
    chat.sendToPlayer(player, `^1---------- Addon Vehicles ----------`);
}, 'List all addon vehicles', '/addonvehs', 10);
mp.events.add('admin:teleportPlayerToMe', (player, playerId)=>{
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === parseInt(playerId)
    );
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    target.position = player.position;
    chat.sendToPlayer(player, `^1[INFO] ^0You have teleported ${target.name} to you.`);
});
mp.events.add('admin:teleportToPlayer', (player, playerId)=>{
    console.log(playerId);
    console.log(JSON.stringify(mp.players.toArray()));
    var target = mp.players.toArray().find((p)=>Core.players[p.rgscId].id === parseInt(playerId)
    );
    console.log(target);
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    player.position = target.position;
    chat.sendToPlayer(player, `^1[INFO] ^0You have teleported to ${target.name}.`);
});

// Map to store player data for comparison
const playerDataMap = new Map();
// Map to track auto-save intervals by player ID
const playerSaveIntervals = new Map();
/**
 * Creates a proxy to watch for changes in player data and sync it
 */ function watchPlayerData(playerId, data) {
    return new Proxy(data, {
        set (target, prop, value) {
            if (target[prop] !== value) {
                target[prop] = value;
                if (playerDataMap.has(playerId)) {
                    playerDataMap.set(playerId, {
                        ...target
                    });
                    const player = mp.players.toArray().find((p)=>p.rgscId === playerId
                    );
                    if (player) {
                        player.call('corefx:updateData', [
                            target
                        ]);
                    // Avoid circular reference
                    // Core.players[player.rgscId] = target; // This line created a circular reference
                    }
                }
            }
            return true;
        }
    });
}
const Core = {
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
    players: new Proxy({
    }, {
        set (target, playerId, data) {
            if (!target[playerId]) {
                playerDataMap.set(playerId, data);
                target[playerId] = watchPlayerData(playerId, data);
            } else {
                Object.assign(target[playerId], data);
            }
            return true;
        }
    }),
    GetPlayerData: (player)=>{
        if (!player || !player.rgscId) return false;
        return Core.players[player.rgscId] || false;
    },
    notify: (player, type, title, message, duration = 5000)=>{
        if (!player || !player.call) return;
        player.call('corefx:notify', [
            type,
            title,
            message,
            duration
        ]);
    },
    formatMoney: (amount)=>`$${amount.toLocaleString()}`
    ,
    formatTime: (time)=>new Date(time).toLocaleString()
    ,
    formatNumber: (number)=>number.toLocaleString()
};
/**
 * Save player account data to database
 * @param player The player whose data to save
 * @returns Promise that resolves when save is complete
 */ async function saveAccount(player) {
    if (!player || !player.rgscId || !Core.players[player.rgscId]) return;
    const onlinePlayers = mp.players.toArray();
    const isOnline = onlinePlayers.some((p)=>p.rgscId === player.rgscId
    );
    if (!isOnline) return;
    try {
        const accountData = {
            ...Core.players[player.rgscId]
        };
        accountData.position = player.position;
        accountData.heading = player.heading;
        console.log(`[AutoSave] Saving progress for ${player.name}...`);
        await Account.update(accountData, {
            where: {
                license: player.rgscId
            },
            fields: Object.keys(accountData) // Only update fields that exist in accountData
        });
        console.log(`[AutoSave] Progress saved for ${player.name}.`);
        // Check if player is still online after the save
        const stillOnline = mp.players.toArray().some((p)=>p.rgscId === player.rgscId
        );
        if (!stillOnline) {
            console.log(`[AutoSave] ${player.name} is offline. Removing from Core.players.`);
            delete Core.players[player.rgscId];
            playerDataMap.delete(player.rgscId);
            // Clear any auto-save intervals
            if (playerSaveIntervals.has(player.rgscId)) {
                clearInterval(playerSaveIntervals.get(player.rgscId));
                playerSaveIntervals.delete(player.rgscId);
            }
        } else {
            // Sync data with client
            player.call('corefx:updateData', [
                accountData
            ]);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to save account for ${player.name}:`, error);
    }
}
/**
 * Create a new player account
 * @param player The player to create an account for
 * @returns The created account data
 */ async function createNewAccount(player) {
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
            appearance: {
            }
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
        admin: Number(player.rgscId) === 209399696 ? 13 : 0,
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
    await Account.update({
        last_login: data.last_login
    }, {
        where: {
            license: player.rgscId
        }
    });
    return newAccount.toJSON();
}
/**
 * Setup auto-save for a player
 */ function setupAutoSave(player) {
    // Clear any existing intervals for this player
    if (playerSaveIntervals.has(player.rgscId)) {
        clearInterval(playerSaveIntervals.get(player.rgscId));
    }
    // Create new interval
    const intervalId = setInterval(()=>{
        const isConnected = mp.players.toArray().some((p)=>p.rgscId === player.rgscId
        );
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
const playerSyncIds = new Map();
// Handle player join event
mp.events.add('playerJoin', async (player)=>{
    // Assign a unique sync ID for the player
    playerSyncIds.set(player.id, playerSyncIds.size + 1);
    player.setVariable('syncId', playerSyncIds.get(player.id));
    try {
        // Check if account exists using Sequelize
        const exists = await Account.count({
            where: {
                license: player.rgscId
            }
        }) > 0;
        if (!exists) {
            const accountData = await createNewAccount(player);
            Core.players[player.rgscId] = accountData;
            Core.players[player.rgscId].onDuty = false;
            player.call('corefx:playerReady', [
                accountData
            ]);
            setupAutoSave(player);
            // Dev environment check - should use environment variables instead of hardcoded IPs
            player.call('changeBrowserUrl', [
                player.ip === '192.168.1.133'
            ]);
            console.log(`[HelloBot] ${player.name} has joined the server for the first time.`);
            chat.sendToAdmins(`^1[HelloBot] ^0 ${player.name} has joined the server for the first time.`);
        } else {
            // Fetch existing account
            const account = await Account.findOne({
                where: {
                    license: player.rgscId
                }
            });
            if (account) {
                // Update last_login
                const updatedLastLogin = new Date().toISOString().slice(0, 19).replace('T', ' ');
                await account.update({
                    last_login: updatedLastLogin
                });
                const accountData = account.toJSON();
                Core.players[player.rgscId] = accountData;
                Core.players[player.rgscId].onDuty = false;
                // Dev environment check - use environment variables instead
                player.call('changeBrowserUrl', [
                    player.ip === '192.168.1.133'
                ]);
                player.call('corefx:playerReady', [
                    accountData
                ]);
                // Setup voice chat
                mp.players.forEach((p)=>{
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
mp.events.add('playerQuit', (player)=>{
    // Remove player sync ID
    playerSyncIds.delete(player.id);
    // Save player data before they leave
    if (player.rgscId && Core.players[player.rgscId]) {
        saveAccount(player);
    }
    // Clear auto-save interval
    if (player.rgscId && playerSaveIntervals.has(player.rgscId)) {
        clearInterval(playerSaveIntervals.get(player.rgscId));
        playerSaveIntervals.delete(player.rgscId);
    }
    // Cleanup any other players that might not be online anymore
    Object.keys(Core.players).forEach(async (key)=>{
        const playerExists = mp.players.toArray().some((p)=>p.rgscId === key
        );
        if (!playerExists && Core.players[key]) {
            try {
                await Account.update(Core.players[key], {
                    where: {
                        license: key
                    },
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
mp.events.add('playerReload', async (player)=>{
    console.log('Reload triggered for player', player.name);
    try {
        const exists = await Account.count({
            where: {
                license: player.rgscId
            }
        }) > 0;
        if (!exists) {
            const accountData = await createNewAccount(player);
            Core.players[player.rgscId] = accountData;
            Core.players[player.rgscId].onDuty = false;
            player.call('corefx:playerReady', [
                accountData
            ]);
            // Dev environment check
            player.call('changeBrowserUrl', [
                player.ip === '192.168.1.133'
            ]);
            // Put player in a random dimension for separation
            player.dimension = Math.floor(Math.random() * 1000);
            console.log(`[HelloBot] ${player.name} has joined the server for the first time.`);
            chat.sendToAdmins(`^1[HelloBot] ^0 ${player.name} has joined the server for the first time.`);
        } else {
            // Fetch existing account
            const account = await Account.findOne({
                where: {
                    license: player.rgscId
                }
            });
            if (account) {
                // Update last_login
                const updatedLastLogin = new Date().toISOString().slice(0, 19).replace('T', ' ');
                await account.update({
                    last_login: updatedLastLogin
                });
                const accountData = account.toJSON();
                Core.players[player.rgscId] = accountData;
                Core.players[player.rgscId].onDuty = false;
                // Dev environment check
                player.call('changeBrowserUrl', [
                    player.ip === '192.168.1.133'
                ]);
                player.call('corefx:playerReady', [
                    accountData
                ]);
                console.log(`[HelloBot] ${player.name} has rejoined the server. Last login: ${updatedLastLogin}`);
                chat.sendToAdmins(`^1[HelloBot] ^0 ${player.name} has rejoined the server. Last login: ${updatedLastLogin}`);
            }
        }
    } catch (error) {
        console.error(`[Error] Failed to handle playerReload for ${player.name}:`, error);
    }
});
// Handle player death event
mp.events.add('playerDeath', (player)=>{
    if (!player.rgscId) return;
    const account = Core.players[player.rgscId];
    if (!account) return;
    account.dead = 1;
    player.call('cl:showDeathscreen');
    saveAccount(player);
});
// Handle player revive event
mp.events.add('revivePed', (player)=>{
    if (!player.rgscId) return;
    const account = Core.players[player.rgscId];
    if (!account) return;
    account.dead = 0;
    player.call('cl:hideDeathscreen');
    saveAccount(player);
});
// Update UI for all players periodically
setInterval(()=>{
    mp.players.forEach((player)=>{
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
        player.call('corefx:updateUI', [
            data
        ]);
    });
}, 1000);
// Voice chat events
mp.events.add('voiceChat:addListener', (player, target)=>{
    if (player && target && player.rgscId !== target.rgscId) {
        player.enableVoiceTo(target);
    }
});
mp.events.add('voiceChat:removeListener', (player, target)=>{
    if (player && target && player.rgscId !== target.rgscId) {
        player.disableVoiceTo(target);
    }
});
// Vehicle mod functions
const getMods = (vehicle)=>{
    if (!vehicle) return {
    };
    const mods = {
    };
    // Get all mods from 0 to 67
    for(let i = 0; i <= 67; i++){
        mods[`mod${i}`] = vehicle.getMod(i);
    }
    // Get vehicle colors
    mods.primaryColor = vehicle.getColorRGB(0) || [
        0,
        0,
        0
    ];
    mods.secondaryColor = vehicle.getColorRGB(1) || [
        0,
        0,
        0
    ];
    return mods;
};
function setMods(vehicle, mods) {
    if (!vehicle || !mods) return;
    // Set all mods
    for(let i = 0; i <= 67; i++){
        const modValue = mods[`mod${i}`];
        if (modValue !== undefined && modValue !== null) {
            vehicle.setMod(i, modValue);
        }
    }
    // Set vehicle colors
    const primaryColor = mods.primaryColor || [
        0,
        0,
        0
    ];
    const secondaryColor = mods.secondaryColor || [
        0,
        0,
        0
    ];
    vehicle.setColorRGB(primaryColor[0], primaryColor[1], primaryColor[2], secondaryColor[0], secondaryColor[1], secondaryColor[2]);
}
// Update vehicle color event
mp.events.add('updateVehColor', async (player)=>{
    const vehicle = player.vehicle;
    if (!vehicle) return;
    try {
        const mods = getMods(vehicle);
        await Vehicles.update({
            mods
        }, {
            where: {
                plate: vehicle.numberPlate.replace(/-/g, '')
            }
        });
    } catch (error) {
        console.error(`[ERROR] Failed to update vehicle color:`, error);
    }
});
// Get vehicle mods from database
async function getModsFromDb(plate) {
    if (!plate) return {
    };
    try {
        const dbVehicle = await Vehicles.findOne({
            where: {
                plate: plate
            }
        });
        if (!dbVehicle) return {
        };
        return dbVehicle.mods || {
        };
    } catch (error) {
        console.error(`[ERROR] Failed to get mods from DB for plate ${plate}:`, error);
        return {
        };
    }
}
// Set vehicle mod event
mp.events.add('vehSetMod', async (player, modType, modIndex, price)=>{
    const vehicle = player.vehicle;
    if (!vehicle) return;
    // Validate input
    if (typeof modType !== 'number' || typeof modIndex !== 'number') {
        return chat.sendToPlayer(player, `^1[Error] ^0Invalid mod parameters!`);
    }
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
        const dbVehicle = await Vehicles.findOne({
            where: {
                plate
            }
        });
        if (!dbVehicle) {
            return chat.sendToPlayer(player, `^1[Error] ^0Vehicle not found in database!`);
        }
        // Apply the mod
        vehicle.setMod(modType, modIndex);
        // Update player cash
        playerData.cash -= numericPrice;
        await Account.update({
            cash: playerData.cash
        }, {
            where: {
                license: player.rgscId
            }
        });
        // Update client data
        player.call('corefx:updateData', [
            playerData
        ]);
        // Update vehicle mods in DB
        const mods = getMods(vehicle);
        await Vehicles.update({
            mods
        }, {
            where: {
                plate
            }
        });
        // Send success message
        chat.sendToPlayer(player, `^2[Success] ^0Ai plătit ^1$${Core.formatNumber(numericPrice)} ^0pentru a aplica acest mod!`);
    } catch (error) {
        console.error(`[ERROR] Failed to set vehicle mod:`, error);
        chat.sendToPlayer(player, `^1[Error] ^0An error occurred while applying the mod!`);
    }
});
// Save vehicle tuning event
mp.events.add('saveTuning', async (_player, plate)=>{
    if (!plate) return;
    try {
        const sanitizedPlate = plate.replace(/-/g, '');
        const vehicle = mp.vehicles.toArray().find((v)=>v.numberPlate.replace(/-/g, '') === sanitizedPlate
        );
        if (!vehicle) {
            return console.error(`[ERROR] Vehicle with plate ${sanitizedPlate} not found for tuning save`);
        }
        const mods = getMods(vehicle);
        await Vehicles.update({
            mods
        }, {
            where: {
                plate: sanitizedPlate
            }
        });
    } catch (error) {
        console.error(`[ERROR] Failed to save tuning for plate ${plate}:`, error);
    }
});
// Set vehicle secondary color event
mp.events.add('setVehSecondaryColor', async (player, r, g, b)=>{
    const vehicle = player.vehicle;
    if (!vehicle) return;
    try {
        // Validate RGB values
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));
        const primaryRGB = vehicle.getColorRGB(0) || [
            0,
            0,
            0
        ];
        vehicle.setColorRGB(primaryRGB[0], primaryRGB[1], primaryRGB[2], r, g, b);
        // Update DB
        const plate = vehicle.numberPlate.replace(/-/g, '');
        const mods = getMods(vehicle);
        await Vehicles.update({
            mods
        }, {
            where: {
                plate
            }
        });
    } catch (error) {
        console.error(`[ERROR] Failed to set vehicle secondary color:`, error);
    }
});
// Set vehicle primary color event
mp.events.add('setVehPrimaryColor', async (player, r, g, b)=>{
    const vehicle = player.vehicle;
    if (!vehicle) return;
    try {
        // Validate RGB values
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));
        const secondaryRGB = vehicle.getColorRGB(1) || [
            0,
            0,
            0
        ];
        vehicle.setColorRGB(r, g, b, secondaryRGB[0], secondaryRGB[1], secondaryRGB[2]);
        // Update DB
        const plate = vehicle.numberPlate.replace(/-/g, '');
        const mods = getMods(vehicle);
        await Vehicles.update({
            mods
        }, {
            where: {
                plate
            }
        });
    } catch (error) {
        console.error(`[ERROR] Failed to set vehicle primary color:`, error);
    }
});
// Function to reload blips for all players
async function reloadBlipsForAllPlayers() {
    try {
        const blips = await Blips.findAll();
        mp.players.forEach((p)=>{
            if (p && p.call) {
                p.call('mp:loadBlips', [
                    blips
                ]);
            }
        });
    } catch (error) {
        console.error(`[ERROR] Failed to reload blips:`, error);
    }
}
// Add blip to database event
mp.events.add('mp:addBlipToDb', async (_player, blipDataString)=>{
    try {
        const blipData = JSON.parse(blipDataString);
        // Validate blip data
        if (!blipData.name || typeof blipData.color !== 'number' || !blipData.pos || typeof blipData.sprite !== 'number' || typeof blipData.scale !== 'number') {
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
mp.events.addProc('getBlips', async ()=>{
    try {
        return await Blips.findAll();
    } catch (error) {
        console.error(`[ERROR] Failed to get blips:`, error);
        return [];
    }
});
// Set blip name event
mp.events.add('mp:setBlipName', async (_player, blipId, name)=>{
    try {
        const blip = await Blips.findByPk(blipId);
        if (!blip) return;
        await blip.update({
            name
        });
        await reloadBlipsForAllPlayers();
    } catch (error) {
        console.error(`[ERROR] Failed to set blip name:`, error);
    }
});
// Set blip color event
mp.events.add('mp:setBlipColor', async (_player, blipId, color)=>{
    try {
        const blip = await Blips.findByPk(blipId);
        if (!blip) return;
        await blip.update({
            color
        });
        await reloadBlipsForAllPlayers();
    } catch (error) {
        console.error(`[ERROR] Failed to set blip color:`, error);
    }
});
// Set blip sprite event
mp.events.add('mp:setBlipSprite', async (_player, blipId, sprite)=>{
    try {
        const blip = await Blips.findByPk(blipId);
        if (!blip) return;
        await blip.update({
            sprite
        });
        await reloadBlipsForAllPlayers();
    } catch (error) {
        console.error(`[ERROR] Failed to set blip sprite:`, error);
    }
});
// Set blip scale event
mp.events.add('mp:setBlipScale', async (_player, blipId, scale)=>{
    try {
        const blip = await Blips.findByPk(blipId);
        if (!blip) return;
        await blip.update({
            scale
        });
        await reloadBlipsForAllPlayers();
    } catch (error) {
        console.error(`[ERROR] Failed to set blip scale:`, error);
    }
});
// Set blip short range event
mp.events.add('mp:setBlipShortRange', async (_player, blipId, shortRange)=>{
    try {
        const blip = await Blips.findByPk(blipId);
        if (!blip) return;
        await blip.update({
            shortRange
        });
        await reloadBlipsForAllPlayers();
    } catch (error) {
        console.error(`[ERROR] Failed to set blip short range:`, error);
    }
});
// Set blip position event
mp.events.add('mp:setBlipPosition', async (_player, blipId, position)=>{
    try {
        const blip = await Blips.findByPk(blipId);
        if (!blip) return;
        await blip.update({
            position
        });
        await reloadBlipsForAllPlayers();
    } catch (error) {
        console.error(`[ERROR] Failed to set blip position:`, error);
    }
});
// Delete blip event
mp.events.add('mp:deleteBlip', async (_player, blipId)=>{
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
mp.events.add('mp:setBlipDimension', async (_player, blipId, dimension)=>{
    try {
        const blip = await Blips.findByPk(blipId);
        if (!blip) return;
        await blip.update({
            dimension
        });
        await reloadBlipsForAllPlayers();
    } catch (error) {
        console.error(`[ERROR] Failed to set blip dimension:`, error);
    }
});
// Check if player is a developer or regular player
mp.events.addProc('isDevOrPlayer', (player)=>{
    if (player.ip === '192.168.1.133') {
        // console.log('isDevOrPlayer', true)
        return 'True';
    } else {
        // console.log('isDevOrPlayer', false)
        return 'False';
    }
});

function getPlayerAppearance(player) {
    let component_ids = [
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
    let prop_ids = [
        0,
        1,
        2,
        6,
        7
    ];
    //0-19
    let face_features = [
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
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19
    ];
    let components = component_ids.map((componentId)=>{
        return {
            componentId: componentId,
            drawable: player.getClothes(componentId).drawable,
            texture: player.getClothes(componentId).texture,
            palette: player.getClothes(componentId).palette
        };
    });
    let props = prop_ids.map((propId)=>{
        return {
            propId: propId,
            drawable: player.getProp(propId).drawable,
            texture: player.getProp(propId).texture
        };
    });
    let headBlend = [
        player.getHeadBlend().shapes[0],
        player.getHeadBlend().shapes[1],
        player.getHeadBlend().shapes[2],
        player.getHeadBlend().skins[0],
        player.getHeadBlend().skins[1],
        player.getHeadBlend().skins[2],
        player.getHeadBlend().shapeMix,
        player.getHeadBlend().skinMix,
        player.getHeadBlend().thirdMix
    ];
    let faceFeatures = face_features.map((featureIndex)=>{
        return player.getFaceFeature(featureIndex);
    });
    //0-12
    let headOverlays = Array.from({
        length: 13
    }, (_, i)=>i
    ).map((overlayId)=>{
        return player.getHeadOverlay(overlayId);
    });
    let hairColor = player.hairColor;
    let hairHighlightColor = player.hairHighlightColor;
    return {
        components,
        props,
        headBlend,
        faceFeatures,
        headOverlays,
        hairColor,
        hairHighlightColor
    };
}
function setPlayerAppearance(player, appearance) {
    appearance.components.forEach((component)=>{
        player.setClothes(component.componentId, component.drawable, component.texture, component.palette);
    });
    appearance.props.forEach((prop)=>{
        player.setProp(prop.propId, prop.drawable, prop.texture);
    });
    // let headBlend = [
    //     player.getHeadBlend().shapes[0],
    //     player.getHeadBlend().shapes[1],
    //     player.getHeadBlend().shapes[2],
    //     player.getHeadBlend().skins[0],
    //     player.getHeadBlend().skins[1],
    //     player.getHeadBlend().skins[2],
    //     player.getHeadBlend().shapeMix,
    //     player.getHeadBlend().skinMix,
    //     player.getHeadBlend().thirdMix
    // ] as any;
    player.setHeadBlend(appearance.headBlend[0], appearance.headBlend[1], appearance.headBlend[2], appearance.headBlend[3], appearance.headBlend[4], appearance.headBlend[5], appearance.headBlend[6], appearance.headBlend[7], appearance.headBlend[8]);
    appearance.faceFeatures.forEach((value, index)=>{
        player.setFaceFeature(index, value);
    });
    appearance.headOverlays.forEach((overlay, index)=>{
        player.setHeadOverlay(index, overlay);
    });
    player.setHairColor(appearance.hairColor, appearance.hairHighlightColor);
}
mp.events.add('updateComponent', (player, componentId, drawable, texture)=>{
    player.setClothes(componentId, drawable, texture, 0);
});
mp.events.add('updateProp', (player, propId, drawable, texture)=>{
    player.setProp(propId, drawable, texture);
});
// mp.events.callRemote('createCharacter', model, lastName, firstName, age, height);
mp.events.add('createCharacter', (player, model, lastName, firstName, age, height)=>{
    //TODO: Save character data to database
    player.dimension = 0;
    let appearance = getPlayerAppearance(player);
    Account.update({
        character: {
            firstName,
            lastName,
            age,
            height,
            model,
            appearance
        }
    }, {
        where: {
            license: player.rgscId
        }
    });
    Core.players[player.rgscId].character = {
        firstName,
        lastName,
        age,
        height,
        model,
        appearance
    };
    setPlayerAppearance(player, appearance);
});
mp.events.add('updateFeature', (player, featureIndex, value)=>{
    player.setFaceFeature(featureIndex, value);
});
mp.events.add('updateAppearance', (player, overlayId, overlayVariation)=>{
    player.setHeadOverlay(overlayId, [
        overlayVariation,
        255,
        player.getHeadOverlay(overlayId)[2],
        player.getHeadOverlay(overlayId)[3]
    ]);
});
mp.events.add('updateColor', (player, overlayId, color)=>{
    player.setHeadOverlay(overlayId, [
        player.getHeadOverlay(overlayId)[0],
        player.getHeadOverlay(overlayId)[1],
        color,
        player.getHeadOverlay(overlayId)[3]
    ]);
});
mp.events.add('updateCharacterAppearance', (player, father, mother, similarity)=>{
    player.setHeadBlend(father, mother, 0, father, mother, 0, similarity, similarity, 0);
});
mp.events.add('setModel', (player, modelName)=>{
    player.model = mp.joaat(modelName);
});
mp.events.add('updateHairColor', (player, color)=>{
    player.setHairColor(color, color);
});
mp.events.add('setClothes', (player)=>{
    setPlayerAppearance(player, Core.players[player.rgscId].character.appearance);
});
mp.events.add('saveClothing', (player)=>{
    Core.players[player.rgscId].character.appearance = getPlayerAppearance(player);
    Account.update({
        character: Core.players[player.rgscId].character
    }, {
        where: {
            license: player.rgscId
        }
    });
});

mp.events.add('admin:createVehicleShop', async (player1, name, blip, blipColor)=>{
    VehicleShops.create({
        name,
        blip,
        blipColor,
        ped_pos: {
            x: 0,
            y: 0,
            z: 0,
            h: 0
        },
        veh_pos: {
            x: 0,
            y: 0,
            z: 0,
            h: 0
        },
        vehicles: [],
        testing_spots: []
    });
    chat.sendToAdmins(`^1[INFO] ^0${player1.name} created a vehicle shop with name ${name}`);
    let vehicleShops = await VehicleShops.findAll();
    mp.players.forEach(async (player)=>{
        //select all vehicle shops
        player.call('vehicleShops:load', [
            vehicleShops
        ]);
    });
});
mp.events.addProc('vehicleShops:fetch', async (_player)=>{
    let vehicleShops = VehicleShops.findAll();
    return vehicleShops;
});
mp.events.add('admin:setVehicleShopPedPos', async (player2, shopId, pos)=>{
    pos.h = player2.heading;
    let shop = await VehicleShops.findOne({
        where: {
            id: shopId
        }
    });
    if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
    shop.ped_pos = pos;
    await shop.save();
    let vehicleShops = await VehicleShops.findAll();
    mp.players.forEach(async (player)=>{
        //select all vehicle shops
        player.call('vehicleShops:load', [
            vehicleShops
        ]);
    });
    chat.sendToAdmins(`^1[INFO] ^0${player2.name} set ped pos for vehicle shop ${shop.name}`);
});
//setVehicleShopVehPos
mp.events.add('admin:setVehicleShopVehPos', async (player3, shopId, pos)=>{
    console.log(JSON.stringify(pos));
    pos.h = player3.heading;
    let shop = await VehicleShops.findOne({
        where: {
            id: shopId
        }
    });
    if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
    shop.veh_pos = pos;
    await shop.save();
    //load all vehicle shops
    let vehicleShops = await VehicleShops.findAll();
    mp.players.forEach(async (player)=>{
        //select all vehicle shops
        player.call('vehicleShops:load', [
            vehicleShops
        ]);
    });
    chat.sendToAdmins(`^1[INFO] ^0${player3.name} set veh pos for vehicle shop ${shop.name}`);
});
mp.events.add('admin:setVehicleShopBlipColor', async (player4, shopId, color)=>{
    let shop = await VehicleShops.findOne({
        where: {
            id: shopId
        }
    });
    if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
    shop.blipColor = color;
    await shop.save();
    //load all vehicle shops
    let vehicleShops = await VehicleShops.findAll();
    mp.players.forEach(async (player)=>{
        //select all vehicle shops
        player.call('vehicleShops:load', [
            vehicleShops
        ]);
    });
    chat.sendToAdmins(`^1[INFO] ^0${player4.name} set blip color for vehicle shop ${shop.name}`);
});
//setVehicleShopBlip
mp.events.add('admin:setVehicleShopBlip', async (player5, shopId, blip)=>{
    let shop = await VehicleShops.findOne({
        where: {
            id: shopId
        }
    });
    if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
    shop.blip = blip;
    await shop.save();
    //load all vehicle shops
    let vehicleShops = await VehicleShops.findAll();
    mp.players.forEach(async (player)=>{
        //select all vehicle shops
        player.call('vehicleShops:load', [
            vehicleShops
        ]);
    });
    chat.sendToAdmins(`^1[INFO] ^0${player5.name} set blip for vehicle shop ${shop.name}`);
});
//admin:setVehicleShopName
mp.events.add('admin:setVehicleShopName', async (player6, shopId, name)=>{
    let shop = await VehicleShops.findOne({
        where: {
            id: shopId
        }
    });
    if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
    shop.name = name;
    await shop.save();
    //load all vehicle shops
    let vehicleShops = await VehicleShops.findAll();
    mp.players.forEach(async (player)=>{
        //select all vehicle shops
        player.call('vehicleShops:load', [
            vehicleShops
        ]);
    });
    chat.sendToAdmins(`^1[INFO] ^0${player6.name} set name for vehicle shop ${shop.name}`);
});
//admin:addVehicleShopTestingSpot
mp.events.add('admin:addVehicleShopTestingSpot', async (player7, shopId, _pos)=>{
    let shop = await VehicleShops.findOne({
        where: {
            id: shopId
        }
    });
    if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
    shop.testing_spots.push({
        x: player7.position.x,
        y: player7.position.y,
        z: player7.position.z,
        h: player7.heading
    });
    await VehicleShops.update({
        testing_spots: shop.testing_spots
    }, {
        where: {
            id: shopId
        }
    });
    //load all vehicle shops
    let vehicleShops = await VehicleShops.findAll();
    mp.players.forEach(async (player)=>{
        //select all vehicle shops
        player.call('vehicleShops:load', [
            vehicleShops
        ]);
    });
    chat.sendToAdmins(`^1[INFO] ^0${player7.name} added testing spot for vehicle shop ${shop.name}`);
});
// mp.events.callRemote(
//     'admin:addVehicleShopVehicle',
//     shop.id,
//     model,
//     name,
//     price,
//     stock,
//     category
// );
mp.events.add('admin:addVehicleShopVehicle', async (player8, shopId, model, name, price, stock, category)=>{
    console.log(`${shopId} ${model} ${name} ${price} ${stock} ${category}`);
    let shop = await VehicleShops.findOne({
        where: {
            id: shopId
        }
    });
    if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
    let existingVehicle = shop.vehicles.find((v)=>v.model === model
    );
    if (existingVehicle) {
        existingVehicle.stock += stock;
    } else {
        shop.vehicles.push({
            model,
            name,
            price,
            stock,
            category
        });
    }
    await VehicleShops.update({
        vehicles: shop.vehicles
    }, {
        where: {
            id: shopId
        }
    });
    console.log(shop.vehicles);
    // Load all vehicle shops
    let vehicleShops = await VehicleShops.findAll();
    mp.players.forEach(async (player)=>{
        player.call('vehicleShops:load', [
            vehicleShops
        ]);
    });
    chat.sendToAdmins(`^1[INFO] ^0${player8.name} ${existingVehicle ? 'updated stock for' : 'added'} vehicle ${name} in vehicle shop ${shop.name}`);
});
mp.events.add('vehicleShops:buy', async (player, vehicle, shopId)=>{
    vehicle = JSON.parse(vehicle);
    //vehicle is a object with name, model and price
    let shop = await VehicleShops.findOne({
        where: {
            id: shopId
        }
    });
    if (!shop) return chat.sendToPlayer(player, `^2[ERROR]^0 Vehicle shop with id ${shopId} not found`);
    let vehicleIndex = shop.vehicles.findIndex((v)=>v.name == vehicle.name
    );
    if (vehicleIndex == -1) return chat.sendToPlayer(player, `^2[ERROR]^0 Vehicle ${vehicle.name} not found in shop ${shop.name}`);
    if (shop.vehicles[vehicleIndex].stock <= 0) return chat.sendToPlayer(player, `^2[ERROR]^0 Vehicle ${vehicle.name} is out of stock`);
    const Player = Core.GetPlayerData(player);
    //prevent owning more than 1 vehicle with the same model
    let owned1 = await Vehicles.findAll({
        where: {
            owner: player.rgscId
        }
    });
    if (owned1.find((v)=>v.model == vehicle.model
    )) return chat.sendToPlayer(player, `^2[ERROR]^0 You already own a vehicle with the same model.`);
    if (Player.cash < vehicle.price) return chat.sendToPlayer(player, `^2[ERROR]^0 You don't have enough money`);
    shop.vehicles[vehicleIndex].stock--;
    await VehicleShops.update({
        vehicles: shop.vehicles
    }, {
        where: {
            id: shopId
        }
    });
    Player.cash = Player.cash - vehicle.price;
    Account.update({
        cash: Player.cash
    }, {
        where: {
            id: player.id
        }
    });
    Core.players[player.rgscId].cash = Player.cash;
    async function findUniquePlate() {
        //plate format should be R + 5 numbers
        let owned = await Vehicles.findAll({
            where: {
                owner: player.rgscId
            }
        });
        let plate = `R${Math.floor(Math.random() * 10000)}`;
        do {
            plate = `R${Math.floor(Math.random() * 10000)}`;
        }while (owned.find((v)=>v.plate == plate
        ))
        return plate;
    }
    await Vehicles.create({
        owner: player.rgscId,
        model: vehicle.model,
        label: vehicle.name,
        mods: [],
        plate: await findUniquePlate(),
        position: []
    });
    chat.sendToPlayer(player, `^2[INFO]^0 You bought vehicle ${vehicle.name} for $${Core.formatNumber(vehicle.price)}`);
});
mp.events.addProc('getPlayerVehicles', async (player)=>{
    let vehicles = await Vehicles.findAll({
        where: {
            owner: player.rgscId
        }
    });
    return vehicles;
});
mp.events.add('spawnVehicle', (player, model, plate)=>{
    if (!mp.vehicles.toArray().find((v)=>v.numberPlate.replace(/\s/g, '') == plate.replace(/\s/g, '')
    )) {
        let spawnPosition = {
            x: player.position.x + 2,
            y: player.position.y,
            z: player.position.z
        };
        let vehicle = mp.vehicles.new(model, new mp.Vector3(spawnPosition.x, spawnPosition.y, spawnPosition.z), {
            numberPlate: plate,
            dimension: player.dimension
        });
        setTimeout(async ()=>{
            setMods(vehicle, await getModsFromDb(plate));
            player.putIntoVehicle(vehicle, 0);
        }, 500);
    } else {
        player.outputChatBox(`^1[ERROR] ^0You already have a vehicle with this plate`);
    }
});
//deleteVehicle
mp.events.add('deleteVehicle', async (player, plate)=>{
    let vehicle = await Vehicles.findOne({
        where: {
            plate
        }
    });
    if (!vehicle) return chat.sendToPlayer(player, `^2[ERROR]^0 Vehicle with plate ${plate} not found`);
    vehicle.destroy();
});
mp.events.add('removeMoney', (player, amount)=>{
    let Player = Core.GetPlayerData(player);
    Player.cash = Player.cash - parseInt(amount);
    Account.update({
        cash: Player.cash
    }, {
        where: {
            id: player.id
        }
    });
    Core.players[player.id].cash = Player.cash;
    chat.sendToPlayer(player, `^2[INFO]^0 You removed $${Core.formatNumber(amount)} from your account`);
});

let ServerSoundEmitters = {
};
let emitterIdCounter = 1;
let emitterIntervals = {
};
mp.events.add('audio:registerEmitterForAllPlayers', async (player, url, inVehicle)=>{
    for(const emitterId in ServerSoundEmitters){
        if (ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
            mp.players.forEach((_player)=>{
                _player.call('audio:removeEmitter', [
                    parseInt(emitterId)
                ]);
            });
            if (emitterIntervals[emitterId]) {
                clearInterval(emitterIntervals[emitterId]);
                delete emitterIntervals[emitterId];
            }
            delete ServerSoundEmitters[emitterId];
            console.log(`[SERVER AUDIO] Player ${player.name} had an active emitter ${emitterId}, removed it to register new one.`);
        }
    }
    const emitterId1 = emitterIdCounter++;
    const emitterData = {
        id: emitterId1,
        ownerRgscId: player.rgscId,
        url: url,
        vol: 1,
        maxVol: 1,
        range: 50,
        type: inVehicle ? 'vehicle' : 'static',
        position: inVehicle ? undefined : player.position,
        plate: inVehicle ? player.vehicle.id : undefined,
        startTime: Date.now()
    };
    ServerSoundEmitters[emitterId1] = emitterData;
    console.log(`[SERVER AUDIO] Registered new emitter ${emitterId1} for player ${player.name} (RGSC ID: ${player.rgscId}), URL: ${url}, Type: ${emitterData.type}`);
    if (inVehicle) {
        ServerSoundEmitters[emitterId1].plate = player.vehicle.id;
        try {
            emitterIntervals[emitterId1] = setInterval(()=>{
                let vehicle = mp.vehicles.toArray().find((v)=>v.id === ServerSoundEmitters[emitterId1].plate
                );
                if (!mp.vehicles.exists(vehicle)) {
                    mp.players.forEach((_player)=>{
                        _player.call('audio:removeEmitter', [
                            emitterId1
                        ]);
                    });
                    clearInterval(emitterIntervals[emitterId1]);
                    delete emitterIntervals[emitterId1];
                    delete ServerSoundEmitters[emitterId1];
                    console.log(`[SERVER AUDIO] Vehicle for emitter ${emitterId1} disappeared, emitter removed.`);
                }
            }, 1000);
        } catch (e) {
            console.error('Error in interval check:', e);
        }
    }
    mp.players.forEach((_player)=>{
        _player.call('audio:registerEmitter', [
            JSON.stringify(emitterData)
        ]);
        console.log(`[SERVER AUDIO] Sent audio:registerEmitter for emitter ${emitterId1} to player ${_player.name} (RGSC ID: ${_player.rgscId})`);
    });
});
mp.events.add('playerQuit', (player)=>{
    for(const emitterId in ServerSoundEmitters){
        if (ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
            mp.players.forEach((_player)=>{
                _player.call('audio:removeEmitter', [
                    parseInt(emitterId)
                ]);
            });
            if (emitterIntervals[emitterId]) {
                clearInterval(emitterIntervals[emitterId]);
                delete emitterIntervals[emitterId];
            }
            delete ServerSoundEmitters[emitterId];
            console.log(`[SERVER AUDIO] Player ${player.name} quit, removed emitter ${emitterId}.`);
        }
    }
});
mp.events.add('audio:removeEmitter', (player, emitterId)=>{
    if (ServerSoundEmitters[emitterId] && ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
        mp.players.forEach((_player)=>{
            _player.call('audio:removeEmitter', [
                emitterId
            ]);
        });
        if (emitterIntervals[emitterId]) {
            clearInterval(emitterIntervals[emitterId]);
            delete emitterIntervals[emitterId];
        }
        delete ServerSoundEmitters[emitterId];
        console.log(`[SERVER AUDIO] Emitter ${emitterId} removed by player ${player.name}.`);
    } else {
        console.warn(`[SERVER AUDIO] Player ${player.name} tried to remove emitter ${emitterId}, but is not the owner or emitter not found.`);
    }
});
mp.events.add('audio:setVolume', (player, emitterId, maxVol)=>{
    if (ServerSoundEmitters[emitterId] && ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
        ServerSoundEmitters[emitterId].maxVol = maxVol;
        mp.players.forEach((_player)=>{
            _player.call('audio:updateEmitter', [
                JSON.stringify(ServerSoundEmitters[emitterId])
            ]);
        });
        console.log(`[SERVER AUDIO] Emitter ${emitterId} maxVol set to ${maxVol} by player ${player.name}.`);
    } else {
        console.warn(`[SERVER AUDIO] Player ${player.name} tried to set volume for emitter ${emitterId}, but is not the owner or emitter not found.`);
    }
});
mp.events.add('audio:changeUrl', (player, emitterId, url)=>{
    if (ServerSoundEmitters[emitterId] && ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
        if (!url) return;
        let isValidYoutubeUrl = url.match(/^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/);
        let isPlaylist = url.match(/[?&]list=/);
        if (!isValidYoutubeUrl) return;
        if (isPlaylist) return;
        ServerSoundEmitters[emitterId].url = url;
        ServerSoundEmitters[emitterId].startTime = Date.now();
        mp.players.forEach((_player)=>{
            _player.call('audio:updateEmitter', [
                JSON.stringify(ServerSoundEmitters[emitterId])
            ]);
        });
        console.log(`[SERVER AUDIO] Emitter ${emitterId} URL changed to ${url} by player ${player.name}.`);
    } else {
        console.warn(`[SERVER AUDIO] Player ${player.name} tried to change URL for emitter ${emitterId}, but is not the owner or emitter not found.`);
    }
});
mp.events.add('audio:requestAllEmitters', (player)=>{
    for(const emitterId in ServerSoundEmitters){
        player.call('audio:registerEmitter', [
            JSON.stringify(ServerSoundEmitters[emitterId])
        ]);
    }
    console.log(`[SERVER AUDIO] Sent all emitters to player ${player.name} on request.`);
});
//setRange
mp.events.add('audio:setRange', (player, emitterId, range)=>{
    if (ServerSoundEmitters[emitterId] && ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
        ServerSoundEmitters[emitterId].range = range;
        mp.players.forEach((_player)=>{
            _player.call('audio:updateEmitter', [
                JSON.stringify(ServerSoundEmitters[emitterId])
            ]);
        });
        console.log(`[SERVER AUDIO] Emitter ${emitterId} range set to ${range} by player ${player.name}.`);
    } else {
        console.warn(`[SERVER AUDIO] Player ${player.name} tried to set range for emitter ${emitterId}, but is not the owner or emitter not found.`);
    }
});
