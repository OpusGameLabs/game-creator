# Physics & Movement

## Choosing a Physics Engine

| Feature | Arcade | Matter.js |
|---------|--------|-----------|
| Speed | Fast | Slower |
| Body shapes | AABB rectangles, circles | Any polygon, compound shapes |
| Rotation physics | No | Yes |
| Constraints/joints | No | Yes |
| Best for | Platformers, top-down, shooters | Puzzle physics, ragdolls, realistic sims |

Never mix physics engines in the same game.

## Arcade Physics Setup

```typescript
// In game config
physics: {
    default: 'arcade',
    arcade: {
        gravity: { x: 0, y: 300 },
        debug: false,  // Set true during development
    },
}
```

## Collisions

```typescript
// In scene create():

// Collide two objects/groups (both react)
this.physics.add.collider(this.player, this.platforms);
this.physics.add.collider(this.enemies, this.platforms);

// Overlap (trigger callback, no physical reaction)
this.physics.add.overlap(
    this.player,
    this.coins,
    this.collectCoin,
    undefined,
    this
);

private collectCoin(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    coin: Phaser.Types.Physics.Arcade.GameObjectWithBody
) {
    const c = coin as Coin;
    c.setActive(false);
    c.setVisible(false);
    c.body!.enable = false;
    this.registry.inc('score', 10);
}
```

## Collision Groups (Matter.js)

```typescript
const categoryPlayer = this.matter.world.nextCategory();
const categoryEnemy = this.matter.world.nextCategory();
const categoryPlatform = this.matter.world.nextCategory();

player.setCollisionCategory(categoryPlayer);
player.setCollidesWith([categoryEnemy, categoryPlatform]);

enemy.setCollisionCategory(categoryEnemy);
enemy.setCollidesWith([categoryPlayer, categoryPlatform]);
```

## State Machine for Character Movement

Use the state pattern to manage complex movement behaviors:

```typescript
interface State {
    enter(player: Player): void;
    update(player: Player, delta: number): void;
    exit(player: Player): void;
}

class IdleState implements State {
    enter(player: Player) {
        player.setVelocityX(0);
        player.play('idle');
    }
    update(player: Player, _delta: number) {
        if (player.cursors.left.isDown || player.cursors.right.isDown) {
            player.stateMachine.transition('walk');
        }
        if (player.cursors.up.isDown && player.isGrounded()) {
            player.stateMachine.transition('jump');
        }
    }
    exit(_player: Player) {}
}

class WalkState implements State {
    enter(player: Player) {
        player.play('walk');
    }
    update(player: Player, _delta: number) {
        if (player.cursors.left.isDown) {
            player.setVelocityX(-player.speed);
            player.setFlipX(true);
        } else if (player.cursors.right.isDown) {
            player.setVelocityX(player.speed);
            player.setFlipX(false);
        } else {
            player.stateMachine.transition('idle');
        }
        if (player.cursors.up.isDown && player.isGrounded()) {
            player.stateMachine.transition('jump');
        }
    }
    exit(_player: Player) {}
}

class JumpState implements State {
    enter(player: Player) {
        player.setVelocityY(-player.jumpForce);
        player.play('jump');
    }
    update(player: Player, _delta: number) {
        // Air control
        if (player.cursors.left.isDown) {
            player.setVelocityX(-player.speed * 0.8);
        } else if (player.cursors.right.isDown) {
            player.setVelocityX(player.speed * 0.8);
        }
        if (player.isGrounded()) {
            player.stateMachine.transition('idle');
        }
    }
    exit(_player: Player) {}
}
```

## Simple State Machine Implementation

```typescript
export class StateMachine {
    private states = new Map<string, State>();
    private currentState?: State;
    private owner: Player;

    constructor(owner: Player) {
        this.owner = owner;
    }

    addState(name: string, state: State) {
        this.states.set(name, state);
    }

    transition(name: string) {
        const next = this.states.get(name);
        if (!next) return;
        this.currentState?.exit(this.owner);
        this.currentState = next;
        this.currentState.enter(this.owner);
    }

    update(delta: number) {
        this.currentState?.update(this.owner, delta);
    }
}
```

## Mobile-Aware State Machine

To make state machines work across keyboard and touch, abstract raw input into an `inputState` object. States receive this object and never read `cursors` directly:

```typescript
// In Scene update() — build inputState from all sources
const inputState = {
  left: this.cursors.left.isDown || this.wasd.left.isDown || this.touchLeft,
  right: this.cursors.right.isDown || this.wasd.right.isDown || this.touchRight,
  jump: Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.touchJump,
};
this.player.stateMachine.update(delta, inputState);

// In states — use inputState instead of player.cursors
class WalkState implements State {
  update(player: Player, delta: number, inputState: InputState) {
    if (inputState.left) {
      player.setVelocityX(-player.speed);
      player.setFlipX(true);
    } else if (inputState.right) {
      player.setVelocityX(player.speed);
      player.setFlipX(false);
    } else {
      player.stateMachine.transition('idle');
    }
    if (inputState.jump && player.isGrounded()) {
      player.stateMachine.transition('jump');
    }
  }
}
```

This pattern ensures states are input-source-agnostic. Adding a new input method (gamepad, tilt) only requires updating the `inputState` construction in the Scene, not every state.

## Time-Based Movement

Always use `delta` for consistent movement across frame rates:

```typescript
update(_time: number, delta: number) {
    // delta is in milliseconds
    const speed = 200; // pixels per second
    const dx = speed * (delta / 1000);
    this.player.x += dx;
}
```

Or use Phaser's velocity system which handles this automatically:

```typescript
this.player.setVelocityX(200); // Arcade physics handles delta internally
```

## Platformer Tips

- Set `player.body.setGravityY()` for per-object gravity overrides
- Use `body.blocked.down` to check if grounded (Arcade)
- Implement coyote time: allow jumping briefly after leaving a ledge
- Variable jump height: reduce Y velocity on key release

```typescript
// Variable jump height
if (Phaser.Input.Keyboard.JustUp(this.cursors.up) && this.player.body!.velocity.y < 0) {
    this.player.setVelocityY(this.player.body!.velocity.y * 0.5);
}
```
