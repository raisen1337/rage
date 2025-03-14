import { chat } from "@/chat";
import { DrawInteract } from "@/interact";
import { addMenuItem, Menu, MENU_OPEN, Notify, playerData, showMenu } from "@/main";

// --- Vehicle Mods Data and Logic ---
let vehicleModsData: any = null;
let currentVehicle: any = null;
let previewMod: { modType: string, modOption: any } | null = null; // Store the mod being previewed
let originalMods: { [key: string]: number } = {}; // Store original mods before tuning
let lastPaidMods: { [key: string]: number } = {}; // Store last paid mods

// --- Pricing Data ---
const modPrices = {
    "Spoilers": { default: 500 },
    "Front Bumper": { default: 750 },
    "Rear Bumper": { default: 750 },
    "Side Skirt": { default: 600 },
    "Exhaust": { default: 800 },
    "Frame": { default: 400 },
    "Grille": { default: 550 },
    "Hood": { default: 900 },
    "Fender": { default: 650 },
    "Right Fender": { default: 650 },
    "Roof": { default: 700 },
    "Engine": {
        "EMS Upgrade, Level 1": 1500,
        "EMS Upgrade, Level 2": 2500,
        "EMS Upgrade, Level 3": 3500,
        "EMS Upgrade, Level 4": 5000,
    },
    "Brakes": {
        "Street Brakes": 1200,
        "Sport Brakes": 1800,
        "Race Brakes": 2500,
    },
    "Transmission": {
        "Street Transmission": 1400,
        "Sports Transmission": 2000,
        "Race Transmission": 3000,
    },
    "Horns": { default: 200 },
    "Suspension": {
        "Lowered Suspension": 1000,
        "Street Suspension": 1600,
        "Sport Suspension": 2200,
        "Competition Suspension": 3200,
    },
    "Armor": {
        "Armor Upgrade 20%": 2000,
        "Armor Upgrade 40%": 3500,
        "Armor Upgrade 60%": 5000,
        "Armor Upgrade 80%": 7000,
        "Armor Upgrade 100%": 10000,
    },
    "Turbo": { "Turbo Tuning": 4000 },
    "Xenon": { "Xenon Lights": 1000 },
    "Front Wheels": { default: 1500 },
    "Back Wheels": { default: 1500 },
    "Plate": { default: 300 },
    "Livery": { default: 400 }
    // Add prices for other mods as needed.  Use "default" for a general price.
} as any;

