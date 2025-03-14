import { Account } from '@/db';
import {Core} from '../main';
import fs from 'fs';
import { addItem, dropItem, useItem } from '@/inventory';



interface ChatInterface {
    sendToAll: (message: string) => void;
    sendChatMessage: (player: PlayerMp, message: string) => void;
    sendToPlayer: (player: PlayerMp, message: string) => void;
    sendToAdmins: (message: string) => void;
    registerCommand: (command: string, callback: (player: PlayerMp, args: any[]) => void, description: string, usage: string, admin: number) => void;
    processCommand: (player: PlayerMp, message: string) => void;
}

var commands: { [key: string]: { name: string; callback: (player: PlayerMp, args: any[]) => void; description: string; usage: string; admin: number } } = {};


export var chat = {
    sendToAll: (message: string) => {
        mp.players.forEach((p) => {
            p.call('chat:addMessage', [message]);
        })
    },
    sendChatMessage: (player: PlayerMp, message: string) => {
        if(!mp.players.exists(player)) return;
        var name = player.name;
        var PlayerData = Core.players[player.rgscId] as any;
        
        //save to chatLog
        var log = `[CHATLOG GLOBAL] ${Core.adminGrades[Core.players[player.rgscId].admin]} ${name}: ${message} at ${new Date().toLocaleString()}\n`;
        fs.existsSync('chatLog.txt') ? fs.appendFileSync('chatLog.txt', log) : fs.writeFileSync('chatLog.txt', log);

        mp.players.forEach((p) => {
            p.call('chat:addMessage', [`${Core.adminGrades[Core.players[player.rgscId].admin]} ${name}: ${message}`]);
        })
    },
    sendToPlayer: (player: PlayerMp, message: string) => {
        if(!mp.players.exists(player)) return;
        var log = `[CHATLOG TO PLAYER] ${message} at ${new Date().toLocaleString()}\n`;

        fs.existsSync('chatLog.txt') ? fs.appendFileSync('chatLog.txt', log) : fs.writeFileSync('chatLog.txt', log);
        player.call('chat:addMessage', [message]);
    },
    sendToAdmins: (message: string) => {
        var log = `[CHATLOG ADMIN] ${message} at ${new Date().toLocaleString()}\n`;
        fs.existsSync('chatLog.txt') ? fs.appendFileSync('chatLog.txt', log) : fs.writeFileSync('chatLog.txt', log);

        mp.players.forEach((p) => {
            var PlayerData = Core.players[p.rgscId] as any;
            if (PlayerData.admin > 0) {
                p.call('chat:addMessage', [message]);
            }
        })
    },
    registerCommand: (command: string, callback: (player: PlayerMp, args: any[]) => void, description: string, usage: string, admin: number = 0) => {
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
    processCommand: (player: PlayerMp, message: string) => {
        if (message.startsWith('/')) {
            const [cmdName, ...args] = message.slice(1).split(' ');
            const cmd = commands[cmdName];
    
            if (cmd) {
                var PlayerData = Core.players[player.rgscId] as any;
                if (PlayerData.admin < cmd.admin) {
                    chat.sendToPlayer(player, '^2[ERROR]^0 You do not have permission to use this command.');
                    return;
                }
    
                // --- ARGUMENT CHECKING ---
                const requiredArgs = (cmd.usage.match(/\[(.*?)\]/g) || []).map(arg => arg.slice(1, -1));
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
                fs.existsSync('commandLogs.txt') ? fs.appendFileSync('commandLogs.txt', log) : fs.writeFileSync('commandLogs.txt', log);
    
                cmd.callback(player, args);
            } else {
                chat.sendToPlayer(player, `^2[ERROR] Command /${cmdName} does not exist.`);
            }
        } else {
            chat.sendChatMessage(player, message);
        }
    }
    
} as ChatInterface;

// Event handler for incoming messages from clients
mp.events.add('chat:message', (player: PlayerMp, message: string) => {
    chat.processCommand(player, message);
});

mp.events.add('chat:command', (player: PlayerMp, message: string) => {
    chat.processCommand(player, message);
})

chat.registerCommand('clear', (player: PlayerMp, _args: any[]) => {
    chat.sendToAll('^1[INFO] ^0Chat has been cleared by an administrator.');
    mp.players.forEach((p) => {
        p.call('chat:clear');
    });

    chat.sendToAdmins(`^1[CHAT] ^0${player.name} has cleared the chat.`);
}, 'Clears the chat', '/clear', 0);

//getCommands proc

// register RPC 'test_proc' in server-side
// mp.events.addProc('test_proc', (player, text) => {
//     return 'hey beast: ' + text;
//   });

mp.events.addProc('getServerCommands', (_player: PlayerMp) => {
    var cmds = Object.keys(commands).map(cmd => {
        return {
            name: commands[cmd].name,
            description: commands[cmd].description,
            usage: commands[cmd].usage,
            admin: commands[cmd].admin
        }
    });

    return cmds;
});

chat.registerCommand('savepos', (player: PlayerMp, args: any[]) => {
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

    fs.existsSync('positions.json') ? fs.appendFileSync('positions.json', JSON.stringify({ [name]: data })) : fs.writeFileSync('positions.json', JSON.stringify({ [name]: data }));
    chat.sendToPlayer(player, `^1[INFO] ^0Position saved as ${name}.`);
}, 'Saves your current position', '/savepos [name]', 0);

chat.registerCommand('veh', (player: PlayerMp, args: any[]) => {
    var model = args[0];
    if (!model) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/veh [model]`);
        return;
    }

    var pos = player.position;
    var randomColor = () => Math.floor(Math.random() * 256);
    var veh = mp.vehicles.new(mp.joaat(model), new mp.Vector3(pos.x, pos.y, pos.z), {
        numberPlate: 'ADMIN',
        color: [[randomColor(), randomColor(), randomColor()], [randomColor(), randomColor(), randomColor()]]
    });


    chat.sendToPlayer(player, `^1[INFO] ^0Vehicle spawned.`);
    player.putIntoVehicle(veh, 0);
}, 'Spawns a vehicle', '/veh [model]', 1);

mp.events.add("vehicleShops:test", (player: PlayerMp, model: string, spot: any) => {
    console.log(model, spot)
    var randomColor = () => Math.floor(Math.random() * 256);
    var veh = mp.vehicles.new(mp.joaat(model), new mp.Vector3(spot.x, spot.y, spot.z), {
        heading: spot.h,
        numberPlate: 'TESTDRIVE',
        color: [[255, 255, 255], [255, 255, 255]]
    });

    chat.sendToPlayer(player, `^1[INFO] ^0Test drive a inceput. Ai la dispozitie 2 minute, sau poti parasii masina oricand.`);
    
   

    //interval 1s to check if player is in vehicle
    let interval = setInterval(() => {
        if(!mp.vehicles.exists(veh)){
            chat.sendToPlayer(player, `^1[INFO] ^0Test drive a fost terminat. Masina a fost stearsa.`);
            clearInterval(interval);
        }else if(mp.vehicles.exists(veh) && player.vehicle && player.vehicle.id != veh.id){
            chat.sendToPlayer(player, `^1[INFO] ^0Test drive a fost terminat. Masina a fost stearsa.`);
            clearInterval(interval);
            veh.destroy();
        }
    }, 1000);

    setTimeout(() => {
        clearInterval(interval);
        if(veh && mp.vehicles.exists(veh)){
            veh.destroy();
            chat.sendToPlayer(player, `^1[INFO] ^0Test drive a expirat. Masina a fost stearsa.`);
        }
    }, 120000);

    //set heading to vehicle
    veh.rotation = new mp.Vector3(0, 0, spot.h);
    player.putIntoVehicle(veh, 0);
})

//dv
chat.registerCommand('dv', (player: PlayerMp, _args: any[]) => {
    if (player.vehicle) {
        player.vehicle.destroy();
        chat.sendToPlayer(player, `^1[INFO] ^0Vehicle deleted.`);
    } else {
        chat.sendToPlayer(player, `^1[INFO] ^0You are not in a vehicle.`);
    }
}, 'Deletes your current vehicle', '/dv', 1);

//cleanup [seconds] to remove all vehicles unoccupied
chat.registerCommand('cleanup', (player: PlayerMp, args: any[]) => {
    var seconds = parseInt(args[0]);
    if (!seconds) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/cleanup [seconds]`);
        return;
    }

    let totalDeleted = 0;

    chat.sendToAll(`^1[INFO] ^0All unoccupied vehicles will be removed in ${seconds} seconds.`);

    mp.vehicles.forEach((veh) => {
        if (!veh.getOccupants().length) {
            totalDeleted++;
            setTimeout(() => {
                veh.destroy();
            }, seconds * 1000);
        }
    });

    setTimeout(() => {
        chat.sendToAdmins(`^1[INFO] ^0${totalDeleted} unoccupied vehicles have been deleted.`);
    }, seconds * 1000);

}, 'Removes all unoccupied vehicles after a certain amount of time', '/cleanup [seconds]', 1);

