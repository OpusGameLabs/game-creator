import * as THREE from 'three';
import { GAME, CAMERA, COLORS, GAMEPLAY, STREET, ENVELOPE } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { StreetGenerator } from '../systems/StreetGenerator.js';
import { SpectacleSystem } from '../systems/SpectacleSystem.js';
import { Player } from '../gameplay/Player.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { Homeowner } from '../entities/Homeowner.js';
import { PanicPoint } from '../entities/PanicPoint.js';
import { Menu } from '../ui/Menu.js';

export class Game {
  constructor() {
    this.clock = new THREE.Clock();

    // Renderer (DPR capped for mobile GPU performance)
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GAME.MAX_DPR));
    this.renderer.setClearColor(COLORS.SKY);
    this.renderer.shadowMap.enabled = true;
    document.body.prepend(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera -- fixed chase camera behind and above the player
    this.camera = new THREE.PerspectiveCamera(
      GAME.FOV, window.innerWidth / window.innerHeight, GAME.NEAR, GAME.FAR
    );
    this.camera.position.set(0, CAMERA.HEIGHT, CAMERA.DISTANCE);
    this.camera.lookAt(0, 1, -CAMERA.LOOK_AHEAD);

    // Systems
    this.input = new InputSystem();
    this.level = new LevelBuilder(this.scene);
    this.streetGen = null;
    this.spectacle = new SpectacleSystem(this.scene, this.camera);
    this.menu = new Menu();
    this.player = null;

    // Entity arrays managed by Game (homeowners, panic points)
    this.homeowners = [];
    this.panicPoints = [];

    // Events
    eventBus.on(Events.GAME_RESTART, () => this.restart());

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Auto-start game (no title screen -- Play.fun handles the chrome)
    this.startGame();

    // Start render loop (official Three.js pattern -- pauses when tab hidden)
    this.renderer.setAnimationLoop(() => this.animate());
  }

  startGame() {
    gameState.reset();
    gameState.started = true;

    // Clean up old entities
    this._clearEntities();

    // Create street generator
    if (this.streetGen) this.streetGen.reset();
    else this.streetGen = new StreetGenerator(this.scene);

    // Create player
    this.player = new Player(this.scene);
    this.input.setGameActive(true);

    // Spectacle entrance effect
    eventBus.emit(Events.SPECTACLE_ENTRANCE);
  }

  restart() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this._clearEntities();
    this.spectacle.reset();
    this.startGame();
  }

  _clearEntities() {
    for (const hw of this.homeowners) hw.dispose(this.scene);
    for (const pp of this.panicPoints) pp.dispose(this.scene);
    this.homeowners = [];
    this.panicPoints = [];
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);

    this.input.update();

    if (gameState.started && !gameState.gameOver && this.player) {
      const playerZ = this.player.mesh.position.z;

      // Handle throw input here (Game has access to streetGen for targeting)
      if (this.input.throwPressed) {
        const target = this._findThrowTarget(this.player.mesh.position);
        this.player.throwEnvelope(target);
      }

      // Update player (auto-run + input)
      this.player.update(delta, this.input);

      // Update street generator (houses, agents, street surface)
      this.streetGen.update(delta, playerZ);

      // Check envelope-house collisions
      this._checkEnvelopeHits();

      // Check player-agent collisions
      this._checkAgentCollisions();

      // Check player-panicPoint collection
      this._checkPanicCollection();

      // Update homeowners and spawn panic points
      this._updateHomeowners(delta);

      // Update panic points
      this._updatePanicPoints(delta);

      // Update camera to follow player
      this._updateCamera();

      // Update spectacle system (particles, shake, flashes, trails)
      this.spectacle.update(delta, this.player.mesh.position, this.player.envelopes);

      // Apply spectacle camera effects (shake, zoom, entrance) after base camera is set
      this.spectacle.applyCameraEffects();

      // Update directional light to follow player
      this.level.updateLightTarget(this.player.mesh.position);
    }

    this.renderer.render(this.scene, this.camera);
  }

  _checkEnvelopeHits() {
    const playerZ = this.player.mesh.position.z;
    const nearbyHouses = this.streetGen.getHousesInRange(playerZ, 50);

    for (const envelope of this.player.envelopes) {
      if (!envelope.alive) continue;

      for (const house of nearbyHouses) {
        if (house.isHit) continue;

        if (envelope.checkHouse(house)) {
          // Hit!
          house.hit();
          envelope.alive = false;
          gameState.housesHit++;

          // Combo
          gameState.incrementCombo();
          eventBus.emit(Events.COMBO_CHANGED, { combo: gameState.combo });

          // Score for hitting the house
          const earned = gameState.addScore(1);
          eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score, earned });
          eventBus.emit(Events.HOUSE_HIT, {
            x: house.mesh.position.x,
            z: house.mesh.position.z,
            combo: gameState.combo,
          });

          // Spectacle events
          eventBus.emit(Events.SPECTACLE_HIT, { combo: gameState.combo });
          if (gameState.combo >= 3) {
            eventBus.emit(Events.SPECTACLE_COMBO, { combo: gameState.combo });
          }
          if (gameState.combo >= 5) {
            eventBus.emit(Events.SPECTACLE_STREAK, { combo: gameState.combo });
          }

          // Spawn homeowner from the hit house
          this._spawnHomeowner(house);
          break; // one envelope hits one house
        }
      }
    }
  }

  _spawnHomeowner(house) {
    const homeowner = new Homeowner(
      house.mesh.position,
      house.side
    );
    this.scene.add(homeowner.mesh);
    this.homeowners.push(homeowner);
    eventBus.emit(Events.HOMEOWNER_SPAWNED, {
      x: house.mesh.position.x,
      z: house.mesh.position.z,
    });
  }

  _updateHomeowners(delta) {
    for (let i = this.homeowners.length - 1; i >= 0; i--) {
      const hw = this.homeowners[i];
      hw.update(delta);

      // Collect any panic point drops
      const drops = hw.consumeDrops();
      for (const drop of drops) {
        const pp = new PanicPoint(drop.x, drop.z);
        this.scene.add(pp.mesh);
        this.panicPoints.push(pp);
      }

      // Remove expired homeowners
      if (!hw.alive) {
        hw.dispose(this.scene);
        this.homeowners.splice(i, 1);
      }
    }
  }

  _updatePanicPoints(delta) {
    for (let i = this.panicPoints.length - 1; i >= 0; i--) {
      const pp = this.panicPoints[i];
      pp.update(delta);

      if (!pp.alive) {
        pp.dispose(this.scene);
        this.panicPoints.splice(i, 1);
      }
    }
  }

  _checkPanicCollection() {
    const playerPos = this.player.mesh.position;
    for (const pp of this.panicPoints) {
      if (pp.checkPlayer(playerPos)) {
        if (pp.collect()) {
          const earned = gameState.addScore(1);
          eventBus.emit(Events.PANIC_COLLECTED, { score: gameState.score, earned });
          eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score, earned });
        }
      }
    }
  }

  _checkAgentCollisions() {
    if (this.player.isInvincible) return;

    const playerPos = this.player.mesh.position;
    const nearbyAgents = this.streetGen.getAgentsInRange(playerPos.z, 5);

    for (const agent of nearbyAgents) {
      if (agent.checkPlayer(playerPos)) {
        agent.hasCollided = true;
        this.player.takeDamage();
        eventBus.emit(Events.AGENT_COLLISION, {
          x: agent.mesh.position.x,
          z: agent.mesh.position.z,
        });

        // Reset combo on hit
        gameState.resetCombo();
        eventBus.emit(Events.COMBO_CHANGED, { combo: 0 });
        break;
      }
    }

    // Near-miss detection for spectacle
    for (const agent of nearbyAgents) {
      if (!agent.hasCollided && agent.alive) {
        const dx = agent.mesh.position.x - playerPos.x;
        const dz = agent.mesh.position.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5 && dist > 0.7) {
          eventBus.emit(Events.SPECTACLE_NEAR_MISS, { distance: dist });
        }
      }
    }
  }

  /**
   * Find the nearest unhit house ahead of the player within targeting range.
   * Alternates sides (left/right) to spread throws evenly.
   * @returns {THREE.Vector3|null}
   */
  _findThrowTarget(playerPos) {
    const houses = this.streetGen.getHousesInRange(playerPos.z, ENVELOPE.TARGET_RANGE);

    // Filter to houses ahead of the player (lower Z = further ahead)
    const ahead = houses.filter(h => h.mesh.position.z < playerPos.z);
    if (ahead.length === 0) return null;

    // Sort by distance (nearest first)
    ahead.sort((a, b) => {
      const distA = Math.abs(a.mesh.position.z - playerPos.z);
      const distB = Math.abs(b.mesh.position.z - playerPos.z);
      return distA - distB;
    });

    // Pick the nearest house — prefer whichever side is closer to the player's X
    let best = null;
    let bestDist = Infinity;

    for (const house of ahead) {
      const dx = house.mesh.position.x - playerPos.x;
      const dz = house.mesh.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) {
        bestDist = dist;
        best = house;
      }
    }

    return best ? best.mesh.position.clone() : null;
  }

  _updateCamera() {
    const pPos = this.player.mesh.position;
    // Chase camera behind and above player
    this.camera.position.x = pPos.x * 0.3; // slight follow on X for feel
    this.camera.position.y = CAMERA.HEIGHT;
    this.camera.position.z = pPos.z + CAMERA.DISTANCE;
    this.camera.lookAt(pPos.x * 0.5, 1, pPos.z - CAMERA.LOOK_AHEAD);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