// --- Function to get the price of a mod ---
function getModPrice(modName: string, indexName: string): number {
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
function chargePlayer(amount: any): boolean {
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
        "0": { name: "Spoilers", indexes: [] },
        "1": { name: "Front Bumper", indexes: [] },
        "2": { name: "Rear Bumper", indexes: [] },
        "3": { name: "Side Skirt", indexes: [] },
        "4": { name: "Exhaust", indexes: [] },
        "5": { name: "Frame", indexes: [] },
        "6": { name: "Grille", indexes: [] },
        "7": { name: "Hood", indexes: [] },
        "8": { name: "Fender", indexes: [] },
        "9": { name: "Right Fender", indexes: [] },
        "10": { name: "Roof", indexes: [] },
        "11": {
            name: "Engine",
            indexes: [
                { index: -1, name: "Stock" },
                { index: 0, name: "EMS Upgrade, Level 1" },
                { index: 1, name: "EMS Upgrade, Level 2" },
                { index: 2, name: "EMS Upgrade, Level 3" },
                { index: 3, name: "EMS Upgrade, Level 4" }
            ]
        },
        "12": {
            name: "Brakes",
            indexes: [
                { index: -1, name: "Stock" },
                { index: 0, name: "Street Brakes" },
                { index: 1, name: "Sport Brakes" },
                { index: 2, name: "Race Brakes" }
            ]
        },
        "13": {
            name: "Transmission",
            indexes: [
                { index: -1, name: "Stock" },
                { index: 0, name: "Street Transmission" },
                { index: 1, name: "Sports Transmission" },
                { index: 2, name: "Race Transmission" }
            ]
        },
        "14": {
            name: "Horns",
            indexes: [
                { index: -1, name: "Stock Horn" },
                { index: 0, name: "Truck Horn" },
                { index: 1, name: "Police Horn" },
                { index: 2, name: "Clown Horn" },
                { index: 3, name: "Musical Horn 1" },
                { index: 4, name: "Musical Horn 2" },
                { index: 5, name: "Musical Horn 3" },
                { index: 6, name: "Musical Horn 4" },
                { index: 7, name: "Musical Horn 5" },
                { index: 8, name: "Sad Trombone" },
                { index: 9, name: "Classical Horn 1" },
                { index: 10, name: "Classical Horn 2" },
                { index: 11, name: "Classical Horn 3" },
                { index: 12, name: "Classical Horn 4" },
                { index: 13, name: "Classical Horn 5" },
                { index: 14, name: "Classical Horn 6" },
                { index: 15, name: "Classical Horn 7" },
                { index: 16, name: "Scale - Do" },
                { index: 17, name: "Scale - Re" },
                { index: 18, name: "Scale - Mi" },
                { index: 19, name: "Scale - Fa" },
                { index: 20, name: "Scale - Sol" },
                { index: 21, name: "Scale - La" },
                { index: 22, name: "Scale - Ti" },
                { index: 23, name: "Scale - Do" },
                { index: 24, name: "Jazz Horn 1" },
                { index: 25, name: "Jazz Horn 2" },
                { index: 26, name: "Jazz Horn 3" },
                { index: 27, name: "Jazz Horn Loop" },
                { index: 28, name: "Star Spangled Banner 1" },
                { index: 29, name: "Star Spangled Banner 2" },
                { index: 30, name: "Star Spangled Banner 3" },
                { index: 31, name: "Star Spangled Banner 4" },
                { index: 32, name: "Classical Horn 8 Loop" },
                { index: 33, name: "Classical Horn 9 Loop" },
                { index: 34, name: "Classical Horn 10 Loop" }
            ]
        },
        "15": {
            name: "Suspension",
            indexes: [
                { index: -1, name: "Stock" },
                { index: 0, name: "Lowered Suspension" },
                { index: 1, name: "Street Suspension" },
                { index: 2, name: "Sport Suspension" },
                { index: 3, name: "Competition Suspension" }
            ]
        },
        "16": {
            name: "Armor",
            indexes: [
                { index: -1, name: "None" },
                { index: 0, name: "Armor Upgrade 20%" },
                { index: 1, name: "Armor Upgrade 40%" },
                { index: 2, name: "Armor Upgrade 60%" },
                { index: 3, name: "Armor Upgrade 80%" },
                { index: 4, name: "Armor Upgrade 100%" }
            ]
        },
        "18": { name: "Turbo", indexes: [{ index: -1, name: "None" }, { index: 0, name: "Turbo Tuning" }] },
        "22": { name: "Xenon", indexes: [{ index: -1, name: "None" }, { index: 0, name: "Xenon Lights" }] },
        "23": { name: "Front Wheels", indexes: [] },
        "24": { name: "Back Wheels", indexes: [] },
        "25": { name: "Plate holders", indexes: [] },
        "26": { name: "Vanity Plates", indexes: [] },
        "27": { name: "Trim", indexes: [] },
        "28": { name: "Ornaments", indexes: [] },
        "29": { name: "Dashboard", indexes: [] },
        "30": { name: "Dial", indexes: [] },
        "31": { name: "Door Speaker", indexes: [] },
        "32": { name: "Seats", indexes: [] },
        "33": { name: "Steering wheels", indexes: [] },
        "34": { name: "Shifter Leavers", indexes: [] },
        "35": { name: "Plaques", indexes: [] },
        "36": { name: "Speakers", indexes: [] },
        "37": { name: "Trunk", indexes: [] },
        "38": { name: "Hydraulics", indexes: [] },
        "39": { name: "Engine Block", indexes: [] },
        "40": { name: "Air filter", indexes: [] },
        "41": { name: "Struts", indexes: [] },
        "42": { name: "Arch Cover", indexes: [] },
        "43": { name: "Aerials", indexes: [] },
        "44": { name: "Trim", indexes: [] },
        "45": { name: "Tank", indexes: [] },
        "46": { name: "Windows", indexes: [] },
        "47": { name: "Unknown", indexes: [] },
        "48": { name: "Livery", indexes: [] },
        "53": {
            name: "Plate",
            indexes: [
                { index: 0, name: "Blue on White 1" },
                { index: 1, name: "Blue on White 2" },
                { index: 2, name: "Blue on White 3" },
                { index: 3, name: "Yellow on Black" },
                { index: 4, name: "Yellow on Blue" },
                { index: 5, name: "North Yankton" }
            ]
        },
        "55": { name: "Window Tint", indexes: [] },
        "66": { name: "Color 1", indexes: [] },
        "67": { name: "Color 2", indexes: [] }
    } as any;

    // Iterate through the vehicleMods object.
    for (const modType in vehicleMods) {
        if (vehicleMods.hasOwnProperty(modType)) {
            const mod = vehicleMods[modType];

            // If the mod has a name and an empty indexes array, try to populate it.
            if (mod.name && mod.indexes.length === 0) {
                // Get the number of mods for this type from RAGE MP.
                const vehicle = mp.players.local.vehicle;
                if (!vehicle) return vehicleMods; // If no vehicle, return
                const numMods = mp.game.vehicle.getNumMods(vehicle.handle, parseInt(modType));
                // Add "None" option
                mod.indexes.push({ index: -1, name: "None" });
                // Populate the indexes array with placeholder names.
                for (let i = 0; i < numMods; i++) {
                    mod.indexes.push({ index: i, name: `${mod.name} ${i + 1}` });
                }
            }
        }
    }

    return vehicleMods;
}

