import { chat } from '@/chat';
import { INV_OPEN } from '@/inventory';
import { addMenuItem, Dialog, DIALOG_OPEN, Menu, playerData, showMenu } from '@/main';
import { IS_GARAGE_SHOWN } from '@/vehicle_shops';
const teleportWaypoint = () => {
	const waypoint = mp.game.ui.getFirstBlipInfoId(8);
	if (!mp.game.ui.doesBlipExist(waypoint)) return;

	const waypointPos = mp.game.ui.getBlipInfoIdCoord(waypoint);
	if (!waypointPos) return;

	let zCoord = mp.game.gameplay.getGroundZFor3DCoord(waypointPos.x, waypointPos.y, waypointPos.z, false, false);
	if (!zCoord) {
		for (let i = 1000; i >= 0; i -= 25) {
			mp.game.streaming.requestCollisionAtCoord(waypointPos.x, waypointPos.y, i);
			mp.game.wait(0);
		}
		zCoord = mp.game.gameplay.getGroundZFor3DCoord(waypointPos.x, waypointPos.y, 1000, false, false);
		if (!zCoord) return;
	}
	mp.players.local.position = new mp.Vector3(waypointPos.x, waypointPos.y, zCoord + 0.5);
};

//bind K key
mp.keys.bind(0x4b, true, () => {
	if(chat.on) return;
	if(INV_OPEN) return;
	if(DIALOG_OPEN) return;
	if(IS_GARAGE_SHOWN) return;
	let mainMenu = Menu('Player Menu', 'Select an option', []);

	if (playerData.admin > 0) {
		addMenuItem(mainMenu.id, {
			text: 'Admin Menu',
			subtext: 'Open the admin menu',
			cb: () => {
				let subMenu = Menu('Admin Menu', 'Select an option', []);
				if (playerData.admin >= 1) {
					addMenuItem(subMenu.id, {
						text: 'Teleport to waypoint',
						subtext: 'Teleport to the waypoint on the map',
						cb: () => {
							teleportWaypoint();
						},
						icon: 'fas fa-map-marker-alt'
					});

					//tp to player
					addMenuItem(subMenu.id, {
						text: 'Teleport to player',
						subtext: 'Teleport to a player',
						cb: () => {
							Dialog('Teleport to player', 'Enter the player ID', (playerId: any) => {
								mp.events.callRemote('admin:teleportToPlayer', playerId);
							});
						},
						icon: 'fas fa-user-friends'
					});

					//tptome
					addMenuItem(subMenu.id, {
						text: 'Teleport player to me',
						subtext: 'Teleport a player to you',
						cb: () => {
							Dialog('Teleport player to me', 'Enter the player ID', (playerId: any) => {
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
						cb: () => {
							//name, blip, blipColor, price
							Dialog('Create vehicle shop', 'Enter the name', (name: any) => {
								Dialog('Create vehicle shop', 'Enter the blip', (blip: any) => {
									blip = parseInt(blip);
									Dialog('Create vehicle shop', 'Enter the blip color', (blipColor: any) => {
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
						cb: () => {
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
							Dialog('Create Blip', 'Enter the name', (name: any) => {
								Dialog('Create Blip', 'Enter the color', (color: any) => {
									Dialog('Create Blip', 'Enter the sprite', (sprite: any) => {
										Dialog('Create Blip', 'Enter the scale', (scale: any) => {
											Dialog('Create Blip', 'Enter the shortRange', (shortRange: any) => {
												Dialog('Create Blip', 'Enter the dimension', (dimension: any) => {
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
						cb: async () => {
							let blips = await mp.events.callRemoteProc('getBlips');
							if (blips && blips.length > 0) {
								let blipsMenu = Menu('Blips', 'Select an option', []);
								blips.forEach((blip: any) => {
									addMenuItem(blipsMenu.id, {
										text: blip.name,
										subtext: `Blip`,
										icon: 'fas fa-map-marker-alt',
										cb: () => {
											//new submenu, with Set Name, Set Color, Set Position, Set Sprite, Set Scale, Set ShortRange, Set Dimension
											let blipMenu = Menu(blip.name, 'Select an option', []);

											//change name
											addMenuItem(blipMenu.id, {
												text: 'Set Name',
												subtext: 'Set the name',
												cb: () => {
													Dialog('Set Name', 'Enter the name', (name: any) => {
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
												cb: () => {
													Dialog('Set Color', 'Enter the color', (color: any) => {
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
												cb: () => {
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
												cb: () => {
													Dialog('Set Sprite', 'Enter the sprite', (sprite: any) => {
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
												cb: () => {
													Dialog('Set Scale', 'Enter the scale', (scale: any) => {
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
												cb: () => {
													Dialog('Set ShortRange', 'Enter the shortRange', (shortRange: any) => {
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
												cb: () => {
													Dialog('Set Dimension', 'Enter the dimension', (dimension: any) => {
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
												cb: () => {
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
						cb: async () => {
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
								vehicleShops.forEach((shop: any) => {
									addMenuItem(vehicleShopsMenu.id, {
										text: shop.name,
										subtext: `Dealership`,
										cb: () => {
											//new submenu, with Set Price, Set Ped Pos, Set Veh Pos, Add Testing Spot, Add Vehicle
											let vehicleShopMenu = Menu(shop.name, 'Select an option', []);

											//change name
											addMenuItem(vehicleShopMenu.id, {
												text: 'Set Name',
												subtext: 'Set the name',
												cb: () => {
													Dialog('Set Name', 'Enter the name', (name: any) => {
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
												cb: () => {
													Dialog('Set Blip', 'Enter the blip', (blip: any) => {
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
												cb: () => {
													Dialog('Set Blip Color', 'Enter the blip color', (blipColor: any) => {
														if (!blipColor) return;
														mp.events.callRemote('admin:setVehicleShopBlipColor', shop.id, blipColor);
													});
												},
												icon: 'fas fa-car'
											});

											addMenuItem(vehicleShopMenu.id, {
												text: 'Set Ped Pos',
												subtext: 'Set the ped position',
												cb: () => {
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
												cb: () => {
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
												cb: () => {
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
												cb: () => {
													//model, name, price, stock, if vehicle already exists add the stock
													Dialog('Add Vehicle', 'Enter the model', (model: any) => {
														Dialog('Add Vehicle', 'Enter the name', (name: any) => {
															Dialog('Add Vehicle', 'Enter the price', (price: any) => {
																price = parseInt(price);
																if (!price || !model || !name || isNaN(price)) return;
																Dialog('Add Vehicle', 'Enter the stock', (stock: any) => {
																	stock = parseInt(stock);
																	Dialog('Add Vehicle', 'Enter the category', (category: any) => {
																		mp.events.callRemote(
																			'admin:addVehicleShopVehicle',
																			shop.id,
																			model,
																			name,
																			price,
																			stock,
																			category
																		);
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
						cb: () => {
							Dialog('Money Type', 'Money type [cash, bank]', (moneyType: any) => {
								Dialog('Give money', 'Enter the player ID', (playerId: any) => {
									Dialog('Give money', 'Enter the amount', (amount: any) => {
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
						cb: () => {
							Dialog('Money Type', 'Money type [cash, bank]', (moneyType: any) => {
								Dialog('Set money', 'Enter the player ID', (playerId: any) => {
									Dialog('Set money', 'Enter the amount', (amount: any) => {
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
						cb: () => {
							Dialog('Give item', 'Enter the player ID', (playerId: any) => {
								Dialog('Give item', 'Enter the item name', (itemName: any) => {
									Dialog('Give item', 'Enter the amount', (amount: any) => {
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
		cb: () => {
			chat.browser.call('openCharacterCreator');
		},
		icon: 'fas fa-user-plus'
	});

	showMenu(mainMenu.id);
});


mp.events.add('cl:showDeathscreen', () => {
    chat.browser.call('showDeathscreen');
})

mp.events.add('deathscreenTimeEnded', () => {
	//revive ped
	// mp.players.local.resurrect();
	// mp.players.local.reviveInjured();
	mp.players.local.taskRevive()
	mp.events.callRemote('revivePed');
})


mp.events.add('corefx:playerReady', () => {
	if(playerData.dead){
		//kill ped
		chat.browser.call('showDeathscreen');
		mp.players.local.health = -1;
		mp.game.task.writhe(mp.players.local.handle, mp.players.local.handle, 1500, 1, 1, 1)
		// mp.players.local.taskWrithe(mp.players.local.handle, 1000, 0)
	}
})