import Phaser from 'phaser';
import { PARTICLES, EFFECTS, GAME, PX } from '../core/Constants.js';

/**
 * Manages visual effects: particle bursts, floating text, screen effects.
 * All methods are static utilities called from the scene.
 */

/**
 * Emit a burst of sparkle particles in a given color.
 * Used for gem catches.
 */
export function emitGemCatchBurst(scene, x, y, color) {
  const count = PARTICLES.GEM_CATCH_COUNT;
  const speed = PARTICLES.GEM_CATCH_SPEED;
  const size = PARTICLES.GEM_CATCH_SIZE;
  const duration = PARTICLES.GEM_CATCH_DURATION;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = speed * (0.5 + Math.random() * 0.5);
    const pSize = size * (0.5 + Math.random() * 0.5);

    const particle = scene.add.circle(x, y, pSize, color, 1).setDepth(200);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scale: 0.1,
      duration: duration * (0.7 + Math.random() * 0.3),
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy(),
    });
  }
}

/**
 * Emit a dark/red burst for skull hit.
 */
export function emitSkullHitBurst(scene, x, y) {
  const count = PARTICLES.SKULL_HIT_COUNT;
  const speed = PARTICLES.SKULL_HIT_SPEED;
  const size = PARTICLES.SKULL_HIT_SIZE;
  const duration = PARTICLES.SKULL_HIT_DURATION;
  const colors = PARTICLES.SKULL_HIT_COLORS;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const dist = speed * (0.4 + Math.random() * 0.6);
    const pSize = size * (0.4 + Math.random() * 0.6);
    const color = Phaser.Utils.Array.GetRandom(colors);

    const particle = scene.add.circle(x, y, pSize, color, 1).setDepth(200);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scale: 0.2,
      duration: duration * (0.6 + Math.random() * 0.4),
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy(),
    });
  }
}

/**
 * Emit a golden shower of particles across the screen for difficulty up.
 */
export function emitDifficultyUpShower(scene) {
  const count = PARTICLES.DIFFICULTY_COUNT;
  const size = PARTICLES.DIFFICULTY_SIZE;
  const duration = PARTICLES.DIFFICULTY_DURATION;
  const color = PARTICLES.DIFFICULTY_COLOR;

  for (let i = 0; i < count; i++) {
    const x = Math.random() * GAME.WIDTH;
    const startY = -10;
    const endY = GAME.HEIGHT * (0.3 + Math.random() * 0.4);
    const pSize = size * (0.5 + Math.random() * 0.5);
    const delay = Math.random() * 300;

    const particle = scene.add.circle(x, startY, pSize, color, 0.9).setDepth(200);

    scene.tweens.add({
      targets: particle,
      y: endY,
      alpha: 0,
      scale: 0.2,
      duration: duration * (0.6 + Math.random() * 0.4),
      delay: delay,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy(),
    });
  }
}

/**
 * Show a floating "+N" text that rises and fades out.
 */
export function showFloatingText(scene, x, y, text, color) {
  const fontSize = Math.round(GAME.HEIGHT * EFFECTS.FLOAT_FONT_RATIO);

  const floater = scene.add.text(x, y, text, {
    fontSize: fontSize + 'px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontStyle: 'bold',
    color: color || '#ffd700',
    stroke: '#000000',
    strokeThickness: Math.max(2, Math.round(3 * PX)),
  }).setOrigin(0.5).setDepth(300);

  scene.tweens.add({
    targets: floater,
    y: y - EFFECTS.FLOAT_RISE,
    alpha: 0,
    duration: EFFECTS.FLOAT_DURATION,
    ease: 'Quad.easeOut',
    onComplete: () => floater.destroy(),
  });
}

/**
 * Create a shooting star animation across the sky.
 */
export function createShootingStar(scene, config) {
  const startX = Math.random() * GAME.WIDTH * 0.8;
  const startY = Math.random() * GAME.HEIGHT * 0.4;
  const length = config.SHOOTING_STAR_LENGTH;
  const duration = config.SHOOTING_STAR_DURATION;

  // The shooting star is a small bright dot with a fading trail
  const star = scene.add.circle(startX, startY, 2 * PX, config.SHOOTING_STAR_COLOR, config.SHOOTING_STAR_ALPHA);
  star.setDepth(-5);

  // Trail behind the star
  const trail = scene.add.graphics();
  trail.setDepth(-6);

  const endX = startX + length * 1.5;
  const endY = startY + length * 0.8;

  // Animate the star moving diagonally
  scene.tweens.add({
    targets: star,
    x: endX,
    y: endY,
    alpha: 0,
    duration: duration,
    ease: 'Quad.easeIn',
    onUpdate: () => {
      trail.clear();
      trail.lineStyle(1.5 * PX, config.SHOOTING_STAR_COLOR, star.alpha * 0.5);
      // Draw a short trail behind the current position
      const trailLen = length * 0.4;
      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / dist;
      const ny = dy / dist;
      trail.lineBetween(
        star.x, star.y,
        star.x - nx * trailLen, star.y - ny * trailLen
      );
    },
    onComplete: () => {
      star.destroy();
      trail.destroy();
    },
  });
}