function setModByIndexName(vehicle: VehicleMp, modName: any, indexName: any) {
    if (!vehicle) {
        console.warn("setModByIndexName called with no vehicle.");
        return;
    }

    if (!vehicleModsData) {
        console.warn("Mods not loaded.  Enter and exit the vehicle to load them.");
        return;
    }

    for (const modType in vehicleModsData) {
        if (vehicleModsData.hasOwnProperty(modType)) {
            const mod = vehicleModsData[modType];
            if (mod.name === modName) {
                const indexObject = mod.indexes.find((item: any) => item.name === indexName);
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
    for (const modType in vehicleModsData) {
        if (vehicleModsData.hasOwnProperty(modType)) {
            const mod = vehicleModsData[modType];
            if (mod.indexes.length === 1) {
                delete vehicleModsData[modType];
            }
        }
    }

    let mainMenu = Menu('Vehicle Mods', 'Customize your vehicle', []) as any;

    // --- Create Main Menu Items ---
    for (const modTypeId in vehicleModsData) {
        if (vehicleModsData.hasOwnProperty(modTypeId)) {
            const modType = vehicleModsData[modTypeId];

            addMenuItem(mainMenu.id, {
                text: modType.name,
                subtext: `Select ${modType.name} Option`,
                type: "default",
                cb: () => { // Define the callback directly here
                    createSubMenu(mainMenu.id, modType, modTypeId);
                },
                icon: 'fas fa-wrench',
            });
        }
    }

    addMenuItem(mainMenu.id, {
        text: "Primary Color",
        subtext: "Select primary color",
        icon: "fas fa-palette",
        type: "colorpicker",
        value: "#FF0000", // Initial color (optional, defaults to red)
        cb: (color: any) => {
            mp.events.call("vehSetColor", color);
        }
    });

    addMenuItem(mainMenu.id, {
        text: "Secondary Color",
        subtext: "Select secondary color",
        icon: "fas fa-palette",
        type: "colorpicker",
        value: "#FF0000", // Initial color (optional, defaults to red)
        cb: (color: any) => {
            mp.events.call("vehSetColor", color);
        }
    });

    showMenu(mainMenu.id);
}

mp.events.add('closeMenus', () => {
    const vehicle = mp.players.local.vehicle;
    if (vehicle) {
        restoreLastPaidMods(vehicle);
    }
})

function createSubMenu(parentMenuId: number, modType: any, modTypeId: string) {
    let subMenu = Menu(modType.name, `Select ${modType.name} Option`, []) as any;

    // --- Create Submenu Items ---
    for (const modOption of modType.indexes) {
        const price = getModPrice(modType.name, modOption.name);
        const priceText = price > 0 ? ` ($${price})` : "";
        addMenuItem(subMenu.id, {
            text: modOption.name + priceText,
            subtext: `Set ${modType.name} to ${modOption.name}`,
            type: "default",
            cb: () => { // Define the callback directly here
                const vehicle = mp.players.local.vehicle;
                if (previewMod && previewMod.modType === modType.name && previewMod.modOption.name === modOption.name) {
                    // Confirm purchase
                    const price = getModPrice(modType.name, modOption.name);
                    if (price > 0) {
                        if (!chargePlayer(price)) {
                            Notify('error', 'Tuning', 'Nu ai suficienti bani.', 5000)
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
                    previewMod = { modType: modType.name, modOption: modOption };
                    previewVehicleMod(vehicle, modType.name, modOption.name);
                }
            },
            icon: 'fas fa-check',
        });
    }
    showMenu(subMenu.id);
}

function previewVehicleMod(vehicle: VehicleMp, modName: string, indexName: string) {
    setModByIndexName(vehicle, modName, indexName);
    Notify('info', 'Tuning', 'Apasati din nou pentru a cumpara.', 5000)
}

function setFinalMod(vehicle: VehicleMp, modName: string, indexName: string, modTypeId: string, price: number) {
    if (!vehicle) {
        console.warn("setModByIndexName called with no vehicle.");
        return;
    }

    if (!vehicleModsData) {
        console.warn("Mods not loaded.  Enter and exit the vehicle to load them.");
        return;
    }

    for (const modType in vehicleModsData) {
        if (vehicleModsData.hasOwnProperty(modType)) {
            const mod = vehicleModsData[modType];
            if (mod.name === modName) {
                const indexObject = mod.indexes.find((item: any) => item.name === indexName);
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

function resetPreview(vehicle: VehicleMp) {
    previewMod = null;
    restoreOriginalMods(vehicle);
}

function storeOriginalMods(vehicle: VehicleMp) {
    originalMods = {};
    if (!vehicle || !vehicleModsData) return;

    for (const modType in vehicleModsData) {
        if (vehicleModsData.hasOwnProperty(modType)) {
            originalMods[modType] = vehicle.getMod(parseInt(modType));
        }
    }
}

function restoreOriginalMods(vehicle: VehicleMp) {
    if (!vehicle || !originalMods) return;

    for (const modType in originalMods) {
        if (originalMods.hasOwnProperty(modType)) {
            vehicle.setMod(parseInt(modType), originalMods[modType]);
        }
    }
}

function storeLastPaidMods(vehicle: VehicleMp) {
    lastPaidMods = {};
    if (!vehicle || !vehicleModsData) return;

    for (const modType in vehicleModsData) {
        if (vehicleModsData.hasOwnProperty(modType)) {
            lastPaidMods[modType] = vehicle.getMod(parseInt(modType));
        }
    }
}

function restoreLastPaidMods(vehicle: VehicleMp) {
    if (!vehicle || !lastPaidMods) return;

    for (const modType in lastPaidMods) {
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
mp.events.add('playerEnterVehicle', async (vehicle, seat) => {
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
mp.events.add('playerExitVehicle', (vehicle) => {
    if (vehicle == currentVehicle) {
        currentVehicle = null;
        vehicleModsData = null;
        resetPreview(vehicle);
    }
});

mp.events.add("vehSetColor", (rgbaString: string) => {
    const vehicle = mp.players.local.vehicle;
    if (!vehicle) {
        console.warn("vehSetColor called with no vehicle.");
        return;
    }

    //rgba(255,0,0,255)
    const rgba = rgbaString.substring(5, rgbaString.length - 1).split(',').map((x) => parseInt(x));

    vehicle.setCustomPrimaryColour(rgba[0], rgba[1], rgba[2]);
    vehicle.setCustomSecondaryColour(rgba[0], rgba[1], rgba[2]);
})

mp.events.add('changeSecondaryColor', (rgbaString: any) => {
    const vehicle = mp.players.local.vehicle;
    if (!vehicle) {
        console.warn("changeSecondaryColor called with no vehicle.");
        return;
    }

    const rgba = rgbaString.substring(5, rgbaString.length - 1).split(',').map((x: any) => parseInt(x));
    vehicle.setCustomSecondaryColour(rgba[0], rgba[1], rgba[2]);

    mp.events.callRemote('setVehSecondaryColor', rgba[0], rgba[1], rgba[2]);
})

mp.events.add('changePrimaryColor', (rgbaString: any) => {
    const vehicle = mp.players.local.vehicle;
    if (!vehicle) {
        console.warn("changePrimaryColor called with no vehicle.");
        return;
    }
    const rgba = rgbaString.substring(5, rgbaString.length - 1).split(',').map((x: any) => parseInt(x));
    vehicle.setCustomPrimaryColour(rgba[0], rgba[1], rgba[2]);
    mp.events.callRemote('setVehPrimaryColor', rgba[0], rgba[1], rgba[2]);

})

mp.events.add('mouseShowCursor', (show: boolean) => {
    mp.gui.cursor.visible = show;
    mp.gui.cursor.show(show, show);
})

mp.events.add('render', () => {
    let interactPos = { "x": -1613.3692626953125, "y": -831.2616577148438, "z": 10.065536499023438, "h": 47.35538101196289 }
    let dist = mp.game.system.vdist(interactPos.x, interactPos.y, interactPos.z, mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z);
    if (dist < 5 && mp.players.local.vehicle != null) {
        DrawInteract("E", "Vehicle Tuning", "Open tuning menu", new mp.Vector3(interactPos.x, interactPos.y, interactPos.z));
        if (mp.keys.isDown(0x45) && !MENU_OPEN && !chat.on) {
            createVehicleModMenu();
        }
    }

})

// chat.registerCommand('vehmods', (args: string[]) => {
//     createVehicleModMenu();

// }, 'Open the vehicle mods menu', '/vehmods', 0);