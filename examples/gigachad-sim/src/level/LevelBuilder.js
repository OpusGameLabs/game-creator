// =============================================================================
// LevelBuilder.js — Constructs the gym environment
// Dark rubber mat floor, gym walls, ceiling, motivational vibes.
// =============================================================================

import * as THREE from 'three';
import { ARENA, COLORS } from '../core/Constants.js';

export class LevelBuilder {
  constructor(scene) {
    this.scene = scene;

    this.buildFloor();
    this.buildWalls();
    this.buildCeiling();
    this.buildLighting();
  }

  buildFloor() {
    // Dark rubber mat floor
    const floorGeo = new THREE.PlaneGeometry(ARENA.WIDTH + 4, ARENA.DEPTH + 4);
    const floorMat = new THREE.MeshLambertMaterial({ color: COLORS.FLOOR });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Floor lines (gym markings)
    const lineMat = new THREE.MeshBasicMaterial({ color: COLORS.FLOOR_LINES });
    const lineGeo = new THREE.PlaneGeometry(0.05, ARENA.DEPTH + 4);
    for (let x = -ARENA.HALF_WIDTH; x <= ARENA.HALF_WIDTH; x += 2) {
      const line = new THREE.Mesh(lineGeo.clone(), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.01, 0);
      this.scene.add(line);
    }

    // Cross lines
    const crossGeo = new THREE.PlaneGeometry(ARENA.WIDTH + 4, 0.05);
    for (let z = -ARENA.DEPTH / 2; z <= ARENA.DEPTH / 2; z += 2) {
      const line = new THREE.Mesh(crossGeo.clone(), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.01, z);
      this.scene.add(line);
    }
  }

  buildWalls() {
    // Back wall
    const backWallGeo = new THREE.PlaneGeometry(ARENA.WIDTH + 4, 18);
    const backWallMat = new THREE.MeshLambertMaterial({ color: COLORS.WALL_BACK });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 9, -ARENA.DEPTH / 2 - 2);
    this.scene.add(backWall);

    // Motivational text on back wall (simple colored strips)
    this._addWallDecor(backWall);

    // Side walls
    const sideWallGeo = new THREE.PlaneGeometry(ARENA.DEPTH + 4, 18);
    const sideWallMat = new THREE.MeshLambertMaterial({ color: COLORS.WALL_SIDE });

    const leftWall = new THREE.Mesh(sideWallGeo, sideWallMat);
    leftWall.position.set(-ARENA.HALF_WIDTH - 2, 9, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo.clone(), sideWallMat);
    rightWall.position.set(ARENA.HALF_WIDTH + 2, 9, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);
  }

  _addWallDecor(wall) {
    // Horizontal accent stripes on the back wall
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const stripeGeo = new THREE.PlaneGeometry(ARENA.WIDTH + 3, 0.3);

    for (let y = 3; y <= 15; y += 4) {
      const stripe = new THREE.Mesh(stripeGeo.clone(), stripeMat);
      stripe.position.set(0, y - 9, 0.01);
      wall.add(stripe);
    }

    // Gold accent strip
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const goldStripe = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.WIDTH, 0.15), goldMat);
    goldStripe.position.set(0, 3, 0.01);
    wall.add(goldStripe);
  }

  buildCeiling() {
    // Dark ceiling
    const ceilGeo = new THREE.PlaneGeometry(ARENA.WIDTH + 4, ARENA.DEPTH + 4);
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 18;
    this.scene.add(ceiling);
  }

  buildLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY);
    this.scene.add(ambient);

    // Main directional light (overhead, slight angle)
    const dirLight = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    dirLight.position.set(2, 15, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -ARENA.HALF_WIDTH;
    dirLight.shadow.camera.right = ARENA.HALF_WIDTH;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -5;
    this.scene.add(dirLight);

    // Spot light (gym spotlight effect pointing down at center)
    const spot = new THREE.SpotLight(COLORS.SPOT_LIGHT, COLORS.SPOT_INTENSITY, 25, Math.PI / 4, 0.5);
    spot.position.set(0, 16, 2);
    spot.target.position.set(0, 0, 0);
    this.scene.add(spot);
    this.scene.add(spot.target);
  }
}
