import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";

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
            const sphere = BABYLON.MeshBuilder.CreateSphere(`player-${sessionId}`, {segments: 8, diameter: 16}, this._scene);
            // Set player mesh properties
            const sphereMaterial = new BABYLON.StandardMaterial(`playerMat-${sessionId}`, this._scene);
            sphereMaterial.emissiveColor = sessionId === this._game.sessionId? BABYLON.Color3.FromHexString("#ff9900"): BABYLON.Color3.Gray();
            sphere.material = sphereMaterial;

            // Set player spawning position
            sphere.position.set(player.x, 0.5, player.z);
            this._players[sessionId] = {
                entity: sphere,
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

    createGround(): void {
        //Creation of a plane
        const plane = BABYLON.MeshBuilder.CreatePlane("plane", {size:500}, this._scene);
        plane.position.y = -8;
        plane.rotation.x = Math.PI / 2;

        let floorPlane = new BABYLON.StandardMaterial('floorTexturePlane', this._scene);
        floorPlane.diffuseTexture = new BABYLON.Texture('./public/ground.jpg', this._scene);
        floorPlane.backFaceCulling = false; // Always show the front and the back of an element

        let materialPlane = new BABYLON.MultiMaterial('materialPlane', this._scene);
        materialPlane.subMaterials.push(floorPlane);

        plane.material = materialPlane;
    }

    displayGameTexts() {
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("textUI");

        const roomName = new GUI.TextBlock("roomNameText");
        roomName.text = `Room name: ${this._game.name}`;
        roomName.color = "white";
        roomName.fontSize = 24;
        roomName.paddingBottom = 360;
        roomName.paddingRight = 800;

        const playerId = new GUI.TextBlock("playerIdText");
        playerId.text = `Player ID: ${this._game.sessionId}`;
        playerId.color = "white";
        playerId.fontSize = 24;
        playerId.paddingBottom = 300;
        playerId.paddingRight = 800;

        advancedTexture.addControl(roomName);
        advancedTexture.addControl(playerId);
    }

    bootstrap(): void {
        this._scene = new BABYLON.Scene(this._engine);
        this._light = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-60, 60, 80), this._scene);

        // Skybox
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, this._scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./public/textures/skybox", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        this._camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), this._scene);
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, true);

        this.createGround();
        this.displayGameTexts();
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
