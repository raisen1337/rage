import { chat } from '@/chat';
import { Account, Vehicles, VehicleShops } from '@/db';
import { Core, getModsFromDb, setMods } from '@/main';

mp.events.add('admin:createVehicleShop', async (player: PlayerMp, name: any, blip: any, blipColor: any) => {
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

	chat.sendToAdmins(`^1[INFO] ^0${player.name} created a vehicle shop with name ${name}`);

	let vehicleShops = await VehicleShops.findAll();
	mp.players.forEach(async (player: any) => {
		//select all vehicle shops
		player.call('vehicleShops:load', [vehicleShops]);
	});
});

mp.events.addProc('vehicleShops:fetch', async (_player: PlayerMp) => {
	let vehicleShops = VehicleShops.findAll();
	return vehicleShops;
});

mp.events.add('admin:setVehicleShopPedPos', async (player: PlayerMp, shopId: any, pos: any) => {
	pos.h = player.heading;
	let shop = await VehicleShops.findOne({ where: { id: shopId } });
	if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
	shop.ped_pos = pos;
	await shop.save();

	let vehicleShops = await VehicleShops.findAll();
	mp.players.forEach(async (player: any) => {
		//select all vehicle shops
		player.call('vehicleShops:load', [vehicleShops]);
	});

	chat.sendToAdmins(`^1[INFO] ^0${player.name} set ped pos for vehicle shop ${shop.name}`);
});

//setVehicleShopVehPos
mp.events.add('admin:setVehicleShopVehPos', async (player: PlayerMp, shopId: any, pos: any) => {
	console.log(JSON.stringify(pos));
	pos.h = player.heading;
	let shop = await VehicleShops.findOne({ where: { id: shopId } });
	if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
	shop.veh_pos = pos;
	await shop.save();

	//load all vehicle shops
	let vehicleShops = await VehicleShops.findAll();
	mp.players.forEach(async (player: any) => {
		//select all vehicle shops
		player.call('vehicleShops:load', [vehicleShops]);
	});

	chat.sendToAdmins(`^1[INFO] ^0${player.name} set veh pos for vehicle shop ${shop.name}`);
});

mp.events.add('admin:setVehicleShopBlipColor', async (player: PlayerMp, shopId: any, color: any) => {
	let shop = await VehicleShops.findOne({ where: { id: shopId } });
	if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
	shop.blipColor = color;
	await shop.save();

	//load all vehicle shops
	let vehicleShops = await VehicleShops.findAll();
	mp.players.forEach(async (player: any) => {
		//select all vehicle shops
		player.call('vehicleShops:load', [vehicleShops]);
	});

	chat.sendToAdmins(`^1[INFO] ^0${player.name} set blip color for vehicle shop ${shop.name}`);
});

//setVehicleShopBlip
mp.events.add('admin:setVehicleShopBlip', async (player: PlayerMp, shopId: any, blip: any) => {
	let shop = await VehicleShops.findOne({ where: { id: shopId } });
	if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
	shop.blip = blip;
	await shop.save();

	//load all vehicle shops
	let vehicleShops = await VehicleShops.findAll();
	mp.players.forEach(async (player: any) => {
		//select all vehicle shops
		player.call('vehicleShops:load', [vehicleShops]);
	});

	chat.sendToAdmins(`^1[INFO] ^0${player.name} set blip for vehicle shop ${shop.name}`);
});

//admin:setVehicleShopName
mp.events.add('admin:setVehicleShopName', async (player: PlayerMp, shopId: any, name: any) => {
	let shop = await VehicleShops.findOne({ where: { id: shopId } });
	if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
	shop.name = name;
	await shop.save();

	//load all vehicle shops
	let vehicleShops = await VehicleShops.findAll();
	mp.players.forEach(async (player: any) => {
		//select all vehicle shops
		player.call('vehicleShops:load', [vehicleShops]);
	});

	chat.sendToAdmins(`^1[INFO] ^0${player.name} set name for vehicle shop ${shop.name}`);
});

