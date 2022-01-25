import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import Game from './game';

export default class Menu {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _light: BABYLON.Light;
    private _advancedTexture: GUI.AdvancedDynamicTexture;

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

    private createGame(): void {
        // Create a basic BJS Scene object.
        const game = new Game(this._canvas, this._engine);
        this._scene = game.createGame();
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

    createMenu() : void {
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        this._camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), this._scene);
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._camera.attachControl(this._canvas, true);
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const createGameButton = this.createMenuButton("createGame", "Create Game", "0");
        createGameButton.onPointerClickObservable.add(function () {
            this.createGame();
        }.bind(this));

        const joinGameButton = this.createMenuButton("joinGame", "Join Game", "70px");

        const createOrJoinButton = this.createMenuButton("createOrJoinGame", "Create Or Join", "140px");

        this.doRender();
    }
}
