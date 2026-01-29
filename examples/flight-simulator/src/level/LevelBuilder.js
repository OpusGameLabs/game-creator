import * as THREE from 'three';
import { LEVEL, COLORS } from '../core/Constants.js';

export class LevelBuilder {
  constructor(scene) {
    this.scene = scene;

    this.buildGround();
    this.buildLighting();
    this.buildFog();
    this.buildMountains();
    this.buildTrees();
    this.buildClouds();
  }

  buildGround() {
    const geometry = new THREE.PlaneGeometry(LEVEL.GROUND_SIZE, LEVEL.GROUND_SIZE, 64, 64);

    // Subtle vertex color variation for terrain patches
    const colors = [];
    const baseColor = new THREE.Color(LEVEL.GROUND_COLOR);
    const posAttr = geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const variation = 0.85 + Math.random() * 0.3;
      colors.push(
        baseColor.r * variation,
        baseColor.g * variation,
        baseColor.b * variation
      );
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  buildLighting() {
    const ambient = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    directional.position.set(50, 100, 30);
    directional.castShadow = true;
    this.scene.add(directional);

    // Hemisphere light for sky/ground color blending
    const hemi = new THREE.HemisphereLight(
      COLORS.HEMI_SKY,
      COLORS.HEMI_GROUND,
      COLORS.HEMI_INTENSITY
    );
    this.scene.add(hemi);
  }

  buildFog() {
    this.scene.fog = new THREE.Fog(LEVEL.FOG_COLOR, LEVEL.FOG_NEAR, LEVEL.FOG_FAR);
  }

  buildMountains() {
    const mountainMat = new THREE.MeshLambertMaterial({ color: LEVEL.MOUNTAIN_COLOR });
    const snowMat = new THREE.MeshLambertMaterial({ color: LEVEL.MOUNTAIN_SNOW_COLOR });

    for (let i = 0; i < LEVEL.MOUNTAIN_COUNT; i++) {
      const radius = LEVEL.MOUNTAIN_RADIUS_MIN + Math.random() * (LEVEL.MOUNTAIN_RADIUS_MAX - LEVEL.MOUNTAIN_RADIUS_MIN);
      const height = LEVEL.MOUNTAIN_HEIGHT_MIN + Math.random() * (LEVEL.MOUNTAIN_HEIGHT_MAX - LEVEL.MOUNTAIN_HEIGHT_MIN);
      const segments = 6 + Math.floor(Math.random() * 4);

      const group = new THREE.Group();

      // Mountain body
      const bodyGeo = new THREE.ConeGeometry(radius, height, segments);
      const body = new THREE.Mesh(bodyGeo, mountainMat);
      body.position.y = height / 2;
      group.add(body);

      // Snow cap on tall mountains
      if (height > 35) {
        const capHeight = height * 0.25;
        const capRadius = radius * 0.35;
        const capGeo = new THREE.ConeGeometry(capRadius, capHeight, segments);
        const cap = new THREE.Mesh(capGeo, snowMat);
        cap.position.y = height - capHeight / 2;
        group.add(cap);
      }

      group.position.set(
        (Math.random() - 0.5) * LEVEL.MOUNTAIN_SPREAD * 2,
        0,
        (Math.random() - 0.5) * LEVEL.MOUNTAIN_SPREAD * 2
      );
      group.rotation.y = Math.random() * Math.PI;
      this.scene.add(group);
    }
  }

  buildTrees() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: LEVEL.TREE_TRUNK_COLOR });
    const leafMat = new THREE.MeshLambertMaterial({ color: LEVEL.TREE_COLOR });

    for (let i = 0; i < LEVEL.TREE_COUNT; i++) {
      const group = new THREE.Group();

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 3, 5);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.5;
      group.add(trunk);

      // Layered canopy (2-3 cones for fuller look)
      const layers = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < layers; j++) {
        const canopyGeo = new THREE.ConeGeometry(1.8 - j * 0.4, 2.5, 6);
        const canopy = new THREE.Mesh(canopyGeo, leafMat);
        canopy.position.y = 3.5 + j * 1.2;
        group.add(canopy);
      }

      group.position.set(
        (Math.random() - 0.5) * LEVEL.MOUNTAIN_SPREAD * 1.5,
        0,
        (Math.random() - 0.5) * LEVEL.MOUNTAIN_SPREAD * 1.5
      );
      const scale = 0.8 + Math.random() * 1.5;
      group.scale.set(scale, scale, scale);
      this.scene.add(group);
    }
  }

  buildClouds() {
    const cloudMat = new THREE.MeshBasicMaterial({
      color: LEVEL.CLOUD_COLOR,
      transparent: true,
      opacity: 0.8,
      fog: false,
    });

    for (let i = 0; i < LEVEL.CLOUD_COUNT; i++) {
      const cloud = new THREE.Group();

      // Build cloud from 3-5 overlapping spheres with varied sizes
      const puffCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < puffCount; j++) {
        const size = 3 + Math.random() * 5;
        const puffGeo = new THREE.SphereGeometry(size, 8, 6);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 5
        );
        cloud.add(puff);
      }

      cloud.position.set(
        (Math.random() - 0.5) * LEVEL.CLOUD_SPREAD * 2,
        LEVEL.CLOUD_MIN_Y + Math.random() * (LEVEL.CLOUD_MAX_Y - LEVEL.CLOUD_MIN_Y),
        (Math.random() - 0.5) * LEVEL.CLOUD_SPREAD * 2
      );
      this.scene.add(cloud);
    }
  }
}
