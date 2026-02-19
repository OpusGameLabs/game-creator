import * as THREE from 'three';
import { TUNNEL, COLORS } from '../core/Constants.js';

export class LevelBuilder {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.particles = [];
    this._time = 0;

    this.buildLighting();
    this.buildFog();
    this.buildTunnel();
    this.buildFloor();
    this.buildParticles();
    this.buildScanlines();
  }

  buildLighting() {
    const ambient = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    directional.position.set(0, 10, 5);
    this.scene.add(directional);

    // Point light that follows the player (will be moved in update)
    this.playerLight = new THREE.PointLight(0x00ff66, 0.8, 30);
    this.playerLight.position.set(0, 3, 0);
    this.scene.add(this.playerLight);
  }

  buildFog() {
    this.scene.fog = new THREE.Fog(COLORS.FOG_COLOR, COLORS.FOG_NEAR, COLORS.FOG_FAR);
  }

  buildTunnel() {
    // Create wireframe tunnel segments
    this._tunnelGeo = new THREE.BoxGeometry(
      TUNNEL.WIDTH,
      TUNNEL.HEIGHT,
      TUNNEL.SEGMENT_LENGTH
    );
    this._tunnelMat = new THREE.MeshBasicMaterial({
      color: TUNNEL.COLOR,
      wireframe: TUNNEL.WIREFRAME,
      transparent: true,
      opacity: TUNNEL.OPACITY,
    });

    for (let i = 0; i < TUNNEL.VISIBLE_SEGMENTS; i++) {
      const segment = new THREE.Mesh(this._tunnelGeo, this._tunnelMat);
      // Position segments extending into -Z
      segment.position.set(0, TUNNEL.HEIGHT * 0.5 - 0.5, -i * TUNNEL.SEGMENT_LENGTH);
      this.scene.add(segment);
      this.segments.push(segment);
    }
  }

  buildFloor() {
    // Procedural grid texture for the floor
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 512;
    gridCanvas.height = 512;
    const ctx = gridCanvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#001a00';
    ctx.fillRect(0, 0, 512, 512);

    // Green grid lines
    ctx.strokeStyle = '#00440088';
    ctx.lineWidth = 1;
    const gridSize = 32; // pixels per grid cell
    for (let x = 0; x <= 512; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Brighter lines at major intervals
    ctx.strokeStyle = '#008800aa';
    ctx.lineWidth = 2;
    const majorSize = gridSize * 4;
    for (let x = 0; x <= 512; x += majorSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += majorSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    this._gridTexture = new THREE.CanvasTexture(gridCanvas);
    this._gridTexture.wrapS = THREE.RepeatWrapping;
    this._gridTexture.wrapT = THREE.RepeatWrapping;
    // Repeat so the grid tiles across the floor
    const floorLength = TUNNEL.SEGMENT_LENGTH * TUNNEL.VISIBLE_SEGMENTS * 2;
    this._gridTexture.repeat.set(TUNNEL.WIDTH / 4, floorLength / 4);

    const floorGeo = new THREE.PlaneGeometry(TUNNEL.WIDTH, floorLength);
    const floorMat = new THREE.MeshPhongMaterial({
      map: this._gridTexture,
      emissive: 0x001100,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.95,
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.01; // Slightly below ground to avoid z-fighting

    // Store initial UV offset for scrolling
    this._floorScrollOffset = 0;

    this.scene.add(this.floor);

    this._floorGeo = floorGeo;
    this._floorMat = floorMat;
  }

  buildParticles() {
    // Floating green code particles (simple points)
    const count = 200;
    const positions = new Float32Array(count * 3);
    const spread = TUNNEL.WIDTH * 0.4;
    const depth = TUNNEL.SEGMENT_LENGTH * TUNNEL.VISIBLE_SEGMENTS;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread * 2;
      positions[i * 3 + 1] = Math.random() * TUNNEL.HEIGHT;
      positions[i * 3 + 2] = -Math.random() * depth;
    }

    this._particleGeo = new THREE.BufferGeometry();
    this._particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this._particleMat = new THREE.PointsMaterial({
      color: 0x00ff00,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });

    this.particleSystem = new THREE.Points(this._particleGeo, this._particleMat);
    this.scene.add(this.particleSystem);
  }

  buildScanlines() {
    // Thin emissive planes moving through the tunnel as "data streams"
    this._scanlines = [];
    this._scanlineGeo = new THREE.PlaneGeometry(TUNNEL.WIDTH * 0.95, 0.05);
    this._scanlineMat = new THREE.MeshBasicMaterial({
      color: TUNNEL.SCANLINE_COLOR,
      transparent: true,
      opacity: TUNNEL.SCANLINE_OPACITY,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < TUNNEL.SCANLINE_COUNT; i++) {
      const mesh = new THREE.Mesh(this._scanlineGeo, this._scanlineMat.clone());
      // Spread scanlines at different heights (walls and ceiling)
      const side = i % 3; // 0=floor, 1=left wall, 2=right wall
      if (side === 0) {
        // Horizontal scanline on the floor/ceiling area
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.1 + Math.random() * 0.2;
      } else if (side === 1) {
        // Left wall
        mesh.rotation.y = Math.PI / 2;
        mesh.position.x = -TUNNEL.WIDTH * 0.48;
        mesh.position.y = Math.random() * TUNNEL.HEIGHT;
      } else {
        // Right wall
        mesh.rotation.y = -Math.PI / 2;
        mesh.position.x = TUNNEL.WIDTH * 0.48;
        mesh.position.y = Math.random() * TUNNEL.HEIGHT;
      }

      // Random starting Z position spread across visible tunnel
      mesh.position.z = -Math.random() * TUNNEL.SEGMENT_LENGTH * TUNNEL.VISIBLE_SEGMENTS;

      this.scene.add(mesh);
      this._scanlines.push({
        mesh,
        baseZ: mesh.position.z,
        speed: TUNNEL.SCANLINE_SPEED * (0.6 + Math.random() * 0.8),
      });
    }
  }

  /** Update tunnel segments and floor to follow the player */
  update(playerZ) {
    this._time += 1 / 60; // approximate; exact delta not needed for visual pulse

    // --- Tunnel pulse ---
    const pulse = TUNNEL.OPACITY +
      Math.sin(this._time * TUNNEL.PULSE_SPEED) * TUNNEL.PULSE_AMOUNT;
    this._tunnelMat.opacity = pulse;

    // Recycle tunnel segments
    const totalLength = TUNNEL.SEGMENT_LENGTH * TUNNEL.VISIBLE_SEGMENTS;
    for (const segment of this.segments) {
      // If segment is behind the player, move it to the front
      if (segment.position.z > playerZ + TUNNEL.SEGMENT_LENGTH) {
        // Find the frontmost segment Z
        let minZ = Infinity;
        for (const s of this.segments) {
          if (s.position.z < minZ) minZ = s.position.z;
        }
        segment.position.z = minZ - TUNNEL.SEGMENT_LENGTH;
      }
    }

    // Move floor to follow player
    this.floor.position.z = playerZ - totalLength * 0.5;

    // Scroll grid texture with player movement for parallax
    if (this._gridTexture) {
      // Move texture offset based on player position
      const floorLength = TUNNEL.SEGMENT_LENGTH * TUNNEL.VISIBLE_SEGMENTS * 2;
      this._gridTexture.offset.y = -playerZ / 4;
    }

    // Move player light
    this.playerLight.position.z = playerZ;

    // Move particle system to follow player (keep surrounding the player)
    this.particleSystem.position.z = playerZ;

    // --- Scanlines ---
    for (const line of this._scanlines) {
      line.mesh.position.z += line.speed * (1 / 60);

      // If scanline passed behind the player, recycle ahead
      if (line.mesh.position.z > playerZ + TUNNEL.SEGMENT_LENGTH * 2) {
        line.mesh.position.z = playerZ - TUNNEL.SEGMENT_LENGTH * TUNNEL.VISIBLE_SEGMENTS +
          Math.random() * TUNNEL.SEGMENT_LENGTH;
      }
    }
  }

  /** Reset tunnel to initial positions (for restart) */
  reset() {
    this._time = 0;
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].position.z = -i * TUNNEL.SEGMENT_LENGTH;
    }
    this.floor.position.z = 0;
    if (this._gridTexture) {
      this._gridTexture.offset.y = 0;
    }
    this.playerLight.position.set(0, 3, 0);
    this.particleSystem.position.z = 0;

    // Reset scanlines
    for (const line of this._scanlines) {
      line.mesh.position.z = -Math.random() * TUNNEL.SEGMENT_LENGTH * TUNNEL.VISIBLE_SEGMENTS;
    }
  }

  dispose() {
    for (const seg of this.segments) {
      this.scene.remove(seg);
    }
    this._tunnelGeo.dispose();
    this._tunnelMat.dispose();
    this.scene.remove(this.floor);
    this._floorGeo.dispose();
    this._floorMat.dispose();
    if (this._gridTexture) {
      this._gridTexture.dispose();
    }
    this.scene.remove(this.particleSystem);
    this._particleGeo.dispose();
    this._particleMat.dispose();
    this.scene.remove(this.playerLight);

    // Dispose scanlines
    for (const line of this._scanlines) {
      this.scene.remove(line.mesh);
      line.mesh.material.dispose();
    }
    this._scanlineGeo.dispose();
    this._scanlineMat.dispose();
  }
}