//cleanarea [radius] to remove all vehicles and objects
chat.registerCommand('cleanarea', (player: PlayerMp, args: any[]) => {
    var radius = parseInt(args[0]);
    if (!radius) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/cleanarea [radius]`);
        return;
    }

    let totalDeleted = 0;

    chat.sendToAll(`^1[INFO] ^0All vehicles and objects will be removed in a ${radius}m radius.`);

    mp.vehicles.forEach((veh) => {
        if (veh.position.subtract(player.position).length() < radius) {
            totalDeleted++;
            veh.destroy();
        }
    });

    mp.objects.forEach((obj) => {
        if (obj.position.subtract(player.position).length() < radius) {
            totalDeleted++;
            obj.destroy();
        }
    });

    chat.sendToAdmins(`^1[INFO] ^0${totalDeleted} vehicles and objects have been deleted.`);
}, 'Removes ALL vehicles and objects in a certain radius', '/cleanarea [radius]', 1);

//admins
chat.registerCommand('admins', (player: PlayerMp, _args: any[]) => {
    //to show like below:
    //---------- Admins Online ----------
    // Name(id) - Admin Level Name (ON-DUTY / OFF-DUTY)
    //------------------------------------
    var admins = mp.players.toArray().filter(p => Core.players[p.rgscId].admin > 0);
    chat.sendToPlayer(player, `^1---------- Admins Online ----------`);
    admins.forEach((admin) => {
        var PlayerData = Core.players[admin.rgscId] as any;
        chat.sendToPlayer(player, `^0${admin.name}(${admin.id}) - ${Core.adminGrades[parseInt(PlayerData.admin)]}(${PlayerData.onDuty ? '^3ON-DUTY^0' : '^2OFF-DUTY^0'})`);
    });
    chat.sendToPlayer(player, `^1---------- Admins Online ----------`);
}, 'Lists all online administrators', '/admins', 0);

//aduty
chat.registerCommand('aduty', (player: PlayerMp, _args: any[]) => {
    var PlayerData = Core.players[player.rgscId] as any;
    PlayerData.onDuty = !PlayerData.onDuty;
    chat.sendToAdmins(`^1[INFO] ^0${player.name} is now ${PlayerData.onDuty ? '^3ON-DUTY^0' : '^2OFF-DUTY^0'}.`);
}, 'Toggle your duty status', '/aduty', 1);

//n (newbie question) - to send to admins
export let newbieQuestions: any[] = [];
chat.registerCommand('n', (player: PlayerMp, args: any[]) => {
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
chat.registerCommand('nr', (player: PlayerMp, args: any[]) => {
    var id = parseInt(args[0]);
    var response = args.slice(1).join(' ');
    if (!id || !response) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/nr [id] [response]`);
        return;
    }

    var question = newbieQuestions.find(q => q.player === id);
    if (!question) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Question not found.`);
        return;
    }

    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === question.player);
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }
    chat.sendToPlayer(target, `^3[NEWBIE] ${player.name} has responded: ${response}`);
    chat.sendToPlayer(player, `^3[NEWBIE] ^0You have responded to ${target.name}'s question.`);
}, 'Respond to a newbie question', '/nr [id] [response]', 1);

