import * as THREE from 'three';
import { LEVEL, COLORS, ASSET_PATHS, MODEL_CONFIG } from '../core/Constants.js';
import { loadModel, loadAnimatedModel } from './AssetLoader.js';

export class LevelBuilder {
  constructor(scene) {
    this.scene = scene;
    this.mixers = [];

    this.buildGround();
    this.buildGrid();
    this.buildLighting();
    this.buildFog();
    this.buildScenery();
  }

  buildGround() {
    const geo = new THREE.PlaneGeometry(LEVEL.GROUND_SIZE, LEVEL.GROUND_SIZE);
    const mat = new THREE.MeshLambertMaterial({ color: LEVEL.GROUND_COLOR });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  buildGrid() {
    const grid = new THREE.GridHelper(LEVEL.GROUND_SIZE, 40, 0x3a6c1e, 0x3a6c1e);
    grid.position.y = 0.01;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  buildLighting() {
    this.scene.add(new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY));

    const dir = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    this.scene.add(dir);
  }

  buildFog() {
    this.scene.fog = new THREE.Fog(LEVEL.FOG_COLOR, LEVEL.FOG_NEAR, LEVEL.FOG_FAR);
  }

  async buildScenery() {
    // Barrels near spawn
    for (const pos of [
      { x: 4, z: 4 }, { x: -4, z: -4 }, { x: 6, z: -3 },
      { x: -7, z: 5 }, { x: 10, z: -8 },
    ]) {
      await this.placeModel(ASSET_PATHS.BARREL, MODEL_CONFIG.BARREL, pos);
    }

    // Crates
    for (const pos of [
      { x: -3, z: 6 }, { x: 7, z: 2 }, { x: -6, z: -7 },
      { x: 3, z: -8 }, { x: -10, z: 3 },
    ]) {
      await this.placeModel(ASSET_PATHS.CRATE, MODEL_CONFIG.CRATE, pos);
    }

    // Robot enemies (animated — have Walking, Idle, Dance, etc)
    for (const pos of [
      { x: 8, z: -5 }, { x: -6, z: 8 }, { x: -10, z: -8 },
    ]) {
      await this.placeAnimatedModel(ASSET_PATHS.ENEMY, MODEL_CONFIG.ENEMY, pos, 'Walking');
    }

    // Foxes (animated — have Walk, Run, Survey)
    for (const pos of [
      { x: 5, z: 8 }, { x: -8, z: -2 },
    ]) {
      await this.placeAnimatedModel(ASSET_PATHS.FOX, MODEL_CONFIG.FOX, pos, 'Walk');
    }
  }

  async placeAnimatedModel(assetPath, config, pos, preferredClip) {
    try {
      const { model, clips } = await loadAnimatedModel(assetPath);
      model.scale.setScalar(config.scale);
      model.rotation.y = config.rotationY + Math.random() * Math.PI * 2;
      model.position.set(pos.x, config.offsetY, pos.z);
      this.scene.add(model);

      if (clips.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        // Try to play the preferred clip, else first
        const clip = clips.find(c => c.name === preferredClip) || clips[0];
        mixer.clipAction(clip).play();
        this.mixers.push(mixer);
      }
    } catch (err) {
      console.warn(`Failed to load ${assetPath}:`, err.message);
    }
  }

  async placeModel(assetPath, config, pos) {
    try {
      const model = await loadModel(assetPath);
      model.scale.setScalar(config.scale);
      model.rotation.y = config.rotationY + Math.random() * Math.PI * 2;
      model.position.set(pos.x, config.offsetY, pos.z);
      this.scene.add(model);
    } catch (err) {
      console.warn(`Failed to load ${assetPath}:`, err.message);
    }
  }

  update(delta) {
    for (const mixer of this.mixers) {
      mixer.update(delta);
    }
  }
}
