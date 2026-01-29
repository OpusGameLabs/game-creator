import * as THREE from 'three';
import { LEVEL } from '../core/Constants.js';

export class SkyDome {
  constructor(scene) {
    this.scene = scene;

    // Gradient sky sphere
    const skyGeo = new THREE.SphereGeometry(150, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x2196f3) },
        bottomColor: { value: new THREE.Color(0x87ceeb) },
        horizonColor: { value: new THREE.Color(0xffe0b2) },
        offset: { value: 10 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          vec3 sky = mix(horizonColor, topColor, t);
          // Blend in bottom color below horizon
          float below = max(-h * 2.0, 0.0);
          sky = mix(sky, bottomColor, below);
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
    });

    this.mesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.mesh);

    // Clouds — simple white translucent spheres
    this.clouds = [];
    this.buildClouds();
  }

  buildClouds() {
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < 30; i++) {
      const group = new THREE.Group();
      const puffCount = 3 + Math.floor(Math.random() * 3);

      for (let j = 0; j < puffCount; j++) {
        const size = 1.5 + Math.random() * 2.5;
        const geo = new THREE.SphereGeometry(size, 8, 6);
        const puff = new THREE.Mesh(geo, cloudMat);
        puff.position.set(
          (j - puffCount / 2) * 2,
          (Math.random() - 0.5) * 1,
          (Math.random() - 0.5) * 1.5
        );
        puff.scale.y = 0.6;
        group.add(puff);
      }

      group.position.set(
        -50 + Math.random() * 300,
        15 + Math.random() * 25,
        -15 + Math.random() * 30
      );

      this.scene.add(group);
      this.clouds.push(group);
    }
  }

  update(birdX) {
    // Move sky dome with bird
    this.mesh.position.x = birdX;
  }
}
