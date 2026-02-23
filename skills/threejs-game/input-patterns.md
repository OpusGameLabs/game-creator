# Input Patterns -- Gyroscope & Virtual Joystick

Detailed implementation patterns for mobile input in Three.js games. These are used as components within the unified `InputSystem` described in the main SKILL.md.

## Gyroscope Input Pattern

For tilt-controlled games (marble, balance, racing):

```js
class GyroscopeInput {
  constructor() {
    this.available = false;
    this.moveX = 0;
    this.moveZ = 0;
    this.calibBeta = null;
    this.calibGamma = null;
  }

  async requestPermission() {
    // iOS 13+: DeviceOrientationEvent.requestPermission()
    // Must be called from a user gesture handler
  }

  recalibrate() {
    // Capture current orientation as neutral position
  }

  update() {
    // Apply deadzone, normalize to -1..1, smooth with EMA
  }
}
```

### Key Implementation Notes

- **Permission**: iOS 13+ requires `DeviceOrientationEvent.requestPermission()` called from a user gesture (tap/click)
- **Calibration**: Store the initial beta/gamma values when the user starts playing; subtract these as the "zero" point
- **Deadzone**: Apply a 2-3 degree deadzone around neutral to prevent drift
- **Smoothing**: Use exponential moving average (EMA) to smooth jittery readings
- **Normalization**: Map tilt angles to -1..1 range with configurable sensitivity

## Virtual Joystick Pattern

DOM-based circle-in-circle touch joystick for non-gyro devices:

```js
class VirtualJoystick {
  constructor() {
    this.active = false;
    this.moveX = 0;  // -1..1
    this.moveZ = 0;  // -1..1
  }

  show() {
    // Create outer circle + inner knob DOM elements
    // Track touch by identifier to handle multi-touch correctly
    // Clamp knob movement to maxDistance from center
    // Normalize displacement to -1..1
  }

  hide() { /* Remove DOM, reset values */ }
}
```

### Key Implementation Notes

- **DOM-based**: Use HTML elements overlaid on the canvas, not canvas-rendered (simpler hit detection)
- **Touch tracking**: Use `touch.identifier` to track the correct finger, not array index
- **Clamping**: Clamp the knob to a circular boundary (not square) using distance calculation
- **Positioning**: Place in lower-left corner, sized at ~120px diameter for thumb reach
- **Opacity**: Semi-transparent (0.4-0.6) to not obscure gameplay

## Input Priority

1. On mobile: try gyroscope first (request permission from PLAY button tap)
2. If gyro denied/unavailable: show virtual joystick
3. Keyboard always active as fallback/override on any platform
4. Game logic consumes only `input.moveX` and `input.moveZ` -- never knows the source
