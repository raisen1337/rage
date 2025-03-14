import { INV_OPEN } from '@/inventory';
import { addMenuItem, DIALOG_OPEN, getBrowser, Menu, playerData, SERVER_PUBLIC_IP, setNuiFocus, showMenu } from '@/main';

//@ts-ignore
import fs from 'fs';

mp.gui.chat.activate(false);
mp.gui.chat.show(false);

// T to open chat
mp.keys.bind(0x54, false, () => {
	if (DIALOG_OPEN) return;
	if (INV_OPEN) return;
	mp.console.logInfo('T pressed');
	chat.open();
	chat.open();
	chat.open();
});

interface Command {
	name: string;
	callback: (args: any[]) => void;
	description: string;
	usage: string;
	admin: number;
}

interface ChatInterface {
	browser: BrowserMp;
	on: boolean;
	commands: { [key: string]: Command };
	registerCommand: (command: string, callback: (args: any[]) => void, description: string, usage: string, admin: number) => void;
	open: () => Promise<void>;
	sendLocalMessage: (message: string) => void;
	sendMessage: (message: string) => void;
}

var registeredCommands = {} as any;


export var chat: ChatInterface = {
	browser: getBrowser(),
	on: false,
	commands: {},
	open: async () => {
	

		//filter registerCommands where playerData.admin is less
		for (const cmd of Object.values(chat.commands)) {
			if (playerData.admin < cmd.admin) {
				delete registeredCommands[cmd.name];
			}
		}
		
		chat.browser.call('chat:open', JSON.stringify(registeredCommands));
		chat.on = true;

		setNuiFocus(true, false);

		while (chat.on) {
			mp.gui.cursor.show(true, true);
			mp.game.ui.disableFrontendThisFrame();
			await new Promise<void>((resolve) => setTimeout(resolve, 1));
		}
		mp.gui.cursor.show(false, false); //hide cursor
	},
	async sendLocalMessage(message: string) {
		
		chat.browser.call('chat:addMessage', message);
	},
	registerCommand(command: string, callback: (args: any[]) => void, description: string, usage: string, admin: number = 0) {
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
	async sendMessage(message: string) {
		chat.on = false;
		setNuiFocus(false, false);
		
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
				const requiredArgs = (cmd.usage.match(/\[(.*?)\]/g) || []).map((arg) => arg.slice(1, -1)); // Extract required args
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

mp.events.add('chat:close', () => {
	chat.on = false;
	setNuiFocus(false, false);
});

chat.browser.active = true;
chat.browser.markAsChat();

async function initChat() {
	const response = await mp.events.callRemoteProc('getServerCommands');

	for (const cmd of Object.values(chat.commands)) {
		registeredCommands[cmd.name] = {
			name: cmd.name,
			description: cmd.description,
			usage: cmd.usage,
			admin: cmd.admin
		};
	}

	if (response) {
		for (const cmd of response) {
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

mp.events.add('chat:clear', () => {
	chat.browser.call('chat:clear');
});
chat.registerCommand(
	'reload',
	() => {
		mp.events.callRemote('playerReload');
	},
	'Reloads your data',
	'/reload',
	0
);



chat.registerCommand(
	'menu',
	() => {
		let menu = Menu('Test Menu', 'This is a test menu', []) as any;

		addMenuItem(menu.id, {
			text: 'Test btn',
			subtext: 'This is a test button',
			type: 'default',
			cb: () => {},
			icon: 'fas fa-hashtag'
		});

		showMenu(menu.id);
	},
	'Menu',
	'/menu',
	0
);

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

mp.events.add('playerExitVehicle', (player: PlayerMp, vehicle: VehicleMp) => {
	chat.browser.call('hideSpeedo');
});
