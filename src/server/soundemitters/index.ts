import { chat } from "@/chat";
import http from 'http';

let ServerSoundEmitters: Record<number, any> = {};
let emitterIdCounter = 1;
let emitterIntervals: Record<number, NodeJS.Timeout> = {};


mp.events.add('audio:registerEmitterForAllPlayers', async (player: PlayerMp, url: string, inVehicle: boolean) => {
    for (const emitterId in ServerSoundEmitters) {
        if (ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
            mp.players.forEach((_player) => {
                _player.call('audio:removeEmitter', [parseInt(emitterId)]);
            });

            if (emitterIntervals[emitterId]) {
                clearInterval(emitterIntervals[emitterId]);
                delete emitterIntervals[emitterId];
            }

            delete ServerSoundEmitters[emitterId];
            console.log(`[SERVER AUDIO] Player ${player.name} had an active emitter ${emitterId}, removed it to register new one.`);
        }
    }

    const emitterId = emitterIdCounter++;

    const emitterData = {
        id: emitterId,
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

    ServerSoundEmitters[emitterId] = emitterData;

    console.log(`[SERVER AUDIO] Registered new emitter ${emitterId} for player ${player.name} (RGSC ID: ${player.rgscId}), URL: ${url}, Type: ${emitterData.type}`);

    if (inVehicle) {
        ServerSoundEmitters[emitterId].plate = player.vehicle.id;
        try {
            emitterIntervals[emitterId] = setInterval(() => {
                let vehicle = mp.vehicles.toArray().find(v => v.id === ServerSoundEmitters[emitterId].plate) as VehicleMp;
                if (!mp.vehicles.exists(vehicle)) {
                    mp.players.forEach((_player) => {
                        _player.call('audio:removeEmitter', [emitterId]);
                    });
                    clearInterval(emitterIntervals[emitterId]);
                    delete emitterIntervals[emitterId];
                    delete ServerSoundEmitters[emitterId];
                    console.log(`[SERVER AUDIO] Vehicle for emitter ${emitterId} disappeared, emitter removed.`);
                }
            }, 1000);
        } catch (e) {
            console.error('Error in interval check:', e);
        }
    }

    mp.players.forEach((_player) => {
        _player.call('audio:registerEmitter', [JSON.stringify(emitterData)]);
        console.log(`[SERVER AUDIO] Sent audio:registerEmitter for emitter ${emitterId} to player ${_player.name} (RGSC ID: ${_player.rgscId})`);
    });
});

mp.events.add('playerQuit', (player: PlayerMp) => {
    for (const emitterId in ServerSoundEmitters) {
        if (ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
            mp.players.forEach((_player) => {
                _player.call('audio:removeEmitter', [parseInt(emitterId)]);
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

mp.events.add('audio:removeEmitter', (player: PlayerMp, emitterId: number) => {
    if (ServerSoundEmitters[emitterId] && ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {

        mp.players.forEach((_player) => {
            _player.call('audio:removeEmitter', [emitterId]);
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

mp.events.add('audio:setVolume', (player: PlayerMp, emitterId: number, maxVol: number) => {
    if (ServerSoundEmitters[emitterId] && ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
        ServerSoundEmitters[emitterId].maxVol = maxVol;

        mp.players.forEach((_player) => {
            _player.call('audio:updateEmitter', [JSON.stringify(ServerSoundEmitters[emitterId])]);
        });
        console.log(`[SERVER AUDIO] Emitter ${emitterId} maxVol set to ${maxVol} by player ${player.name}.`);
    } else {
        console.warn(`[SERVER AUDIO] Player ${player.name} tried to set volume for emitter ${emitterId}, but is not the owner or emitter not found.`);
    }
});

mp.events.add('audio:changeUrl', (player: PlayerMp, emitterId: number, url: string) => {
    if (ServerSoundEmitters[emitterId] && ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
        if (!url) return;
        let isValidYoutubeUrl = url.match(/^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/);
        let isPlaylist = url.match(/[?&]list=/);

        if (!isValidYoutubeUrl) return;
        if (isPlaylist) return;
        ServerSoundEmitters[emitterId].url = url;
        ServerSoundEmitters[emitterId].startTime = Date.now();

        mp.players.forEach((_player) => {
            _player.call('audio:updateEmitter', [JSON.stringify(ServerSoundEmitters[emitterId])]);
        });
        console.log(`[SERVER AUDIO] Emitter ${emitterId} URL changed to ${url} by player ${player.name}.`);
    } else {
        console.warn(`[SERVER AUDIO] Player ${player.name} tried to change URL for emitter ${emitterId}, but is not the owner or emitter not found.`);
    }
});

mp.events.add('audio:requestAllEmitters', (player: PlayerMp) => {
    for (const emitterId in ServerSoundEmitters) {
        player.call('audio:registerEmitter', [JSON.stringify(ServerSoundEmitters[emitterId])]);
    }
    console.log(`[SERVER AUDIO] Sent all emitters to player ${player.name} on request.`);
});
//setRange

mp.events.add('audio:setRange', (player: PlayerMp, emitterId: number, range: number) => {
    if (ServerSoundEmitters[emitterId] && ServerSoundEmitters[emitterId].ownerRgscId === player.rgscId) {
        ServerSoundEmitters[emitterId].range = range;

        mp.players.forEach((_player) => {
            _player.call('audio:updateEmitter', [JSON.stringify(ServerSoundEmitters[emitterId])]);
        });
        console.log(`[SERVER AUDIO] Emitter ${emitterId} range set to ${range} by player ${player.name}.`);
    } else {
        console.warn(`[SERVER AUDIO] Player ${player.name} tried to set range for emitter ${emitterId}, but is not the owner or emitter not found.`);
    }
});