export let tickets: any[] = [];

chat.registerCommand('ctk', (player: PlayerMp, args: any[]) => {
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
chat.registerCommand('tk', (player: PlayerMp, args: any[]) => {
    var id = parseInt(args[0]);
    if (!id) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/tk [id]`);
        return;
    }
    try{
        var ticket = tickets.find(t => t.player === id);
        if (!ticket) {
            chat.sendToPlayer(player, `^2[ERROR] ^0Ticket not found.`);
            return;
        }
    
        var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === ticket.player);
        if (!target) {
            chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
            return;
        }
    
        //send message to target
        chat.sendToPlayer(target, `^3[TICKET] ^0${player.name} has taken your ticket.`);
    
    
        //remove ticket
        tickets = tickets.filter(t => t.player !== id);
    
        player.position = target.position;
        chat.sendToPlayer(player, `^1[INFO] ^0You have teleported to ${target.name}.`);
    }catch(e){
        chat.sendToPlayer(player, `^2[ERROR] ^0Player or ticket not found.`);
    }
   
}, 'Teleport to a player', '/tk [id]', 1);

//setadmin [id] [level]
chat.registerCommand('setadmin', (player: PlayerMp, args: any[]) => {
    var id = parseInt(args[0]);
    var level = parseInt(args[1]);
    

    if (isNaN(id) || isNaN(level)) {
        chat.sendToPlayer(player, `^1[USAGE]x ^0/setadmin [id] [level]`);
        return;
    }

    if(level > 13) return chat.sendToPlayer(player, `^1[ERROR] ^0Invalid admin level (0 - 13).`);

    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === id);
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }

    if(target.id == player.id) return chat.sendToPlayer(player, `^1[ERROR] ^0You cannot modify your own admin level.`);

    var PlayerData = Core.players[target.rgscId] as any;
    if(PlayerData.admin >= 13) return chat.sendToPlayer(player, `^1[ERROR] ^0You cannot modify this player admin's level.`);
    PlayerData.admin = level;
    

    Account.update({ admin: level }, { where: { license: target.rgscId } });

    let removedAdminBool = level === 0 ? true : false;
    if(removedAdminBool){
        chat.sendToPlayer(target, `^1[ADMIN] ^0Your admin level has been removed.`);
        chat.sendToAdmins(`^1[ADMIN] ^0${player.name} has removed ${target.name}'s admin level.`);
    }else{
        chat.sendToAdmins(`^1[ADMIN] ^0${player.name} has set ${target.name}'s admin level to ${Core.adminGrades[level]}.`);
    }

}, 'Set a player\'s admin level', '/setadmin [id] [level]', 0);

//tptome [id]
chat.registerCommand('tptome', (player: PlayerMp, args: any[]) => {
    var id = parseInt(args[0]);
    if (!id) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/tptome [id]`);
        return;
    }

    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === id);
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }

    target.position = player.position;
    chat.sendToPlayer(player, `^1[INFO] ^0You have teleported ${target.name} to you.`);
}, 'Teleport a player to you', '/tptome [id]', 1);

//tpto [id]
chat.registerCommand('tpto', (player: PlayerMp, args: any[]) => {
    var id = parseInt(args[0]);
    if (!id) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/tpto [id]`);
        return;
    }

    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === id);
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }

    player.position = target.position;
    chat.sendToPlayer(player, `^1[INFO] ^0You have teleported to ${target.name}.`);
}, 'Teleport to a player', '/tpto [id]', 1);

