import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import {Client} from "colyseus.js";
import Game from './game';

const ROOM_NAME = "my_game";
const SERVER = "wss://playcanvas-colyseus-demo.herokuapp.com";

export default class Menu {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _advancedTexture: GUI.AdvancedDynamicTexture;

    private _colyseus: Client = new Client(SERVER);

    private _errorMessage: GUI.TextBlock = new GUI.TextBlock("errorText");

    constructor(canvasElement: string) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);
    }

    createMenu(): void {
        this._scene = new BABYLON.Scene(this._engine);
        this._camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), this._scene);
        this._camera.useAutoRotationBehavior = true;
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, true);
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // Colyseus logo
        const logo = new GUI.Image("ColyseusLogo", "./public/colyseus.png");
        logo.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        logo.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        logo.paddingTop = "50px";
        logo.height = "40%";
        logo.width = "30%";
        this._advancedTexture.addControl(logo);

        // Skybox
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000.0}, this._scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./public/textures/skybox", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        const createGameButton = this.createMenuButton("createGame", "Create Game", "0");
        createGameButton.onPointerClickObservable.add(async function () {
            this.swapControls(false);
            await this.createGame("create");
        }.bind(this));

        const joinGameButton = this.createMenuButton("joinGame", "Join Game", "70px");
        joinGameButton.onPointerClickObservable.add(async function () {
            this.swapControls(false);
            await this.createGame("join");
        }.bind(this));

        const createOrJoinButton = this.createMenuButton("createOrJoinGame", "Create Or Join", "140px");
        createOrJoinButton.onPointerClickObservable.add(async function () {
            this.swapControls(false);
            await this.createGame("joinOrCreate");
        }.bind(this));

        this.initLoadingMessageBox();
        this.initErrorMessageBox();

        this.doRender();
    }

    private createMenuButton(name: string, text: string, topPadding: string): GUI.Button {
        const button = GUI.Button.CreateImageWithCenterTextButton(name, text, "./public/btn-default.png");
        button.width = "200px";
        button.height = "50px";
        button.top = topPadding;
        button.fontFamily = "Trajan Pro";
        button.thickness = 0;
        button.color = "#c0c0c0";
        this._advancedTexture.addControl(button);
        return button;
    }

    private swapControls(isEnabled: boolean) {
        for(let btn of this._advancedTexture.getControlsByType("Button")) {
            btn.isEnabled = isEnabled;
        }
    }

    private async createGame(method: string): Promise<void> {
        let game: Game;
        try{
            switch (method) {
                case "create":
                    this.swapLoadingMessageBox(true);
                    game = new Game(this._canvas, this._engine, await this._colyseus.create(ROOM_NAME));
                    break;
                case "join":
                    this.swapLoadingMessageBox(true);
                    game = new Game(this._canvas, this._engine, await this._colyseus.join(ROOM_NAME));
                    break;
                default:
                    this.swapLoadingMessageBox(true);
                    game = new Game(this._canvas, this._engine, await this._colyseus.joinOrCreate(ROOM_NAME));
            }
            this._scene.dispose();
            game.bootstrap();
        } catch (error) {
            this._errorMessage.text = error.message;
            this.swapErrorMessageBox(true);
        }
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

    private initLoadingMessageBox() {
        const loadingMessage = new GUI.Rectangle("messageBox");
        loadingMessage.thickness = 0;
        loadingMessage.background = "#131313";

        const loadingText = new GUI.TextBlock("loadingText");
        loadingText.text = "Loading..."
        loadingText.fontFamily = "Trajan Pro";
        loadingText.color = "#fad836";
        loadingText.fontSize = "30px";
        loadingMessage.addControl(loadingText);

        // Disabled at initial screen loading
        loadingMessage.isEnabled = false;
        loadingMessage.alpha = 0;
        this._advancedTexture.addControl(loadingMessage);
    }

    private initErrorMessageBox() {
        const errorMessageBox = new GUI.Rectangle("errorMessageBox");
        errorMessageBox.thickness = 0;
        errorMessageBox.background = "#131313";

        this._errorMessage.fontFamily = "Trajan Pro";
        this._errorMessage.color = "#ff1616";
        this._errorMessage.fontSize = "20px";
        this._errorMessage.textWrapping = true;
        errorMessageBox.addControl(this._errorMessage);

        const button = GUI.Button.CreateImageWithCenterTextButton("tryAgainButton", "<- Try Again", "./public/btn-default.png");
        button.width = "200px";
        button.height = "50px";
        button.fontFamily = "Trajan Pro";
        button.thickness = 0;
        button.color = "#c0c0c0";
        button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        button.paddingBottom = "20px";
        button.onPointerClickObservable.add(function () {
            this.swapControls(true);
            this.swapLoadingMessageBox(false);
            this.swapErrorMessageBox(false);
        }.bind(this));
        errorMessageBox.addControl(button);

        // Disabled at initial screen loading
        errorMessageBox.isEnabled = false;
        errorMessageBox.alpha = 0;

        this._advancedTexture.addControl(errorMessageBox);
    }

    private swapLoadingMessageBox(isEnabled: boolean) {
        const messageBox = this._advancedTexture.getControlByName("messageBox");
        messageBox.isEnabled = isEnabled;
        messageBox.alpha = isEnabled? 0.75: 0;
    }

    private swapErrorMessageBox(isEnabled: boolean) {
        this.swapLoadingMessageBox(false);

        const messageBox = this._advancedTexture.getControlByName("errorMessageBox");
        this._advancedTexture.getControlByName("tryAgainButton").isEnabled = true;
        messageBox.isEnabled = isEnabled;
        messageBox.alpha = isEnabled? 0.75: 0;
    }
}
