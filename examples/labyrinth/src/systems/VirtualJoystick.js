import { VIRTUAL_JOYSTICK } from '../core/Constants.js';

export class VirtualJoystick {
  constructor() {
    this.active = false;
    this.moveX = 0;
    this.moveZ = 0;

    // Touch tracking
    this._touchId = null;
    this._originX = 0;
    this._originY = 0;

    // DOM elements
    this._container = null;
    this._base = null;
    this._knob = null;

    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
  }

  show() {
    if (this._container) {
      this._container.style.display = '';
      this.active = true;
      return;
    }

    // Create DOM elements
    this._container = document.createElement('div');
    this._container.id = 'virtual-joystick';
    Object.assign(this._container.style, {
      position: 'fixed',
      bottom: `${VIRTUAL_JOYSTICK.MARGIN_BOTTOM}px`,
      left: `${VIRTUAL_JOYSTICK.MARGIN_LEFT}px`,
      width: `${VIRTUAL_JOYSTICK.BASE_SIZE}px`,
      height: `${VIRTUAL_JOYSTICK.BASE_SIZE}px`,
      zIndex: '30',
      touchAction: 'none',
    });

    this._base = document.createElement('div');
    Object.assign(this._base.style, {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.12)',
      border: '2px solid rgba(255,255,255,0.25)',
    });

    this._knob = document.createElement('div');
    const knobSize = VIRTUAL_JOYSTICK.KNOB_SIZE;
    Object.assign(this._knob.style, {
      position: 'absolute',
      width: `${knobSize}px`,
      height: `${knobSize}px`,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.5)',
      top: `${(VIRTUAL_JOYSTICK.BASE_SIZE - knobSize) / 2}px`,
      left: `${(VIRTUAL_JOYSTICK.BASE_SIZE - knobSize) / 2}px`,
      transition: 'none',
    });

    this._container.appendChild(this._base);
    this._container.appendChild(this._knob);
    document.body.appendChild(this._container);

    // Listen on the whole document so dragging outside the base still works
    this._container.addEventListener('touchstart', this._onTouchStart, { passive: false });
    document.addEventListener('touchmove', this._onTouchMove, { passive: false });
    document.addEventListener('touchend', this._onTouchEnd);
    document.addEventListener('touchcancel', this._onTouchEnd);

    this.active = true;
  }

  hide() {
    if (this._container) {
      this._container.style.display = 'none';
    }
    this.active = false;
    this.moveX = 0;
    this.moveZ = 0;
    this._touchId = null;
  }

  _onTouchStart(e) {
    if (this._touchId !== null) return;
    const touch = e.changedTouches[0];
    this._touchId = touch.identifier;

    const rect = this._container.getBoundingClientRect();
    this._originX = rect.left + rect.width / 2;
    this._originY = rect.top + rect.height / 2;

    this._updateFromTouch(touch);
    e.preventDefault();
  }

  _onTouchMove(e) {
    if (this._touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this._touchId) {
        this._updateFromTouch(e.changedTouches[i]);
        e.preventDefault();
        return;
      }
    }
  }

  _onTouchEnd(e) {
    if (this._touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this._touchId) {
        this._touchId = null;
        this.moveX = 0;
        this.moveZ = 0;
        this._resetKnob();
        return;
      }
    }
  }

  _updateFromTouch(touch) {
    const dx = touch.clientX - this._originX;
    const dy = touch.clientY - this._originY;
    const maxDist = VIRTUAL_JOYSTICK.MAX_DISTANCE;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    // Normalize to -1..1
    this.moveX = clampedX / maxDist;
    this.moveZ = clampedY / maxDist; // Y on screen maps to Z in 3D

    // Update knob position
    if (this._knob) {
      const knobSize = VIRTUAL_JOYSTICK.KNOB_SIZE;
      const baseCenter = VIRTUAL_JOYSTICK.BASE_SIZE / 2;
      this._knob.style.left = `${baseCenter + clampedX - knobSize / 2}px`;
      this._knob.style.top = `${baseCenter + clampedY - knobSize / 2}px`;
    }
  }

  _resetKnob() {
    if (this._knob) {
      const knobSize = VIRTUAL_JOYSTICK.KNOB_SIZE;
      const baseCenter = VIRTUAL_JOYSTICK.BASE_SIZE / 2;
      this._knob.style.left = `${baseCenter - knobSize / 2}px`;
      this._knob.style.top = `${baseCenter - knobSize / 2}px`;
    }
  }

  destroy() {
    if (this._container) {
      this._container.removeEventListener('touchstart', this._onTouchStart);
      document.removeEventListener('touchmove', this._onTouchMove);
      document.removeEventListener('touchend', this._onTouchEnd);
      document.removeEventListener('touchcancel', this._onTouchEnd);
      this._container.remove();
      this._container = null;
    }
    this.active = false;
  }
}
