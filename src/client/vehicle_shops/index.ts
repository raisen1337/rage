import { chat } from '@/chat';
import { DrawInteract } from '@/interact';
import { addMenuItem, closeAllMenus, formatNumber, isPositionFree, Menu, playerData, showMenu } from '@/main';

let vehicleShops = [] as any;
let closestShop = false as any;

mp.events.add('corefx:playerReady', async () => {
	vehicleShops = await mp.events.callRemoteProc('vehicleShops:fetch');
	// chat.sendLocalMessage(`${typeof vehicleShops} ${JSON.stringify(vehicleShops)} `);

	//create blip
	vehicleShops.forEach((shop: any) => {
		if (shop.ped_pos.x != 0) {
			let blip = mp.blips.new(shop.blip, new mp.Vector3(shop.ped_pos.x, shop.ped_pos.y, shop.ped_pos.z), {
				color: shop.blipColor,
				name: shop.name,
				shortRange: true
			});

			shop.blip = blip;

			let ped = mp.peds.new(
				mp.game.joaat('s_m_m_fiboffice_02'),
				new mp.Vector3(shop.ped_pos.x, shop.ped_pos.y, shop.ped_pos.z),
				shop.ped_pos.h,
				0
			);
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

mp.events.add('vehicleShops:load', (data: any) => {
	//rebuild, delete blips, peds, etc

	// chat.sendLocalMessage(`Vehicle shops: ${JSON.stringify(data)}`);

	vehicleShops.forEach((shop: any) => {
		if (shop.blip) {
			shop.blip.destroy();
		}
		if (shop.ped) {
			shop.ped.destroy();
		}
	});

	vehicleShops = [];

	setTimeout(() => {
		vehicleShops = data;

		closestShop = false;

		vehicleShops.forEach((shop: any) => {
			if (shop.ped_pos.x != 0) {
				let blip = mp.blips.new(shop.blip, new mp.Vector3(shop.ped_pos.x, shop.ped_pos.y, shop.ped_pos.z), {
					color: shop.blipColor,
					name: shop.name,
					shortRange: true
				});

				shop.blip = blip;

				let ped = mp.peds.new(
					mp.game.joaat('s_m_m_fiboffice_02'),
					new mp.Vector3(shop.ped_pos.x, shop.ped_pos.y, shop.ped_pos.z),
					shop.ped_pos.h,
					0
				);
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



mp.events.add('render', () => {
	if (!closestShop && vehicleShops.length > 0) {
		closestShop = vehicleShops.reduce((prev: any, curr: any) => {
			let prevDist = mp.game.system.vdist(
				mp.players.local.position.x,
				mp.players.local.position.y,
				mp.players.local.position.z,
				prev.ped_pos.x,
				prev.ped_pos.y,
				prev.ped_pos.z
			);
			let currDist = mp.game.system.vdist(
				mp.players.local.position.x,
				mp.players.local.position.y,
				mp.players.local.position.z,
				curr.ped_pos.x,
				curr.ped_pos.y,
				curr.ped_pos.z
			);
			return prevDist < currDist ? prev : curr;
		});
	}
	if (closestShop && closestShop.ped_pos.x) {
		let closestDist = mp.game.system.vdist(
			mp.players.local.position.x,
			mp.players.local.position.y,
			mp.players.local.position.z,
			closestShop.ped_pos.x,
			closestShop.ped_pos.y,
			closestShop.ped_pos.z
		);

		if (closestDist > 5) {
			closestShop = false;
		} else {
			DrawInteract(
				'E',
				closestShop.name,
				'Pentru a vorbii cu vanzatorul',
				new mp.Vector3(closestShop.ped_pos.x, closestShop.ped_pos.y, closestShop.ped_pos.z)
			);

			if (mp.keys.isDown(0x45)) {
				let mainMenu = Menu(`${closestShop.name} - Meniu`, 'Meniu principal', []);

				//build categories from .vehicles, each vehicle has a .category
				let categories = closestShop.vehicles.map((vehicle: any) => vehicle.category);
				categories = [...new Set(categories)];

				categories.forEach((category: any) => {
					addMenuItem(mainMenu.id, {
						text: category,
						subtext: `${category} category`,
						value: category,
						icon: 'fa-solid fa-car',
						cb: () => {
							let categoryMenu = Menu(
								`${closestShop.name} - ${category}`,
								`${category} category`,
								[]
							);

							closestShop.vehicles
								.filter((v: any) => v.category == category)
								.forEach((vehicle: any) => {
									addMenuItem(categoryMenu.id, {
										text: `${vehicle.name} - Stock: ${vehicle.stock}`,
										subtext: `Pret: ${formatNumber(vehicle.price)} $`,
										value: vehicle.name,
										icon: 'fa-regular fa-car',
										cb: () => {
											let vehicleMenu = Menu(
												`${vehicle.name}`,
												`Pret: ${formatNumber(vehicle.price)} $`,
												[]
											);

											addMenuItem(vehicleMenu.id, {
												text: 'Cumpara',
												subtext: `Pret: ${vehicle.price} $`,
												icon: 'fa-solid fa-check',
												cb: () => {
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
												cb: () => {
													if(mp.players.local.vehicle) return chat.sendLocalMessage(`^2[ERROR] ^0Esti deja intr-o masina.`);
													closeAllMenus();
													function findFreeSpot() {
														//usign isPositionFree
														let freeSpot = false;
														closestShop.testing_spots.forEach((spot: any) => {
															if(isPositionFree(spot)) {
																freeSpot = spot;
															}
														})

														return freeSpot;
													}

													let spot = findFreeSpot() as any;
													if(!spot) return chat.sendLocalMessage(`^2[ERROR] ^0Nu sunt locuri libere pentru test drive`);
													mp.events.callRemote('vehicleShops:test', vehicle.model, spot);														
												}
											});

											//rent price is 10% of the price per hour
										

											addMenuItem(vehicleMenu.id, {
												text: 'Inchiriaza',
												subtext: `Pret ora: ${Math.round(vehicle.price * 0.1)} $`,
												icon: 'fa-solid fa-clock',
												cb: () => {
													mp.events.callRemote('vehicleShops:rent', vehicle.name, closestShop.id);
												}
											});

											showMenu(vehicleMenu.id);
										},
									});
								});

							showMenu(categoryMenu.id);
						},
					});
				});

				showMenu(mainMenu.id);
			}
		}
	}
});

export let IS_GARAGE_SHOWN = false;

chat.registerCommand('v', async (args: string[]) => {
	
	let vehicles = await mp.events.callRemoteProc('getPlayerVehicles');

	vehicles.forEach((vehicle: any) => {
		if(mp.vehicles.toArray().find(v => v.getNumberPlateText().replace(/\s/g, '') == vehicle.plate.replace(/\s/g, ''))) {
			vehicle.isOut = true;
		}else{
			vehicle.isOut = false;
		}
	})

	chat.browser.call('showVehicles', JSON.stringify(vehicles));
	IS_GARAGE_SHOWN = true;

	mp.gui.cursor.show(true, true);
	mp.gui.cursor.visible = true;

}, 'View your vehicles', "/v", 0);

mp.events.add('hideVehicles', () => {
	chat.browser.call('hideVehicles', []);
	IS_GARAGE_SHOWN = false;
	mp.gui.cursor.show(false, false);
	mp.gui.cursor.visible = false;
})

mp.events.add('spawnVehicle', (model: string, plate: string) => {
	mp.events.callRemote('spawnVehicle', model, plate);
})

mp.events.add('deleteVehicle', (plate: string) => {
	mp.events.callRemote('deleteVehicle', plate);
})

mp.events.add('mouseShowCursor', () => {
	mp.events.callRemote('updateVehColor')
})