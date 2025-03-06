import { chat } from '@/chat';
import { Dialog, DIALOG_OPEN, MENU_OPEN, playerData, setNuiFocus, Wait } from '@/main';



let drops = [] as any[];

mp.events.add('inventory:updateDrops', (data: any) => {
	drops = data;
});

let invCar = null as any;

mp.events.add('corefx:playerReady', async () => {
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

export let INV_OPEN = false;


//register keybind on I key
mp.keys.bind(0x49, true, async () => {
    if(chat.on) return;
    if(INV_OPEN) return;
    if(DIALOG_OPEN) return;
	if(MENU_OPEN) return;
    INV_OPEN = true;
	setNuiFocus(true, true);
	
	let playerInventory = await mp.events.callRemoteProc('inventory:getPlayerInventory');
	let isInVehicle = mp.players.local.vehicle !== null;
	if(isInVehicle){
		let vehicleInventory = await mp.events.callRemoteProc('getVehicleInventory', mp.players.local.vehicle.getNumberPlateText().replace(/\s/g, ''));
		if(vehicleInventory.success !== false){
			vehicleInventory.inventory.data = {
				type: 'vehicle',
				identifier: `${vehicleInventory.inventory.identifier}`,
			}
			chat.browser.call('openInventory', playerInventory, vehicleInventory.inventory);
		}else{
			chat.browser.call('openInventory', playerInventory, false);
		}
	}else{
		let closestVehicle = await mp.events.callRemoteProc('getClosestVehicleInventory');
		if(closestVehicle.success !== false){
			
			//open trunk
			//find closest vehicle by plate (identiifer)
			mp.vehicles.forEach((vehicle) => {
				if(vehicle.getNumberPlateText().replace(/\s/g, '') === closestVehicle.inventory.identifier){
					let trunkBoneIndex = vehicle.getBoneIndexByName('boot');
					let trunkPos = vehicle.getWorldPositionOfBone(trunkBoneIndex);
					let isNearTrunk = mp.game.system.vdist(mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z, trunkPos.x, trunkPos.y, trunkPos.z) < 1.7;
					if(isNearTrunk){
						vehicle.setDoorOpen(5, false, false);
						invCar = vehicle;
						closestVehicle.inventory.data = {
							type: 'vehicle',
							identifier: closestVehicle.inventory.identifier,
						}
						chat.browser.call('openInventory', playerInventory, closestVehicle.inventory);
					}else{
						chat.browser.call('openInventory', playerInventory, false);
					}
				}
			})
		}else{
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
mp.events.add("inventory:close", () => {
	setNuiFocus(false, false);
	
	mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
	if(invCar && mp.vehicles.exists(invCar)){
		invCar.setDoorShut(5, false);
	}
	invCar = null;
    setTimeout(() => {
        INV_OPEN = false;
		mp.gui.cursor.visible = false;
   		mp.gui.cursor.show(false, false);
    }, 500);
})

mp.events.add('inventory:moveItem', async (from: any, to: any) => {
    let newInv = await mp.events.callRemoteProc('inventory:moveItem', from, to);
    chat.browser.call('updatePlayerInventory', newInv);
})
// mp.trigger('inventory:moveItemToSecondary', draggedFromSlot.value, targetSlotIndex + 1, secondaryInventoryData.value);

mp.events.add('inventory:moveItemToSecondary', async (from: any, to: any, moveData: any) => {
    moveData = JSON.parse(moveData);
    // let newInv = await mp.events.callRemoteProc('inventory:moveItemToSecondary', from, to, x);
    // chat.browser.call('updatePlayerInventory', newInv);

    Dialog('Muta item', "Introdu cantitatea", (async (quantity: any) => {
		quantity = parseInt(quantity);
        if(isNaN(quantity)) return;
        let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:moveItemToSecondary', from, to, JSON.stringify(moveData), quantity);
		if(success === false){
			chat.sendLocalMessage(`Nu ai destule iteme`);
		}else{
			chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
		}
    }));
})

//moveitemtoprimary
mp.events.add('inventory:moveItemToPrimary', async (from: any, to: any, moveData: any) => {
    moveData = JSON.parse(moveData);
    // let newInv = await mp.events.callRemoteProc('inventory:moveItemToSecondary', from, to, x);
    // chat.browser.call('updatePlayerInventory', newInv);

    Dialog('Muta item', "Introdu cantitatea", (async (quantity: any) => {
		quantity = parseInt(quantity);
        if(isNaN(quantity)) return;
        let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:moveItemToPrimary', from, to, JSON.stringify(moveData), quantity);
		if(success === false){
			chat.sendLocalMessage(`Nu ai destule iteme`);
			chat.browser.call('closeInventory');
			INV_OPEN = false;
			mp.gui.cursor.show(false, false);
			mp.gui.cursor.visible = false;
		}else{
			chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
		}
    }));
})

function isWeapon(item: any){
	return item.startsWith('weapon_');
}

function isAmmo(item: any){
	return item.endsWith('_ammo');
}

// @click="mp.trigger('inventory:useItem', contextMenu.selectedSlot)"
mp.events.add('inventory:useItem', async (slot: any) => {
	let itemInSlot = playerData.inventory.items.find((item: any) => item.slot === slot);
	if(isWeapon(itemInSlot.name)){
		let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', slot, 1);
		if(success === false){
			chat.sendLocalMessage(`Nu ai destule iteme`);
		}else{
			chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
		}
		return
	}

	Dialog('Foloseste item', "Introdu cantitatea", (async (quantity: any) => {
		if(!quantity) quantity = 1;
		quantity = parseInt(quantity);	
		let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', slot, quantity);
		if(success === false){
			chat.sendLocalMessage(`Nu ai destule iteme`);
		}else{
			chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
		}
	}));
})

mp.events.add('inventory:dropItem', async (slot: any) => {
	Dialog('Drop item', "Introdu cantitatea", (async (quantity: any) => {
		if(!quantity) quantity = 1;
		quantity = parseInt(quantity);	
		let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:dropItem', slot, quantity);
		if(success === false){
			chat.sendLocalMessage(`Nu ai destule iteme`);
		}else{
			chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
		}
	}));
})

//inventory:giveItem (dialog for player id, another one for amount)
mp.events.add('inventory:giveItem', async (slot: any) => {
	Dialog('Da item', "Introdu id-ul jucatorului", (async (playerId: any) => {
		Dialog('Da item', "Introdu cantitatea", (async (quantity: any) => {
			if(!quantity) quantity = 1;
			quantity = parseInt(quantity);	
			let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:giveItemToPlayer', slot, playerId, quantity);
			if(success === false){
				chat.sendLocalMessage(`Nu ai destule iteme`);
			}else{
				chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
			}
		}));
	}));
})

//key bind 1 to 5 to use item from these slots
mp.keys.bind(0x31, true, async () => {
	if(chat.on) return;
	if(INV_OPEN) return;
	if(DIALOG_OPEN) return;
	if(MENU_OPEN) return;

	let itemInSlot = playerData.inventory.items.find((item: any) => item.slot === 1);
	if(!itemInSlot) return;
	if(isAmmo(itemInSlot.name)){
		//dialog
		Dialog('Foloseste item', "Introdu cantitatea", (async (quantity: any) => {
			if(!quantity) quantity = 1;
			quantity = parseInt(quantity);	
			let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 1, quantity);
			if(success === false){
				chat.sendLocalMessage(`Nu ai destule iteme`);
			}else{
				chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
			}
		}));
		return
	}


	let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 1, 1);
	if(success === false){
		chat.sendLocalMessage(`Nu ai destule iteme`);
	}else{
		chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
	}
}) // 1
mp.keys.bind(0x32, true, async () => {
	if(chat.on) return;
	if(INV_OPEN) return;
	if(DIALOG_OPEN) return;
	if(MENU_OPEN) return;
	let itemInSlot = playerData.inventory.items.find((item: any) => item.slot === 2);
	if(!itemInSlot) return;
	if(isAmmo(itemInSlot.name)){
		//dialog
		Dialog('Foloseste item', "Introdu cantitatea", (async (quantity: any) => {
			if(!quantity) quantity = 1;
			quantity = parseInt(quantity);	
			let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 2, quantity);
			if(success === false){
				chat.sendLocalMessage(`Nu ai destule iteme`);
			}else{
				chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
			}
		}));
		return
	}
	let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 2, 1);
	if(success === false){
		chat.sendLocalMessage(`Nu ai destule iteme`);
	}else{
		chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
	}
}) // 2
mp.keys.bind(0x33, true, async () => {
	if(chat.on) return;
	if(INV_OPEN) return;
	if(DIALOG_OPEN) return;
	if(MENU_OPEN) return;
	let itemInSlot = playerData.inventory.items.find((item: any) => item.slot === 3);
	if(!itemInSlot) return;
	if(isAmmo(itemInSlot.name)){
		//dialog
		Dialog('Foloseste item', "Introdu cantitatea", (async (quantity: any) => {
			if(!quantity) quantity = 1;
			quantity = parseInt(quantity);	
			let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 3, quantity);
			if(success === false){
				chat.sendLocalMessage(`Nu ai destule iteme`);
			}else{
				chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
			}
		}));
		return
	}
	let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 3, 1);
	if(success === false){
		chat.sendLocalMessage(`Nu ai destule iteme`);
	}else{
		chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
	}
}) // 3
mp.keys.bind(0x34, true, async () => {
	if(chat.on) return;
	if(INV_OPEN) return;
	if(DIALOG_OPEN) return;
	if(MENU_OPEN) return;
	let itemInSlot = playerData.inventory.items.find((item: any) => item.slot === 4);
	if(!itemInSlot) return;
	if(isAmmo(itemInSlot.name)){
		//dialog
		Dialog('Foloseste item', "Introdu cantitatea", (async (quantity: any) => {
			if(!quantity) quantity = 1;
			quantity = parseInt(quantity);	
			let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 4, quantity);
			if(success === false){
				chat.sendLocalMessage(`Nu ai destule iteme`);
			}else{
				chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
			}
		}));
		return
	}
	let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 4, 1);
	if(success === false){
		chat.sendLocalMessage(`Nu ai destule iteme`);
	}else{
		chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
	}
}) // 4

mp.keys.bind(0x35, true, async () => {
	if(chat.on) return;
	if(INV_OPEN) return;
	if(DIALOG_OPEN) return;
	if(MENU_OPEN) return;
	let itemInSlot = playerData.inventory.items.find((item: any) => item.slot === 5);
	if(!itemInSlot) return;
	if(isAmmo(itemInSlot.name)){
		//dialog
		Dialog('Foloseste item', "Introdu cantitatea", (async (quantity: any) => {
			if(!quantity) quantity = 1;
			quantity = parseInt(quantity);	
			let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 5, quantity);
			if(success === false){
				chat.sendLocalMessage(`Nu ai destule iteme`);
			}else{
				chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
			}
		}));
		return
	}
	let { playerInventory, secondaryInventory, success } = await mp.events.callRemoteProc('inventory:useItem', 5, 1);
	if(success === false){
		chat.sendLocalMessage(`Nu ai destule iteme`);
	}else{
		chat.browser.call('updatePlayerInventory', playerInventory, secondaryInventory);
	}
}) // 5