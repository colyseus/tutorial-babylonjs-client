import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import {Room} from "colyseus.js";

import Menu from "./menu";
import {createSkyBox} from "./utils";

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
    private _camera: BABYLON.ArcRotateCamera;
    private _light: BABYLON.Light;

    private _game: Room<any>;
    private _players: Players = {};

    constructor(_canvas: HTMLCanvasElement, _engine: BABYLON.Engine, _game: Room<any>) {
        this._canvas = _canvas;
        this._engine = _engine;
        this._game = _game;
    }

    initPlayers(): void {
        this._game.state.players.onAdd((player, sessionId) => {
            const sphere = BABYLON.MeshBuilder.CreateSphere(`player-${sessionId}`, {
                segments: 8,
                diameter: 40
            }, this._scene);
            // Set player mesh properties
            const sphereMaterial = new BABYLON.StandardMaterial(`playerMat-${sessionId}`, this._scene);
            sphereMaterial.emissiveColor = sessionId === this._game.sessionId ? BABYLON.Color3.FromHexString("#ff9900") : BABYLON.Color3.Gray();
            sphere.material = sphereMaterial;

            // Set player spawning position
            sphere.position.set(player.x, player.y, player.z);
            this._players[sessionId] = {
                entity: sphere,
                targetPosition: new BABYLON.Vector3(0, 0, 0)
            };
            player.onChange(() => {
                this._players[sessionId].targetPosition.set(player.x, player.y, player.z);
                this.move(this._players[sessionId]);
            })
        });

        this._game.state.players.onRemove((player, playerId) => {
            this._players[playerId].entity.dispose();
            delete this._players[playerId];
        });

        this._game.onLeave(code => {
            this.gotoMenu();
        })
    }

    createGround(): void {
        //Creation of a plane
        const plane = BABYLON.MeshBuilder.CreatePlane("plane", {size: 500}, this._scene);
        plane.position.y = -15;
        plane.rotation.x = Math.PI / 2;

        let floorPlane = new BABYLON.StandardMaterial('floorTexturePlane', this._scene);
        floorPlane.diffuseTexture = new BABYLON.Texture('./public/ground.jpg', this._scene);
        floorPlane.backFaceCulling = false; // Always show the front and the back of an element

        let materialPlane = new BABYLON.MultiMaterial('materialPlane', this._scene);
        materialPlane.subMaterials.push(floorPlane);

        plane.material = materialPlane;
    }

    displayGameControls() {
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("textUI");

        const playerInfo = new GUI.TextBlock("playerInfo");
        playerInfo.text = `Room name: ${this._game.name}      Player: ${this._game.sessionId}`.toUpperCase();
        playerInfo.color = "#eaeaea";
        playerInfo.fontFamily = "Roboto";
        playerInfo.fontSize = 20;
        playerInfo.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        playerInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        playerInfo.paddingTop = "10px";
        playerInfo.paddingLeft = "10px";
        playerInfo.outlineColor = "#000000";
        advancedTexture.addControl(playerInfo);

        const instructions = new GUI.TextBlock("instructions");
        instructions.text = "CLICK ANYWHERE ON THE GROUND!";
        instructions.color = "#fff000"
        instructions.fontFamily = "Roboto";
        instructions.fontSize = 24;
        instructions.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        instructions.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        instructions.paddingBottom = "10px";
        advancedTexture.addControl(instructions);

        // back to menu button
        const button = GUI.Button.CreateImageWithCenterTextButton("back", "<- BACK", "./public/btn-default.png");
        button.width = "100px";
        button.height = "50px";
        button.fontFamily = "Roboto";
        button.thickness = 0;
        button.color = "#f8f8f8";
        button.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        button.paddingTop = "10px";
        button.paddingRight = "10px";
        button.onPointerClickObservable.add(async () => {
            await this._game.leave(true);
        });
        advancedTexture.addControl(button);
    }

    bootstrap(): void {
        this._scene = new BABYLON.Scene(this._engine);
        this._light = new BABYLON.HemisphericLight("pointLight", new BABYLON.Vector3(), this._scene);
        this._camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 550, BABYLON.Vector3.Zero(), this._scene);
        this._camera.setTarget(BABYLON.Vector3.Zero());

        createSkyBox(this._scene);
        this.createGround();
        this.displayGameControls();
        this.initPlayers();

        this._scene.onPointerDown = (event, pointer) => {
            if (event.button == 0) {
                const targetPosition = pointer.pickedPoint.clone();

                // Position adjustments for the current play ground.
                targetPosition.y = -1;
                if (targetPosition.x > 245) targetPosition.x = 245;
                else if (targetPosition.x < -245) targetPosition.x = -245;
                if (targetPosition.z > 245) targetPosition.z = 245;
                else if (targetPosition.z < -245) targetPosition.z = -245;

                this._players[this._game.sessionId].targetPosition = targetPosition;
                this.move(this._players[this._game.sessionId]);

                // Send position update to the server
                this._game.send("updatePosition", {
                    x: targetPosition.x,
                    y: targetPosition.y,
                    z: targetPosition.z,
                });
            }
        };

        this.doRender();
    }

    move(player: Player): void {
        BABYLON.Animation.CreateAndStartAnimation("animate", player.entity, "position",
            60, 120, player.entity.position, player.targetPosition,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }

    private gotoMenu() {
        this._scene.dispose();
        const menu = new Menu('renderCanvas');
        menu.createMenu();
    }

    private doRender(): void {
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
