import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

import { Client, Room } from "colyseus.js";

export interface Player {
    entity: any,
    targetPosition: BABYLON.Vector3
}

export interface Players {
    [playerId: string]: Player;
}

export default class Game {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _light: BABYLON.Light;
    private _advancedTexture: GUI.AdvancedDynamicTexture;

    private _game: Room<any>;
    private _players: Players = {};

    constructor(_canvas: HTMLCanvasElement, _engine: BABYLON.Engine, _game: Room<any>) {
        this._canvas = _canvas;
        this._engine = _engine;
        this._game = _game;
    }

    initPlayers(): void {
        this._game.state.players.onAdd((player, sessionId) => {
            const capsule = BABYLON.MeshBuilder.CreateCapsule('player', {}, this._scene);
            capsule.position.set(player.x, 0.5, player.z);
            this._players[sessionId] = {
                entity: capsule,
                targetPosition: new BABYLON.Vector3(0, 0, 0)
            };
            player.onChange((changes) => {
                this._players[sessionId].targetPosition.set(player.x, player.y, player.z);
                this.move(this._players[sessionId]);
            })
        });

        this._game.state.players.onRemove((player, playerId) => {
            this._players[playerId].entity.dispose();
            delete this._players[playerId];
        });
    }

    bootstrap(): void {
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        this._light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);
        this._camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), this._scene);
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, true);

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {height: 8, width: 8, subdivisions: 4}, this._scene);

        this.initPlayers();

        this._scene.onPointerDown = function (event, pointer) {
            if(event.button == 0) {
                this._players[this._game.sessionId].targetPosition = pointer.pickedPoint.clone();
                this.move(this._players[this._game.sessionId]);
                this._game.send("updatePosition", {
                    x: pointer.pickedPoint.x,
                    y: 0.5,
                    z: pointer.pickedPoint.z,
                });
            }
        }.bind(this);

        this.doRender();
    }

    move(player: Player): void {
        BABYLON.Animation.CreateAndStartAnimation("animate", player.entity, "position",
            60, 120, player.entity.position, player.targetPosition,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
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