//fix
chat.registerCommand('fix', (player: PlayerMp, _args: any[]) => {
    if (player.vehicle) {
        player.vehicle.repair();
        chat.sendToPlayer(player, `^1[INFO] ^0Vehicle repaired.`);
    } else {
        chat.sendToPlayer(player, `^1[INFO] ^0You are not in a vehicle.`);
    }
}, 'Repairs your current vehicle', '/fix', 0);

mp.events.addProc('getServerData', () => {
    return {
        tickets: tickets.length,
        questions: newbieQuestions.length
    }
})

//weather [weather]
chat.registerCommand('weather', (player: PlayerMp, args: any[]) => {
    var weather = args[0];
    if (!weather) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/weather [weather]`);
        return;
    }

    mp.world.weather = weather;
    chat.sendToPlayer(player, `^1[INFO] ^0Weather set to ${weather}.`);
}, 'Set the weather', '/weather [weather]', 1);

//time [hour] [minute]
chat.registerCommand('time', (player: PlayerMp, args: any[]) => {
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

chat.registerCommand('giveitem', (player: PlayerMp, args: any[]) => {
    var id = parseInt(args[0]);
    var item = args[1];
    var amount = parseInt(args[2]);
    if (isNaN(id) || !item || isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/giveitem [id] [item] [amount]`);
        return;
    }

    console.log(id, item, amount)

    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === id);
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }

    addItem(target, item, amount, [], (result: any) => {
        if (result.success) {
            if (target) {
                chat.sendToPlayer(target, `^1[INFO] ^0You have received ${amount}x ${item} from ${player.name}.`);
                chat.sendToPlayer(player, `^1[INFO] ^0You have given ${amount}x ${item} to ${target.name}.`);
            }else{
                chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
            }
        } else {
            chat.sendToPlayer(player, `^2[ERROR] ^0Invalid item.`);
        }
    })
}, 'Give an item to a player', '/giveitem [id] [item] [amount]', 8);

//removeitem [id] [item] [amount]
chat.registerCommand('removeitem', (player: PlayerMp, args: any[]) => {
    var id = parseInt(args[0]);
    var item = args[1];
    var amount = parseInt(args[2]);
    if (isNaN(id) || !item || isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/removeitem [id] [item] [amount]`);
        return;
    }

    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === id);
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }

    addItem(target, item, -amount, [], (result: any) => {
        if (result.success) {
            if (target) {
                chat.sendToPlayer(target, `^1[INFO] ^0${amount}x ${item} has been removed from your inventory by ${player.name}.`);
                chat.sendToPlayer(player, `^1[INFO] ^0You have removed ${amount}x ${item} from ${target.name}'s inventory.`);
            }else{
                chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
            }
        } else {
            chat.sendToPlayer(player, `^2[ERROR] ^0Invalid item.`);
        }
    })
}, 'Remove an item from a player', '/removeitem [id] [item] [amount]', 8);

