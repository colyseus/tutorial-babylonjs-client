import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

import { Client, Room } from "colyseus.js";

export interface Players {
    [playerId: string]: any;
}

export default class Game {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _light: BABYLON.Light;
    private _advancedTexture: GUI.AdvancedDynamicTexture;

    private _game: Room;
    private _players: Players = {};

    constructor(_canvas: HTMLCanvasElement, _engine: BABYLON.Engine, _game: Room) {
        this._canvas = _canvas;
        this._engine = _engine;
        this._game = _game;
    }

    initPlayers(): void {
        this._game.state.players.onAdd((player, sessionId) => {
            const capsule = BABYLON.MeshBuilder.CreateCapsule('player', {}, this._scene);
            console.log(player);
            capsule.position = new BABYLON.Vector3(player.x, .5, player.z);
            this._players[sessionId] = capsule;

            player.onChange((changes) => {
                const currentPosition = this._players[sessionId].position
                this.move(this._players[sessionId], new BABYLON.Vector3(currentPosition.x, 0.5, currentPosition.z),
                    new BABYLON.Vector3(changes.x, 0.5, changes.z));
            })
        });
    }

    async createGame(): Promise<void> {
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        this._light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);
        this._camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), this._scene);
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, true);

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {height: 8, width: 8, subdivisions: 4}, this._scene);;

        this.initPlayers();

        this._scene.onPointerDown = function (event, pointer) {
            if(event.button == 0) {
                const currentPosition = this._players[this._game.sessionId].position
                 this.move(this._players[this._game.sessionId],
                     new BABYLON.Vector3(currentPosition.x, 0.5, currentPosition.z),
                     new BABYLON.Vector3(pointer.pickedPoint.x, 0.5, pointer.pickedPoint.z));
                this._game.send("updatePosition", {
                    x: pointer.pickedPoint.x,
                    y: 0.5,
                    z: pointer.pickedPoint.z,
                });
            }
        }.bind(this);

        this.doRender();
    }

    move(obj, startPosition, endPosition): void {
        BABYLON.Animation.CreateAndStartAnimation("animate", obj, "position", 30, 30, startPosition, endPosition, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
    }

    private doRender() : void {
        // Run the render loop.
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}
