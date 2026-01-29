import * as THREE from 'three';
import { SKY } from '../core/Constants.js';

export class SkyDome {
  constructor(scene) {
    this.scene = scene;
    this.buildDome();
    this.buildSun();
  }

  buildDome() {
    const geo = new THREE.SphereGeometry(SKY.DOME_RADIUS, 32, 16);

    // Vertex color gradient: deep blue at top → warm horizon at bottom
    const colors = [];
    const topColor = new THREE.Color(SKY.TOP_COLOR);
    const horizonColor = new THREE.Color(SKY.HORIZON_COLOR);
    const posAttr = geo.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      // Normalize: top of sphere = 1, equator = 0, bottom = -1
      const t = THREE.MathUtils.clamp((y / SKY.DOME_RADIUS + 0.1) * 0.9, 0, 1);
      const color = new THREE.Color().lerpColors(horizonColor, topColor, t);
      colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
    });

    this.dome = new THREE.Mesh(geo, mat);
    this.scene.add(this.dome);
  }

  buildSun() {
    // Sun glow (large, transparent)
    const glowGeo = new THREE.CircleGeometry(SKY.SUN_GLOW_RADIUS, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: SKY.SUN_GLOW_COLOR,
      transparent: true,
      opacity: 0.3,
      fog: false,
      side: THREE.DoubleSide,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.glow.position.set(0, SKY.SUN_ELEVATION, SKY.SUN_DISTANCE);
    this.glow.lookAt(0, 0, 0);
    this.scene.add(this.glow);

    // Sun core (bright, smaller)
    const sunGeo = new THREE.CircleGeometry(SKY.SUN_RADIUS, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: SKY.SUN_COLOR,
      fog: false,
      side: THREE.DoubleSide,
    });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.sun.position.set(0, SKY.SUN_ELEVATION, SKY.SUN_DISTANCE);
    this.sun.lookAt(0, 0, 0);
    this.scene.add(this.sun);
  }

  update(cameraPosition) {
    // Keep sky dome centered on camera so it never clips
    this.dome.position.copy(cameraPosition);
  }
}
