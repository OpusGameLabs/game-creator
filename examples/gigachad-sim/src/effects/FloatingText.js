// =============================================================================
// FloatingText.js — CSS-based floating score text
// Projects 3D catch positions to screen coordinates and shows "+N" text
// that floats upward and fades. Uses CSS transitions for smooth animation.
// =============================================================================

import * as THREE from 'three';
import { EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

const _vec3 = new THREE.Vector3();

// Text color per weight type
const TEXT_COLORS = {
  dumbbell: '#4488ff',
  barbell: '#ff4444',
  kettlebell: '#ffd700',
};

export class FloatingText {
  constructor(camera, renderer) {
    this._camera = camera;
    this._renderer = renderer;

    // Container for floating text elements
    this._container = document.createElement('div');
    this._container.id = 'floating-text-container';
    this._container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 12;
      overflow: hidden;
    `;
    document.body.appendChild(this._container);

    // Active floating texts
    this._activeTexts = [];

    // Wire events
    eventBus.on(Events.WEIGHT_CAUGHT, (data) => {
      try {
        this._spawnScoreText(data);
      } catch (e) { /* graceful degradation */ }
    });

    eventBus.on(Events.POWERUP_COLLECTED, (data) => {
      try {
        this._spawnPowerupText();
      } catch (e) { /* graceful degradation */ }
    });

    eventBus.on(Events.SPECTACLE_STREAK, ({ combo }) => {
      try {
        this._spawnStreakText(combo);
      } catch (e) { /* graceful degradation */ }
    });
  }

  _spawnScoreText(data) {
    const { type, points, combo, x } = data;

    // Project 3D position to screen coordinates
    _vec3.set(x, 3.0, 0);
    _vec3.project(this._camera);

    const canvas = this._renderer.domElement;
    const screenX = ((_vec3.x + 1) / 2) * canvas.clientWidth;
    const screenY = ((1 - _vec3.y) / 2) * canvas.clientHeight;

    // Determine font size based on combo
    const comboLevel = combo || 0;
    const fontSize = Math.min(
      EFFECTS.FLOAT_TEXT_BASE_SIZE + comboLevel * EFFECTS.FLOAT_TEXT_COMBO_GROWTH,
      EFFECTS.FLOAT_TEXT_MAX_SIZE
    );

    const color = TEXT_COLORS[type] || '#ffffff';

    // Build text content
    let text = `+${points}`;
    if (comboLevel > 2) {
      text += ` ${comboLevel}x`;
    }

    this._createFloatingElement(text, screenX, screenY, fontSize, color);
  }

  _spawnPowerupText() {
    const canvas = this._renderer.domElement;
    const screenX = canvas.clientWidth / 2;
    const screenY = canvas.clientHeight * 0.35;

    this._createFloatingElement('2x POWER!', screenX, screenY, 36, '#44ff44');
  }

  _spawnStreakText(combo) {
    const canvas = this._renderer.domElement;
    const screenX = canvas.clientWidth / 2;
    const screenY = canvas.clientHeight * 0.3;

    const labels = { 5: 'ON FIRE!', 10: 'UNSTOPPABLE!', 25: 'LEGENDARY!', 50: 'GODLIKE!', 100: 'GIGACHAD!' };
    const label = labels[combo] || `${combo}x STREAK`;

    this._createFloatingElement(label, screenX, screenY, 48, '#ff8844');
  }

  _createFloatingElement(text, x, y, fontSize, color) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%) scale(1.4);
      font-family: 'Arial Black', 'Impact', system-ui, sans-serif;
      font-size: ${fontSize}px;
      font-weight: 900;
      color: ${color};
      text-shadow:
        0 0 8px ${color},
        2px 2px 0 rgba(0,0,0,0.8),
        -1px -1px 0 rgba(0,0,0,0.5);
      pointer-events: none;
      opacity: 1;
      transition:
        transform ${EFFECTS.FLOAT_TEXT_DURATION}s ease-out,
        opacity ${EFFECTS.FLOAT_TEXT_DURATION * 0.6}s ease-in ${EFFECTS.FLOAT_TEXT_DURATION * 0.4}s;
      white-space: nowrap;
      letter-spacing: 1px;
    `;

    this._container.appendChild(el);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      // Convert world-space rise to approximate screen pixels
      const risePixels = EFFECTS.FLOAT_TEXT_RISE * 40;
      el.style.transform = `translate(-50%, -50%) translateY(-${risePixels}px) scale(1)`;
      el.style.opacity = '0';
    });

    // Remove after animation completes
    const entry = { el, timer: EFFECTS.FLOAT_TEXT_DURATION + 0.1 };
    this._activeTexts.push(entry);
  }

  update(delta) {
    for (let i = this._activeTexts.length - 1; i >= 0; i--) {
      this._activeTexts[i].timer -= delta;
      if (this._activeTexts[i].timer <= 0) {
        const el = this._activeTexts[i].el;
        if (el.parentNode) el.parentNode.removeChild(el);
        this._activeTexts.splice(i, 1);
      }
    }
  }

  destroy() {
    for (const entry of this._activeTexts) {
      if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
    }
    this._activeTexts = [];
    if (this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
}
