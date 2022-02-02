import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Client, Room } from "colyseus.js";
import Game from './game';

const ROOM_NAME = "StrawberryBubblegum";
const SERVER = "wss://playcanvas-colyseus-demo.herokuapp.com";

export default class Menu {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _light: BABYLON.Light;
    private _advancedTexture: GUI.AdvancedDynamicTexture;

    private _colyseus: Client = new Client(SERVER);

    constructor(canvasElement : string) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);
    }

    private createMenuButton(name: string, text: string, topPadding: string): GUI.Button {
        const button = GUI.Button.CreateSimpleButton(name, text);
        button.width = "200px";
        button.height = "50px";
        button.top = topPadding;
        this._advancedTexture.addControl(button);
        return button;
    }

    private async createGame(method: string): Promise<void> {
        let game: Game;
        switch (method) {
            case "create":
                game = new Game(this._canvas, this._engine, await this._colyseus.create(ROOM_NAME));
                break;
            case "join":
                game = new Game(this._canvas, this._engine, await this._colyseus.join(ROOM_NAME));
                break;
            default:
                game = new Game(this._canvas, this._engine, await this._colyseus.joinOrCreate(ROOM_NAME));
        }
        this._scene.dispose();
        game.bootstrap();
    }

    createMenu() : void {
        this._scene = new BABYLON.Scene(this._engine);
        this._camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), this._scene);
        this._camera.useAutoRotationBehavior = true;
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, true);
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // Colyseus logo
        const logo = new GUI.Image("ColyseusLogo", "./public/colyseus.png");
        logo.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        logo.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP - 10;
        logo.height = "30%";
        logo.width = "30%";
        this._advancedTexture.addControl(logo);

        // Skybox
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, this._scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./public/textures/skybox", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        const createGameButton = this.createMenuButton("createGame", "Create Game", "0");
        createGameButton.onPointerClickObservable.add(async function () {
            await this.createGame("create");
        }.bind(this));

        const joinGameButton = this.createMenuButton("joinGame", "Join Game", "70px");
        joinGameButton.onPointerClickObservable.add(async function () {
            await this.createGame("join");
        }.bind(this));

        const createOrJoinButton = this.createMenuButton("createOrJoinGame", "Create Or Join", "140px");
        createOrJoinButton.onPointerClickObservable.add(async function () {
            await this.createGame("joinOrCreate");
        }.bind(this));

        this.doRender();
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
