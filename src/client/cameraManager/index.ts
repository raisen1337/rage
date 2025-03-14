import { chat } from "@/chat";

export class CameraManager {
    public static instance: CameraManager | null = null;
    public currentCam: number = -1;
    public cameraRotationActive: boolean = false;
    public rotationTickStarted: boolean = false;
    public initialCamPos: Vector3 | null = null;

    // Configuration options with defaults
    public config = {
        cameraDistance: 2.0,
        cameraHeight: 0.5,
        defaultBoneId: 31086, // head bone
        cameraFOV: 30.0,
        transitionDuration: 1500,
        dofStrength: 1.0,
        dofNearOffset: 0.5,
        dofFarOffset: 0.5
    };

    // Prevent direct construction
    public constructor() {}

    // Singleton getter
    public static getInstance(): CameraManager {
        if (!CameraManager.instance) {
            CameraManager.instance = new CameraManager();
        }
        return CameraManager.instance;
    }

    // Configuration setter
    public configure(options: Partial<typeof CameraManager.prototype.config>): void {
        this.config = { ...this.config, ...options };
    }

    public getLocalPlayer(): PlayerMp {
        return mp.players.local.handle;
    }

    public async activateCamera(boneId: number = this.config.defaultBoneId): Promise<void> {
        const player = mp.players.local;
        
        // Get bone position and ensure it's a Vector3
        const boneCoords = new mp.Vector3(
            player.getBoneCoords(boneId, 0, 0, 0).x,
            player.getBoneCoords(boneId, 0, 0, 0).y,
            player.getBoneCoords(boneId, 0, 0, 0).z
        );
    
        // Adjust bone coordinates for legs view
        if (boneId === 11816) { // legs bone ID
            boneCoords.z -= 0.4; // Move the entire camera setup lower
        }
        
        mp.console.logInfo(`Bone coordinates: ${boneCoords.x}, ${boneCoords.y}, ${boneCoords.z}`);
    
        const { cameraPosition, cameraAngle } = this.calculateCameraPosition(player, boneCoords, { height: this.config.cameraHeight, distance: this.config.cameraDistance });
        mp.console.logInfo(`Final camera position: ${cameraPosition.x}, ${cameraPosition.y}, ${cameraPosition.z}`);
        this.initialCamPos = cameraPosition;
    
        const newCam = this.setupCamera(cameraPosition, player, cameraAngle, boneCoords);
        await this.transitionToNewCamera(newCam);
        this.enableCameraControls(player);
    }
    
    public calculateCameraPosition(
        player: PlayerMp, 
        boneCoords: Vector3, 
        adjustments: { height: number; distance: number }
    ): { cameraPosition: Vector3, cameraAngle: number } {
        const playerHeading = player.getHeading();
        const angleInRadians = (playerHeading % 360) * Math.PI / 180;
        
        // Calculate camera position with separate height and distance adjustments
        const cameraPosition = new mp.Vector3(
            boneCoords.x - Math.sin(angleInRadians) * adjustments.distance,
            boneCoords.y + Math.cos(angleInRadians) * adjustments.distance,
            boneCoords.z - adjustments.height // This directly affects the camera's height
        );
    
        return {
            cameraPosition,
            cameraAngle: angleInRadians
        };
    }
    

    public setupCamera(position: Vector3, player: PlayerMp, angle: number, targetCoords: Vector3): number {
        mp.console.logInfo(`Creating camera at position: ${position.x}, ${position.y}, ${position.z}`);
        
        const cam = mp.cameras.new('default', position, new mp.Vector3(0, 0, 0), this.config.cameraFOV);
    
        if (cam) {
            mp.console.logInfo(`Pointing camera at bone: ${targetCoords.x}, ${targetCoords.y}, ${targetCoords.z}`);
            
            const originalHeading = player.getHeading();
            const newHeading = (originalHeading + 180) % 360;
            
            cam.setRot(0, 0, newHeading, 2);
            // Point at bone position instead of player position
            cam.pointAtCoord(targetCoords.x, targetCoords.y, targetCoords.z);
            
            return cam.handle;
        }
        
        return -1;
    }
    public setupDepthOfField(camera: CameraMp, camPos: Vector3, player: PlayerMp): void {
        const distanceToPed = camPos.subtract(player.position).length();

        camera.setFarDof(distanceToPed + this.config.dofFarOffset);
        camera.setNearDof(Math.max(0.1, distanceToPed - this.config.dofNearOffset));
        camera.setDofStrength(this.config.dofStrength);
        camera.setUseShallowDofMode(true);
    }

    public async transitionToNewCamera(newCam: number): Promise<void> {
        if (this.currentCam !== -1) {
            await new Promise(resolve => setTimeout(resolve, this.config.transitionDuration));
            mp.game.cam.destroy(this.currentCam, false);
        } else {
            mp.game.cam.setActive(newCam, true);
        }
        
        this.currentCam = newCam;
        mp.game.cam.renderScriptCams(true, false, 0, true, true);
    }

    public enableCameraControls(player: PlayerMp): void {
        player.freezePosition(true);
        this.cameraRotationActive = true;
        
        if (!this.rotationTickStarted) {
            this.startRotationTick();
            this.rotationTickStarted = true;
        }
    }

    public startRotationTick(): void {
        const controlsToDisable = [
            30, 31, 32, 33, 34, 35, // Movement keys
            24, 25,                 // Mouse clicks
            45                      // Reload
        ];

        mp.events.add('render', async () => {
            if (this.cameraRotationActive && this.currentCam !== -1) {
                controlsToDisable.forEach(control => {
                    mp.game.controls.disableControlAction(0, control, true);
                });
            }

            await new Promise(resolve => setTimeout(resolve, 1));
        });
    }

    public disableCamera(): void {
        this.cameraRotationActive = false;
        this.initialCamPos = null;
        
        if (this.currentCam !== -1) {
            mp.game.cam.destroy(this.currentCam, false);
            this.currentCam = -1;
        }
        
        mp.game.cam.renderScriptCams(false, false, 0, true, true);
    }
}

// Export a function to get the instance
export const getCameraManager = (): CameraManager => {
    return CameraManager.getInstance();
};

chat.registerCommand('camera', (_args: any[]) => {
    const cameraManager = getCameraManager();
    cameraManager.activateCamera(31086);
}, 'Activate camera', '/camera', 1);

//stopcamera
chat.registerCommand('stopcamera', (_args: any[]) => {
    const cameraManager = getCameraManager();
    cameraManager.disableCamera();
    //unfreeze player
    mp.players.local.freezePosition(false);
}, 'Stop camera', '/stopcamera', 1);