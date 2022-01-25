import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

export default class Game {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _light: BABYLON.Light;
    private _advancedTexture: GUI.AdvancedDynamicTexture;

    constructor(_canvas: HTMLCanvasElement, _engine: BABYLON.Engine) {
        this._canvas = _canvas;
        this._engine = _engine;
    }

    createGame(): BABYLON.Scene {
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        this._light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);
        this._camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), this._scene);
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, true);

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {height: 8, width: 8, subdivisions: 4}, this._scene);
        const cylinder = BABYLON.MeshBuilder.CreateCapsule('player', {}, this._scene);
        cylinder.position = new BABYLON.Vector3(0, .5, 0);

        this._scene.onPointerDown = function (event, pointer) {
            if(event.button == 0) {
                this.move(cylinder, cylinder.position, new BABYLON.Vector3(pointer.pickedPoint.x, .5, pointer.pickedPoint.z));
            }
        }.bind(this);

        return this._scene;
    }

    move(obj, startPosition, endPosition): void {
        BABYLON.Animation.CreateAndStartAnimation("animate", obj, "position", 30, 30, startPosition, endPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
}
