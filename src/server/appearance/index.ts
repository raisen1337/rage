import { Account } from "@/db";
import { Core } from "@/main";

// mp.events.add('setModel', (modelName) => {
let playerClothingData = {} as any;

function getPlayerAppearance(player: PlayerMp){
    let component_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    let prop_ids = [0, 1, 2, 6, 7]
    //0-19
    let face_features = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]


    let components = component_ids.map((componentId) => {
        return {
            componentId: componentId,
            drawable: player.getClothes(componentId).drawable,
            texture: player.getClothes(componentId).texture,
            palette: player.getClothes(componentId).palette
        }
    });

    let props = prop_ids.map((propId) => {
        return {
            propId: propId,
            drawable: player.getProp(propId).drawable,
            texture: player.getProp(propId).texture
        }
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
    ] as any;
    
    let faceFeatures = face_features.map((featureIndex) => {
        return player.getFaceFeature(featureIndex);
    });

    //0-12
    let headOverlays = Array.from({length: 13}, (_, i) => i).map((overlayId) => {
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
    }
}

function setPlayerAppearance(player: PlayerMp, appearance: any){
    appearance.components.forEach((component: any) => {
        player.setClothes(component.componentId, component.drawable, component.texture, component.palette);
    });

    appearance.props.forEach((prop: any) => {
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
    

    appearance.faceFeatures.forEach((value: number, index: number) => {
        player.setFaceFeature(index, value);
    });

    appearance.headOverlays.forEach((overlay: any, index: number) => {
        player.setHeadOverlay(index, overlay);
    });

    player.setHairColor(appearance.hairColor, appearance.hairHighlightColor);
}

mp.events.add('updateComponent', (player: PlayerMp, componentId: number, drawable: number, texture: number) => {
    player.setClothes(componentId, drawable, texture, 0);
});

mp.events.add('updateProp', (player: PlayerMp, propId: number, drawable: number, texture: number) => {
    player.setProp(propId, drawable, texture);
});


// mp.events.callRemote('createCharacter', model, lastName, firstName, age, height);
mp.events.add('createCharacter', (player: PlayerMp, model: string, lastName: string, firstName: string, age: number, height: number) => {
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
    })

    Core.players[player.rgscId].character = {
        firstName,
        lastName,
        age,
        height,
        model,
        appearance
    }
    

    setPlayerAppearance(player, appearance);
})

mp.events.add('updateFeature', (player: PlayerMp, featureIndex: number, value: number) => {
    player.setFaceFeature(featureIndex, value);
});

mp.events.add('updateAppearance', (player: PlayerMp, overlayId: number, overlayVariation: number) => {
    player.setHeadOverlay(overlayId, [
        overlayVariation,
        255,
        player.getHeadOverlay(overlayId)[2],
        player.getHeadOverlay(overlayId)[3]
    ])
});

mp.events.add('updateColor', (player: PlayerMp, overlayId: number, color: number) => {
    player.setHeadOverlay(overlayId, [
        player.getHeadOverlay(overlayId)[0],
        player.getHeadOverlay(overlayId)[1],
        color,
        player.getHeadOverlay(overlayId)[3]
    ])
});

mp.events.add('updateCharacterAppearance', (player: PlayerMp, father: number, mother: number, similarity: number) => {
    player.setHeadBlend(father, mother, 0, father, mother, 0, similarity, similarity, 0);
})

mp.events.add('setModel', (player: PlayerMp, modelName: string) => {    
    player.model = mp.joaat(modelName);
});


mp.events.add('updateHairColor', (player: PlayerMp, color: number) => {
    player.setHairColor(color, color);
})

mp.events.add('setClothes', (player: PlayerMp) => {
    setPlayerAppearance(player, Core.players[player.rgscId].character.appearance);
})
mp.events.add('saveClothing', (player: PlayerMp) => {
    Core.players[player.rgscId].character.appearance = getPlayerAppearance(player);
    Account.update({
        character: Core.players[player.rgscId].character
    }, {
        where: {
            license: player.rgscId
        }
    })
});