import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GAME, CAMERA, COLORS, CHARACTERS } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../gameplay/Player.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { Menu } from '../ui/Menu.js';
import { preloadAll } from '../level/AssetLoader.js';

export class Game {
  constructor() {
    this.clock = new THREE.Clock();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GAME.MAX_DPR));
    this.renderer.setClearColor(COLORS.SKY);
    this.renderer.shadowMap.enabled = true;
    document.body.prepend(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      GAME.FOV, window.innerWidth / window.innerHeight, GAME.NEAR, GAME.FAR
    );
    this.camera.position.set(0, CAMERA.HEIGHT, CAMERA.DISTANCE);

    // OrbitControls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enablePan = false;
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.1;
    this.orbitControls.minDistance = CAMERA.MIN_DISTANCE;
    this.orbitControls.maxDistance = CAMERA.MAX_DISTANCE;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.orbitControls.target.set(0, 1, 0);
    this.orbitControls.update();

    // Systems
    this.input = new InputSystem();
    this.level = new LevelBuilder(this.scene);
    this.menu = new Menu();
    this.player = null;

    // Events
    eventBus.on(Events.GAME_RESTART, () => this.restart());
    window.addEventListener('resize', () => this.onResize());

    // Preload all characters, then start
    this._preloadAndStart();

    // Start render loop immediately (shows scene while loading)
    this.renderer.setAnimationLoop(() => this.animate());
  }

  async _preloadAndStart() {
    const loadingEl = document.getElementById('loading');
    const paths = CHARACTERS.map(c => c.path);

    try {
      await preloadAll(paths, (loaded, total) => {
        if (loadingEl) {
          loadingEl.textContent = `Loading characters... ${loaded}/${total}`;
        }
      });
    } catch (err) {
      console.warn('Some characters failed to preload:', err);
    }

    if (loadingEl) loadingEl.style.display = 'none';
    this.startGame();
  }

  startGame() {
    gameState.reset();
    gameState.started = true;
    this.player = new Player(this.scene);
  }

  restart() {
    if (this.player) { this.player.destroy(); this.player = null; }
    this.startGame();
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);

    this.level.update(delta);

    if (gameState.started && !gameState.gameOver && this.player) {
      const azimuth = this.orbitControls.getAzimuthalAngle();

      const oldX = this.player.mesh.position.x;
      const oldZ = this.player.mesh.position.z;

      this.player.update(delta, this.input, azimuth);

      // Camera follows player
      const dx = this.player.mesh.position.x - oldX;
      const dz = this.player.mesh.position.z - oldZ;
      this.orbitControls.target.x += dx;
      this.orbitControls.target.z += dz;
      this.orbitControls.target.y = this.player.mesh.position.y + 1;
      this.camera.position.x += dx;
      this.camera.position.z += dz;
    }

    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);

    // Debug HUD
    const dbg = document.getElementById('debug');
    if (dbg && this.player) {
      const p = this.player.mesh.position;
      const anim = this.player.activeAction?._clip?.name || '...';
      dbg.textContent = [
        `${this.player.characterName}  [C] cycle`,
        `anim: ${anim}`,
        `pos: ${p.x.toFixed(1)}, ${p.z.toFixed(1)}`,
      ].join('\n');
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
