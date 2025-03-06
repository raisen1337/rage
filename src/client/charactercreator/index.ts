import { CameraManager, getCameraManager } from '@/cameraManager';
import { chat } from '@/chat';
import { playerData } from '@/main';

let IS_CHAR_CREATOR_ON = false;

const CHAR_CREATOR_POS = { x: -1120.9315185546875, y: -2819.373779296875, z: 20.7616447449, h: -33.884307861328125 };

mp.events.add('corefx:playerReady', async () => {
    let isNew = playerData.character.firstName === 'Unknown';
    mp.console.logInfo(`isNew: ${isNew}`);
    if (!isNew) {
        mp.events.callRemote('setClothes', playerData.character.appearance);
        return;
    }

    // Set ped default comp (if needed)
    // mp.players.local.setDefaultComponentVariation();
    mp.game.cam.doScreenFadeOut(1000);

    mp.players.local.setCoords(CHAR_CREATOR_POS.x, CHAR_CREATOR_POS.y, CHAR_CREATOR_POS.z, false, false, false, false);
    mp.players.local.freezePosition(true);
    mp.players.local.setHeading(CHAR_CREATOR_POS.h);

    mp.gui.cursor.visible = true;

    IS_CHAR_CREATOR_ON = true;
    chat.browser.call('hideUi');
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });

    const cameraManager = getCameraManager();
    cameraManager.activateCamera(31086);

    chat.browser.call('showCharCreator', playerData);
    while (IS_CHAR_CREATOR_ON) {
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1);
        });
    }
});

mp.events.add('cl:log', (msg: string) => {
    chat.sendLocalMessage(msg);
    mp.console.logInfo(msg);
});

let components = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
let props = [0, 1, 2, 6, 7];

// Updated functions to get current and max values
function getPlayerComponentsCount(): any {
    let comps = [] as any;

    components.forEach((comp) => {
        const drawable = mp.players.local.getDrawableVariation(comp);
        comps.push({
            component_id: comp,
            drawable: drawable, // Current drawable ID
            texture: mp.players.local.getTextureVariation(comp), // Current texture ID
            max_drawable: mp.players.local.getNumberOfDrawableVariations(comp), // Maximum drawable
            max_texture: mp.players.local.getNumberOfTextureVariations(comp, drawable) // Maximum texture for current drawable
        });
    });

    return comps;
}

function getPlayerPropsCount(): any {
    let propsData = [] as any;

    props.forEach((prop) => {
        propsData.push({
            prop_id: prop,
            drawable: mp.players.local.getPropIndex(prop), // Current drawable ID
            texture: mp.players.local.getPropTextureIndex(prop), // Current texture ID
            max_drawable: mp.players.local.getNumberOfPropDrawableVariations(prop), // Maximum drawable
            max_texture: mp.players.local.getNumberOfPropTextureVariations(prop, mp.players.local.getPropIndex(prop)) // Maximum texture for current drawable
        });
    });

    return propsData;
}


mp.events.add('cl:setModel', (modelName) => {
    mp.players.local.model = mp.game.joaat(modelName);
});

// Update a specific face feature
mp.events.add('cl:updateFeature', (featureIndex, value) => {
    mp.events.callRemote('updateFeature', featureIndex, value);
});

// Update overall character appearance (parents and similarity)
mp.events.add('cl:updateCharacterAppearance', (father, mother, similarity) => {
    mp.events.callRemote('updateCharacterAppearance', father, mother, similarity);
});

mp.events.add('cl:openClothes', () => {
    const componentsData = getPlayerComponentsCount();
    const propsData = getPlayerPropsCount();
    mp.events.callRemote("startCustomization")
    chat.browser.call('clothesData', componentsData, propsData);
});
mp.events.add('cl:openCloth', () => {
    const componentsData = getPlayerComponentsCount();
    const propsData = getPlayerPropsCount();
    mp.events.callRemote("startCustomization")
    chat.browser.call('clothData', componentsData, propsData);
});

// Update a specific appearance item (blemishes, facial hair, etc.)
mp.events.add('cl:updateAppearance', (overlayId, value) => {
    const overlayVariation = parseInt(value);
    mp.events.callRemote('updateAppearance', overlayId, overlayVariation);
});

// Update a color for hair and other colored overlays
mp.events.add('cl:updateColor', (overlayId, color) => {
    mp.events.callRemote('updateColor', overlayId, color);
});

// Update a component variation (drawable and texture)
mp.events.add('cl:updateComponent', (componentId, drawable, texture) => {
    mp.events.callRemote('updateComponent', componentId, drawable, texture);
});

// Update a prop variation (drawable and texture)
mp.events.add('cl:updateProp', (propId, drawable, texture) => {
    mp.events.callRemote('updateProp', propId, drawable, texture);
});

mp.events.add('cl:createCharacter', (model, lastName, firstName, age, height) => {
    IS_CHAR_CREATOR_ON = false;
    chat.browser.call('showUi');
    mp.players.local.freezePosition(false);
    mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
    CameraManager.getInstance().disableCamera();
    mp.events.callRemote('createCharacter', model, lastName, firstName, age, height);
});

mp.events.add('cl:switchCamera', (cam) => {
    if (cam === 'head') {
        CameraManager.getInstance().disableCamera();
        CameraManager.getInstance().activateCamera(31086);
    } else if (cam === 'body') {
        CameraManager.getInstance().disableCamera();
        CameraManager.getInstance().activateCamera(24818);
    } else {
        CameraManager.getInstance().disableCamera();
        CameraManager.getInstance().activateCamera(11816);
    }
});

mp.events.add('cl:updateHairColor', (color) => {
    mp.events.callRemote('updateHairColor', color);
});

async function showClothesMenu() {
    chat.browser.call('cl:showClothesMenu');
    IS_CHAR_CREATOR_ON = true;
    mp.gui.cursor.visible = true;
    mp.gui.cursor.show(true, true);
    mp.players.local.freezePosition(true);
    CameraManager.getInstance().activateCamera(31086);
    chat.browser.call('hideUi');
    while (IS_CHAR_CREATOR_ON) {
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1);
        });
    }

}

mp.events.add('cl:saveClothing', () => {
    mp.events.callRemote('saveClothing');
    CameraManager.getInstance().disableCamera();
    //unfreeze player
    IS_CHAR_CREATOR_ON = false;
    mp.players.local.freezePosition(false);
    mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
    chat.browser.call('showUi');

});


chat.registerCommand('clothes', async () => {
    let componentsData = getPlayerComponentsCount();
    //remove hair from componentsData
    componentsData = componentsData.filter((comp: any) => comp.component_id !== 2);
    const propsData = getPlayerPropsCount();
    chat.browser.call('showClothingShop', componentsData, propsData);
    IS_CHAR_CREATOR_ON = true;
    mp.gui.cursor.visible = true;
    mp.gui.cursor.show(true, true);
    mp.players.local.freezePosition(true);
    CameraManager.getInstance().activateCamera(31086);
    chat.browser.call('hideUi');
    while (IS_CHAR_CREATOR_ON) {
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1);
        });
    }
}, 'Open clothes menu', '/clothes', 13);