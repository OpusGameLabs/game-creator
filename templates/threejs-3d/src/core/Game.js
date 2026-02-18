import * as THREE from 'three';
import { GAME, CAMERA, COLORS, IS_MOBILE } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../gameplay/Player.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { Menu } from '../ui/Menu.js';

export class Game {
  constructor() {
    this.clock = new THREE.Clock();

    // Renderer (DPR capped for mobile GPU performance)
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GAME.MAX_DPR));
    this.renderer.setClearColor(COLORS.SKY);
    document.body.prepend(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      GAME.FOV,
      window.innerWidth / window.innerHeight,
      GAME.NEAR,
      GAME.FAR
    );
    this.camera.position.set(CAMERA.OFFSET_X, CAMERA.OFFSET_Y, CAMERA.OFFSET_Z);
    this.camera.lookAt(0, CAMERA.LOOK_OFFSET_Y, 0);

    // Systems
    this.input = new InputSystem();
    this.level = new LevelBuilder(this.scene);
    this.menu = new Menu();
    this.player = null;

    // Events
    eventBus.on(Events.GAME_RESTART, () => this.restart());

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Auto-start game (no title screen — Play.fun handles the chrome)
    this.startGame();

    // Start render loop
    this.animate();
  }

  startGame() {
    gameState.reset();
    gameState.started = true;
    this.player = new Player(this.scene);
    this.input.setGameActive(true);
  }

  restart() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.startGame();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);

    this.input.update();

    if (gameState.started && !gameState.gameOver && this.player) {
      this.player.update(delta, this.input);

      // Update camera to follow player
      const p = this.player.mesh.position;
      this.camera.position.set(
        p.x + CAMERA.OFFSET_X,
        CAMERA.OFFSET_Y,
        p.z + CAMERA.OFFSET_Z
      );
      this.camera.lookAt(p.x, CAMERA.LOOK_OFFSET_Y, p.z);
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