//admin:addVehicleShopTestingSpot
mp.events.add('admin:addVehicleShopTestingSpot', async (player: PlayerMp, shopId: any, _pos: any) => {
	let shop = (await VehicleShops.findOne({ where: { id: shopId } })) as any;
	if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);
	shop.testing_spots.push({
		x: player.position.x,
		y: player.position.y,
		z: player.position.z,
		h: player.heading
	});
	await VehicleShops.update({ testing_spots: shop.testing_spots }, { where: { id: shopId } });

	//load all vehicle shops
	let vehicleShops = await VehicleShops.findAll();
	mp.players.forEach(async (player: any) => {
		//select all vehicle shops
		player.call('vehicleShops:load', [vehicleShops]);
	});

	chat.sendToAdmins(`^1[INFO] ^0${player.name} added testing spot for vehicle shop ${shop.name}`);
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

mp.events.add('admin:addVehicleShopVehicle', async (player: PlayerMp, shopId: any, model: any, name: any, price: any, stock: any, category: any) => {
	console.log(`${shopId} ${model} ${name} ${price} ${stock} ${category}`);
	let shop = (await VehicleShops.findOne({ where: { id: shopId } })) as any;
	if (!shop) return chat.sendToAdmins(`^1[ERROR] ^0Vehicle shop with id ${shopId} not found`);

	let existingVehicle = shop.vehicles.find((v: any) => v.model === model);
	if (existingVehicle) {
		existingVehicle.stock += stock;
	} else {
		shop.vehicles.push({ model, name, price, stock, category });
	}

	await VehicleShops.update({ vehicles: shop.vehicles }, { where: { id: shopId } });
	console.log(shop.vehicles);

	// Load all vehicle shops
	let vehicleShops = await VehicleShops.findAll();
	mp.players.forEach(async (player: any) => {
		player.call('vehicleShops:load', [vehicleShops]);
	});

	chat.sendToAdmins(`^1[INFO] ^0${player.name} ${existingVehicle ? 'updated stock for' : 'added'} vehicle ${name} in vehicle shop ${shop.name}`);
});

mp.events.add('vehicleShops:buy', async (player: PlayerMp, vehicle: any, shopId: any) => {
	vehicle = JSON.parse(vehicle);
	//vehicle is a object with name, model and price
	let shop = (await VehicleShops.findOne({ where: { id: shopId } })) as any;
	if (!shop) return chat.sendToPlayer(player, `^2[ERROR]^0 Vehicle shop with id ${shopId} not found`);
	let vehicleIndex = shop.vehicles.findIndex((v: any) => v.name == vehicle.name);
	if (vehicleIndex == -1) return chat.sendToPlayer(player, `^2[ERROR]^0 Vehicle ${vehicle.name} not found in shop ${shop.name}`);
	if (shop.vehicles[vehicleIndex].stock <= 0) return chat.sendToPlayer(player, `^2[ERROR]^0 Vehicle ${vehicle.name} is out of stock`);
	const Player = Core.GetPlayerData(player);

	//prevent owning more than 1 vehicle with the same model
	let owned = await Vehicles.findAll({ where: { owner: player.rgscId } });
	if (owned.find((v: any) => v.model == vehicle.model))
		return chat.sendToPlayer(player, `^2[ERROR]^0 You already own a vehicle with the same model.`);

	if (Player.cash < vehicle.price) return chat.sendToPlayer(player, `^2[ERROR]^0 You don't have enough money`);
	shop.vehicles[vehicleIndex].stock--;
	await VehicleShops.update({ vehicles: shop.vehicles }, { where: { id: shopId } });

	Player.cash = Player.cash - vehicle.price;
	Account.update({ cash: Player.cash }, { where: { id: player.id } });

	Core.players[player.rgscId].cash = Player.cash;

	async function findUniquePlate() {
		//plate format should be R + 5 numbers

		let owned = await Vehicles.findAll({ where: { owner: player.rgscId } });
		let plate = `R${Math.floor(Math.random() * 10000)}`;
		do {
			plate = `R${Math.floor(Math.random() * 10000)}`;
		} while (owned.find((v: any) => v.plate == plate));
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

mp.events.addProc('getPlayerVehicles', async (player: PlayerMp) => {
	let vehicles = await Vehicles.findAll({ where: { owner: player.rgscId } });
	return vehicles;
});

mp.events.add('spawnVehicle', (player: PlayerMp, model: string, plate: string) => {
	if (!mp.vehicles.toArray().find((v) => v.numberPlate.replace(/\s/g, '') == plate.replace(/\s/g, ''))) {
		let spawnPosition = {
			x: player.position.x + 2,
			y: player.position.y,
			z: player.position.z
		};
		let vehicle = mp.vehicles.new(model, new mp.Vector3(spawnPosition.x, spawnPosition.y, spawnPosition.z), {
			numberPlate: plate,
			dimension: player.dimension
		});
		setTimeout(async () => {
			setMods(vehicle, await getModsFromDb(plate));
			player.putIntoVehicle(vehicle, 0);
		}, 500);
	} else {
		player.outputChatBox(`^1[ERROR] ^0You already have a vehicle with this plate`);
	}
});
//deleteVehicle
mp.events.add('deleteVehicle', async (player: PlayerMp, plate: string) => {
	let vehicle = await Vehicles.findOne({ where: { plate } });
	if (!vehicle) return chat.sendToPlayer(player, `^2[ERROR]^0 Vehicle with plate ${plate} not found`);
	vehicle.destroy();
});

mp.events.add('removeMoney', (player: PlayerMp, amount: any) => {
	let Player = Core.GetPlayerData(player);
	Player.cash = Player.cash - parseInt(amount);
	Account.update({ cash: Player.cash }, { where: { id: player.id } });
	Core.players[player.id].cash = Player.cash;
	chat.sendToPlayer(player, `^2[INFO]^0 You removed $${Core.formatNumber(amount)} from your account`);
});