//myitems
chat.registerCommand('myitems', (player: PlayerMp, _args: any[]) => {
    var PlayerData = Core.players[player.rgscId] as any;
    chat.sendToPlayer(player, `^1---------- Inventory ----------`);
    PlayerData.inventory.items.forEach((item: any) => {
        chat.sendToPlayer(player, `Name: ${item.name} Label: ${item.label} Amount: ${item.amount} Slot: ${item.slot}`);
    });
    chat.sendToPlayer(player, `^1---------- Inventory ----------`);
}, 'View your inventory', '/myitems', 0);

//givemoney [id] [type] [amount]
chat.registerCommand('givemoney', (player: PlayerMp, args: any[]) => {
    var id = parseInt(args[0]);
    var type = args[1];
    var amount = parseInt(args[2]);
    if (isNaN(id) || !type || isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/givemoney [id] [type] [amount]`);
        return;
    }

    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === id);
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }

    var PlayerData = Core.players[target.rgscId] as any;
    PlayerData[type] += amount;
    chat.sendToAdmins(`^1[INFO] ^0${player.name} has given $${Core.formatNumber(amount)} to ${target.name}.`);
    chat.sendToPlayer(target, `^1[INFO] ^0You have received $${Core.formatNumber(amount)} from ${player.name}.`);
    chat.sendToPlayer(player, `^1[INFO] ^0You have given $${Core.formatNumber(amount)} to ${target.name}.`);
}, 'Give money to a player', '/givemoney [id] [type] [amount]', 8);

chat.registerCommand('useitem', (player: PlayerMp, args: any[]) => {
    var item = args[0];
    var amount = parseInt(args[1]);
    if (isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/useitem [item] [amount]`);
        return;
    }

    useItem(player, item, amount, (result: any) => {
        if (result.success) {
            chat.sendToPlayer(player, `^1[INFO] ^0You have used ${amount}x ${item}.`);
        } else {
            chat.sendToPlayer(player, `^2[ERROR] ^0Item use failed.`);
        }
    });
}, 'Use an item from your inventory', '/useitem [item] [amount]', 0);

//dropItem
chat.registerCommand('dropitem', (player: PlayerMp, args: any[]) => {
    var item = args[0];
    var amount = parseInt(args[1]);
    if (isNaN(amount)) {
        chat.sendToPlayer(player, `^1[USAGE] ^0/dropitem [item] [amount]`);
        return;
    }

    dropItem(player, item, amount, (result: any) => {
        if (result.success) {
            chat.sendToPlayer(player, `^1[INFO] ^0You have dropped ${amount}x ${item}.`);
        } else {
            chat.sendToPlayer(player, `^2[ERROR] ^0Item drop failed.`);
        }
    });
}, 'Drop an item from your inventory', '/dropitem [item] [amount]', 0);

chat.registerCommand('addonvehs', (player: PlayerMp) => {
    chat.sendToPlayer(player, `^1---------- Addon Vehicles ----------`);
    fs.readdirSync('./client_packages/game_resources/dlcpacks/').forEach((file: any) => {
        if (fs.lstatSync(`./client_packages/game_resources/dlcpacks/${file}`).isDirectory() && file.startsWith('veh_')) {
            chat.sendToPlayer(player, `^1[VEH] ^0${file}`);
        }
    });
    chat.sendToPlayer(player, `^1---------- Addon Vehicles ----------`);
}, 'List all addon vehicles', '/addonvehs', 10);

mp.events.add('admin:teleportPlayerToMe', (player: PlayerMp, playerId: any) => {
    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === parseInt(playerId));
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }

    target.position = player.position;
    chat.sendToPlayer(player, `^1[INFO] ^0You have teleported ${target.name} to you.`);
})

mp.events.add('admin:teleportToPlayer', (player: PlayerMp, playerId: any) => {
    console.log(playerId)
    console.log(JSON.stringify(mp.players.toArray()))
    var target = mp.players.toArray().find(p => Core.players[p.rgscId].id === parseInt(playerId));
    console.log(target)
    if (!target) {
        chat.sendToPlayer(player, `^2[ERROR] ^0Player not found.`);
        return;
    }

    player.position = target.position;
    chat.sendToPlayer(player, `^1[INFO] ^0You have teleported to ${target.name}.`);
})

