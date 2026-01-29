export class InputSystem {
  constructor() {
    this.keys = {};

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  get left() {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get right() {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get forward() {
    return this.isDown('ArrowUp') || this.isDown('KeyW');
  }

  get backward() {
    return this.isDown('ArrowDown') || this.isDown('KeyS');
  }

  get jump() {
    return this.isDown('Space');
  }
}
