import {
  GameState,
  PlayerState,
  PlayerInput,
  Projectile,
  Asteroid,
  PowerUp,
  Particle,
  KillFeedItem,
  SHIP_CLASSES,
  PowerUpType,
} from './types';

export const ARENA_WIDTH = 2400;
export const ARENA_HEIGHT = 1600;
const MAX_ASTEROIDS = 12;
const MAX_POWERUPS = 5;

// Helper: distance between two points
export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper: angle normalize (-PI to PI)
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

// Generate jagged polygon vertices for asteroids
function generateAsteroidVertices(radius: number, points: number = 8): { x: number; y: number }[] {
  const vertices = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const variance = 0.75 + Math.random() * 0.5; // 75% to 125% radius
    const r = radius * variance;
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return vertices;
}

export function createInitialGameState(roomId: string, hostId: string): GameState {
  const state: GameState = {
    roomId,
    hostId,
    arenaWidth: ARENA_WIDTH,
    arenaHeight: ARENA_HEIGHT,
    players: {},
    projectiles: [],
    asteroids: [],
    powerUps: [],
    particles: [],
    killFeed: [],
    matchTime: 0,
    targetKills: 8,
    gameStatus: 'playing',
  };

  // Seed initial asteroids
  for (let i = 0; i < 8; i++) {
    state.asteroids.push(createAsteroid(3));
  }

  // Seed initial power-ups
  for (let i = 0; i < 3; i++) {
    state.powerUps.push(createPowerUp());
  }

  return state;
}

export function createAsteroid(tier: 1 | 2 | 3, spawnX?: number, spawnY?: number): Asteroid {
  const radius = tier === 3 ? 48 : tier === 2 ? 28 : 16;
  const health = tier === 3 ? 60 : tier === 2 ? 35 : 15;

  const x = spawnX !== undefined ? spawnX : Math.random() * (ARENA_WIDTH - 200) + 100;
  const y = spawnY !== undefined ? spawnY : Math.random() * (ARENA_HEIGHT - 200) + 100;

  const speed = 0.3 + Math.random() * 0.8 * (4 - tier);
  const moveAngle = Math.random() * Math.PI * 2;

  return {
    id: `ast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    x,
    y,
    vx: Math.cos(moveAngle) * speed,
    vy: Math.sin(moveAngle) * speed,
    angle: Math.random() * Math.PI * 2,
    angularVelocity: (Math.random() - 0.5) * 0.03,
    radius,
    health,
    maxHealth: health,
    tier,
    vertices: generateAsteroidVertices(radius, tier === 3 ? 10 : tier === 2 ? 8 : 6),
  };
}

export function createPowerUp(spawnX?: number, spawnY?: number): PowerUp {
  const types: PowerUpType[] = ['triple_shot', 'railgun', 'homing', 'shield_boost', 'repair'];
  const chosenType = types[Math.floor(Math.random() * types.length)];

  return {
    id: `pu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: chosenType,
    x: spawnX !== undefined ? spawnX : Math.random() * (ARENA_WIDTH - 300) + 150,
    y: spawnY !== undefined ? spawnY : Math.random() * (ARENA_HEIGHT - 300) + 150,
    radius: 18,
    duration: 35, // 35 seconds before despawn
    pulse: 0,
  };
}

export function createNewPlayer(
  id: string,
  name: string,
  color: string,
  shipClass: 'interceptor' | 'vanguard' | 'wraith',
  isBot: boolean = false
): PlayerState {
  const classDef = SHIP_CLASSES[shipClass] || SHIP_CLASSES.interceptor;

  // Safe spawn position (scattered away from edge)
  const x = Math.random() * (ARENA_WIDTH - 600) + 300;
  const y = Math.random() * (ARENA_HEIGHT - 600) + 300;

  return {
    id,
    name: name || (isBot ? `AI-${Math.floor(Math.random() * 900 + 100)}` : `Pilot-${id.slice(-4)}`),
    color: color || '#00f0ff',
    shipClass,
    x,
    y,
    vx: 0,
    vy: 0,
    angle: Math.random() * Math.PI * 2,
    health: classDef.maxHealth,
    maxHealth: classDef.maxHealth,
    shield: classDef.maxShield,
    maxShield: classDef.maxShield,
    boostEnergy: 100,
    isShieldActive: false,
    isBoosting: false,
    isThrusting: false,
    isAlive: true,
    respawnTimer: 0,
    invulnerableTimer: 2.5, // 2.5s safe entry shield
    score: 0,
    kills: 0,
    deaths: 0,
    isBot,
    lastFireTime: 0,
  };
}

export interface SoundEvents {
  laser?: 'standard' | 'spread' | 'railgun' | 'homing';
  explosion?: 'small' | 'medium' | 'large';
  hit?: boolean;
  shield?: boolean;
  powerUp?: boolean;
  victory?: boolean;
}

export class GameEngine {
  public state: GameState;
  private soundCallback?: (event: SoundEvents) => void;

  constructor(initialState: GameState, soundCallback?: (event: SoundEvents) => void) {
    this.state = initialState;
    this.soundCallback = soundCallback;
  }

  public setSoundCallback(cb: (event: SoundEvents) => void) {
    this.soundCallback = cb;
  }

  // Authoritative physics tick (run at ~60fps)
  public update(dt: number, inputs: Record<string, PlayerInput>) {
    if (this.state.gameStatus !== 'playing') {
      this.updateParticlesOnly(dt);
      return;
    }

    this.state.matchTime += dt;

    // 1. Process player controls, physics, and bot AI
    for (const id in this.state.players) {
      const player = this.state.players[id];
      if (!player.isAlive) {
        player.respawnTimer -= dt;
        if (player.respawnTimer <= 0) {
          this.respawnPlayer(player);
        }
        continue;
      }

      // Decrement timers
      if (player.invulnerableTimer > 0) {
        player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
      }
      if (player.activePowerUp) {
        player.activePowerUp.duration -= dt;
        if (player.activePowerUp.duration <= 0) {
          player.activePowerUp = undefined;
        }
      }

      const input = player.isBot ? this.computeBotInput(player, dt) : (inputs[id] || {
        thrust: false,
        reverse: false,
        turnLeft: false,
        turnRight: false,
        fire: false,
        shield: false,
        boost: false,
      });

      this.processPlayerMovement(player, input, dt);
      this.processPlayerWeapons(player, input, dt);
    }

    // 2. Update Projectiles
    this.updateProjectiles(dt);

    // 3. Update Asteroids
    this.updateAsteroids(dt);

    // 4. Update Power-Ups
    this.updatePowerUps(dt);

    // 5. Update Particles
    this.updateParticles(dt);

    // 6. Handle All Collisions
    this.resolveCollisions();

    // 7. Spawning Maintenance
    this.maintainSpawns(dt);
  }

  private updateParticlesOnly(dt: number) {
    this.updateParticles(dt);
  }

  private respawnPlayer(player: PlayerState) {
    const classDef = SHIP_CLASSES[player.shipClass] || SHIP_CLASSES.interceptor;
    player.x = Math.random() * (ARENA_WIDTH - 600) + 300;
    player.y = Math.random() * (ARENA_HEIGHT - 600) + 300;
    player.vx = 0;
    player.vy = 0;
    player.health = classDef.maxHealth;
    player.shield = classDef.maxShield;
    player.boostEnergy = 100;
    player.isAlive = true;
    player.respawnTimer = 0;
    player.invulnerableTimer = 3.0; // 3 seconds invulnerability
    player.activePowerUp = undefined;

    // Spawn respawn warp burst
    this.createShockwave(player.x, player.y, player.color, 40);
  }

  private processPlayerMovement(player: PlayerState, input: PlayerInput, dt: number) {
    const classDef = SHIP_CLASSES[player.shipClass] || SHIP_CLASSES.interceptor;
    const baseSpeed = classDef.speed;
    const turnSpeed = classDef.turnSpeed;

    // Turning: keyboard or mouse pointer angle
    if (input.mouseAngle !== undefined) {
      const diff = normalizeAngle(input.mouseAngle - player.angle);
      player.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed * 1.6);
    } else {
      if (input.turnLeft) player.angle -= turnSpeed;
      if (input.turnRight) player.angle += turnSpeed;
    }

    // Boost logic
    let speedMultiplier = 1.0;
    player.isBoosting = false;
    if (input.boost && player.boostEnergy > 10 && input.thrust) {
      player.isBoosting = true;
      speedMultiplier = 1.85;
      player.boostEnergy = Math.max(0, player.boostEnergy - 35 * dt);
    } else {
      player.boostEnergy = Math.min(100, player.boostEnergy + 20 * dt);
    }

    // Thrust & Reverse
    player.isThrusting = false;
    const accel = baseSpeed * speedMultiplier * 18 * dt;

    if (input.thrust) {
      player.isThrusting = true;
      player.vx += Math.cos(player.angle) * accel;
      player.vy += Math.sin(player.angle) * accel;

      // Thruster exhaust particles
      if (Math.random() < 0.85) {
        const exhaustAngle = player.angle + Math.PI + (Math.random() - 0.5) * 0.4;
        const exhaustSpeed = (player.isBoosting ? 6 : 3.5) + Math.random() * 2;
        const offsetDist = 18;
        this.state.particles.push({
          id: `p_thr_${Math.random()}`,
          x: player.x - Math.cos(player.angle) * offsetDist,
          y: player.y - Math.sin(player.angle) * offsetDist,
          vx: Math.cos(exhaustAngle) * exhaustSpeed + player.vx * 0.2,
          vy: Math.sin(exhaustAngle) * exhaustSpeed + player.vy * 0.2,
          color: player.isBoosting ? '#ff8800' : player.color,
          size: player.isBoosting ? 4.5 : 2.8,
          life: player.isBoosting ? 0.35 : 0.22,
          maxLife: player.isBoosting ? 0.35 : 0.22,
          alpha: 0.9,
        });
      }
    } else if (input.reverse) {
      player.vx -= Math.cos(player.angle) * (accel * 0.45);
      player.vy -= Math.sin(player.angle) * (accel * 0.45);
    }

    // Space drag / dampening (subtle inertia)
    const drag = 0.982;
    player.vx *= drag;
    player.vy *= drag;

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Arena boundary collision with elastic bounce
    const pad = 24;
    if (player.x < pad) {
      player.x = pad;
      player.vx = Math.abs(player.vx) * 0.6;
      this.createSparkImpact(player.x, player.y, '#00f0ff');
    } else if (player.x > ARENA_WIDTH - pad) {
      player.x = ARENA_WIDTH - pad;
      player.vx = -Math.abs(player.vx) * 0.6;
      this.createSparkImpact(player.x, player.y, '#00f0ff');
    }
    if (player.y < pad) {
      player.y = pad;
      player.vy = Math.abs(player.vy) * 0.6;
      this.createSparkImpact(player.x, player.y, '#00f0ff');
    } else if (player.y > ARENA_HEIGHT - pad) {
      player.y = ARENA_HEIGHT - pad;
      player.vy = -Math.abs(player.vy) * 0.6;
      this.createSparkImpact(player.x, player.y, '#00f0ff');
    }

    // Deflector Shield management
    player.isShieldActive = false;
    if (input.shield && player.shield > 5) {
      player.isShieldActive = true;
      player.shield = Math.max(0, player.shield - 28 * dt);
    } else {
      // Passive shield recharge
      if (player.shield < classDef.maxShield) {
        player.shield = Math.min(classDef.maxShield, player.shield + classDef.shieldRechargeRate * dt);
      }
    }
  }

  private processPlayerWeapons(player: PlayerState, input: PlayerInput, dt: number) {
    const classDef = SHIP_CLASSES[player.shipClass] || SHIP_CLASSES.interceptor;
    const now = Date.now() / 1000;
    const fireInterval = 1 / classDef.fireRate;

    if (input.fire && now - player.lastFireTime >= fireInterval) {
      player.lastFireTime = now;
      this.fireWeapon(player);
    }
  }

  private fireWeapon(player: PlayerState) {
    const powerType = player.activePowerUp?.type;
    const baseDamage = 18;
    const muzzleDist = 22;
    const projSpeed = 16;

    if (powerType === 'railgun') {
      // Piercing high velocity beam
      this.state.projectiles.push({
        id: `prj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ownerId: player.id,
        ownerColor: '#ff2a5f',
        x: player.x + Math.cos(player.angle) * muzzleDist,
        y: player.y + Math.sin(player.angle) * muzzleDist,
        vx: Math.cos(player.angle) * 28 + player.vx * 0.3,
        vy: Math.sin(player.angle) * 28 + player.vy * 0.3,
        angle: player.angle,
        damage: 48,
        life: 1.8,
        radius: 7,
        type: 'railgun',
      });
      this.soundCallback?.({ laser: 'railgun' });
      return;
    }

    if (powerType === 'triple_shot') {
      // 3-way spread
      const spreadAngles = [-0.18, 0, 0.18];
      spreadAngles.forEach((offset) => {
        const fireAngle = player.angle + offset;
        this.state.projectiles.push({
          id: `prj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ownerId: player.id,
          ownerColor: player.color,
          x: player.x + Math.cos(fireAngle) * muzzleDist,
          y: player.y + Math.sin(fireAngle) * muzzleDist,
          vx: Math.cos(fireAngle) * projSpeed + player.vx * 0.3,
          vy: Math.sin(fireAngle) * projSpeed + player.vy * 0.3,
          angle: fireAngle,
          damage: baseDamage * 0.85,
          life: 1.4,
          radius: 4,
          type: 'spread',
        });
      });
      this.soundCallback?.({ laser: 'spread' });
      return;
    }

    if (powerType === 'homing') {
      // Find closest enemy player
      let targetId: string | undefined;
      let closestDist = Infinity;
      for (const id in this.state.players) {
        if (id === player.id || !this.state.players[id].isAlive) continue;
        const d = dist(player.x, player.y, this.state.players[id].x, this.state.players[id].y);
        if (d < closestDist) {
          closestDist = d;
          targetId = id;
        }
      }

      this.state.projectiles.push({
        id: `prj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ownerId: player.id,
        ownerColor: '#ffaa00',
        x: player.x + Math.cos(player.angle) * muzzleDist,
        y: player.y + Math.sin(player.angle) * muzzleDist,
        vx: Math.cos(player.angle) * 11 + player.vx * 0.3,
        vy: Math.sin(player.angle) * 11 + player.vy * 0.3,
        angle: player.angle,
        damage: 32,
        life: 2.5,
        radius: 5,
        type: 'homing',
        targetPlayerId: targetId,
      });
      this.soundCallback?.({ laser: 'homing' });
      return;
    }

    // Standard Dual Blaster
    const lateralOffset = 10;
    const perpAngle = player.angle + Math.PI / 2;

    [-lateralOffset, lateralOffset].forEach((lat) => {
      const sx = player.x + Math.cos(player.angle) * muzzleDist + Math.cos(perpAngle) * lat;
      const sy = player.y + Math.sin(player.angle) * muzzleDist + Math.sin(perpAngle) * lat;
      this.state.projectiles.push({
        id: `prj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ownerId: player.id,
        ownerColor: player.color,
        x: sx,
        y: sy,
        vx: Math.cos(player.angle) * projSpeed + player.vx * 0.25,
        vy: Math.sin(player.angle) * projSpeed + player.vy * 0.25,
        angle: player.angle,
        damage: baseDamage,
        life: 1.5,
        radius: 3.5,
        type: 'standard',
      });
    });

    this.soundCallback?.({ laser: 'standard' });
  }

  private computeBotInput(bot: PlayerState, dt: number): PlayerInput {
    const input: PlayerInput = {
      thrust: false,
      reverse: false,
      turnLeft: false,
      turnRight: false,
      fire: false,
      shield: false,
      boost: false,
    };

    // 1. Locate closest alive human or other player
    let targetPlayer: PlayerState | null = null;
    let minDist = Infinity;

    for (const id in this.state.players) {
      if (id === bot.id) continue;
      const other = this.state.players[id];
      if (!other.isAlive) continue;
      const d = dist(bot.x, bot.y, other.x, other.y);
      if (d < minDist) {
        minDist = d;
        targetPlayer = other;
      }
    }

    // 2. Check for incoming projectiles -> shield reaction
    for (const proj of this.state.projectiles) {
      if (proj.ownerId === bot.id) continue;
      const d = dist(bot.x, bot.y, proj.x, proj.y);
      if (d < 180 && bot.shield > 20) {
        input.shield = true;
        break;
      }
    }

    if (targetPlayer) {
      // Lead target aim
      const leadX = targetPlayer.x + targetPlayer.vx * 10;
      const leadY = targetPlayer.y + targetPlayer.vy * 10;
      const desiredAngle = Math.atan2(leadY - bot.y, leadX - bot.x);
      const angleDiff = normalizeAngle(desiredAngle - bot.angle);

      if (angleDiff > 0.05) input.turnRight = true;
      else if (angleDiff < -0.05) input.turnLeft = true;

      // Fire when facing target
      if (Math.abs(angleDiff) < 0.35 && minDist < 900) {
        input.fire = true;
      }

      // Movement behavior: keep comfortable combat distance (200 - 500)
      if (minDist > 450) {
        input.thrust = true;
        if (minDist > 750 && bot.boostEnergy > 40) {
          input.boost = true;
        }
      } else if (minDist < 180) {
        input.reverse = true;
      } else {
        // Orbit / strafe
        if (Math.random() < 0.5) input.thrust = true;
      }
    } else {
      // Wander towards arena center if idle
      const centerAngle = Math.atan2(ARENA_HEIGHT / 2 - bot.y, ARENA_WIDTH / 2 - bot.x);
      const diff = normalizeAngle(centerAngle - bot.angle);
      if (diff > 0.1) input.turnRight = true;
      else if (diff < -0.1) input.turnLeft = true;
      input.thrust = true;
    }

    // Avoid arena boundary
    if (bot.x < 150 || bot.x > ARENA_WIDTH - 150 || bot.y < 150 || bot.y > ARENA_HEIGHT - 150) {
      const toCenterX = ARENA_WIDTH / 2 - bot.x;
      const toCenterY = ARENA_HEIGHT / 2 - bot.y;
      const turnCenter = normalizeAngle(Math.atan2(toCenterY, toCenterX) - bot.angle);
      input.turnLeft = turnCenter < 0;
      input.turnRight = turnCenter > 0;
      input.thrust = true;
    }

    return input;
  }

  private updateProjectiles(dt: number) {
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const p = this.state.projectiles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.state.projectiles.splice(i, 1);
        continue;
      }

      // Homing guidance
      if (p.type === 'homing' && p.targetPlayerId) {
        const target = this.state.players[p.targetPlayerId];
        if (target && target.isAlive) {
          const desiredAngle = Math.atan2(target.y - p.y, target.x - p.x);
          const diff = normalizeAngle(desiredAngle - p.angle);
          p.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.08);
          const speed = 12;
          p.vx = Math.cos(p.angle) * speed;
          p.vy = Math.sin(p.angle) * speed;
        }
      }

      p.x += p.vx;
      p.y += p.vy;

      // Despawn on arena boundary
      if (p.x < 0 || p.x > ARENA_WIDTH || p.y < 0 || p.y > ARENA_HEIGHT) {
        this.createSparkImpact(p.x, p.y, p.ownerColor);
        this.state.projectiles.splice(i, 1);
      }
    }
  }

  private updateAsteroids(dt: number) {
    for (const ast of this.state.asteroids) {
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.angle += ast.angularVelocity;

      // Wrap around arena boundaries smoothly
      if (ast.x < -ast.radius) ast.x = ARENA_WIDTH + ast.radius;
      else if (ast.x > ARENA_WIDTH + ast.radius) ast.x = -ast.radius;

      if (ast.y < -ast.radius) ast.y = ARENA_HEIGHT + ast.radius;
      else if (ast.y > ARENA_HEIGHT + ast.radius) ast.y = -ast.radius;
    }
  }

  private updatePowerUps(dt: number) {
    for (let i = this.state.powerUps.length - 1; i >= 0; i--) {
      const pu = this.state.powerUps[i];
      pu.duration -= dt;
      pu.pulse += dt * 3;

      if (pu.duration <= 0) {
        this.state.powerUps.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const pt = this.state.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.state.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha = pt.life / pt.maxLife;
    }
  }

  private resolveCollisions() {
    // A. Projectiles vs Players
    for (let pi = this.state.projectiles.length - 1; pi >= 0; pi--) {
      const p = this.state.projectiles[pi];
      let hit = false;

      for (const id in this.state.players) {
        const player = this.state.players[id];
        if (!player.isAlive || player.id === p.ownerId || player.invulnerableTimer > 0) continue;

        const shipHitRadius = player.isShieldActive ? 28 : 20;
        const d = dist(p.x, p.y, player.x, player.y);

        if (d < shipHitRadius + p.radius) {
          hit = true;
          this.state.projectiles.splice(pi, 1);

          if (player.isShieldActive && player.shield > 0) {
            // Deflector shield absorbed damage
            player.shield = Math.max(0, player.shield - p.damage * 0.8);
            this.createShieldRipple(player.x, player.y, player.color);
            this.soundCallback?.({ shield: true });
          } else {
            // Hull took direct damage
            player.health -= p.damage;
            this.createSparkImpact(p.x, p.y, '#ff3344');
            this.soundCallback?.({ hit: true });

            if (player.health <= 0) {
              this.handlePlayerKill(p.ownerId, player);
            }
          }
          break;
        }
      }
      if (hit) continue;

      // B. Projectiles vs Asteroids
      for (let ai = this.state.asteroids.length - 1; ai >= 0; ai--) {
        const ast = this.state.asteroids[ai];
        const d = dist(p.x, p.y, ast.x, ast.y);

        if (d < ast.radius + p.radius) {
          hit = true;
          ast.health -= p.damage;
          this.createSparkImpact(p.x, p.y, '#a0aab8');
          this.soundCallback?.({ hit: true });

          // Non-railgun projectiles destroy on asteroid impact
          if (p.type !== 'railgun') {
            this.state.projectiles.splice(pi, 1);
          }

          if (ast.health <= 0) {
            this.destroyAsteroid(ai, p.ownerId);
          }
          break;
        }
      }
    }

    // C. Players vs Power-Ups
    for (let pui = this.state.powerUps.length - 1; pui >= 0; pui--) {
      const pu = this.state.powerUps[pui];
      for (const id in this.state.players) {
        const player = this.state.players[id];
        if (!player.isAlive) continue;

        if (dist(player.x, player.y, pu.x, pu.y) < 32) {
          this.applyPowerUp(player, pu.type);
          this.createShockwave(pu.x, pu.y, '#00ff88', 25);
          this.soundCallback?.({ powerUp: true });
          this.state.powerUps.splice(pui, 1);
          break;
        }
      }
    }

    // D. Players vs Asteroids (ramming/crashing)
    for (const id in this.state.players) {
      const player = this.state.players[id];
      if (!player.isAlive || player.invulnerableTimer > 0) continue;

      for (const ast of this.state.asteroids) {
        const d = dist(player.x, player.y, ast.x, ast.y);
        const minDist = ast.radius + (player.isShieldActive ? 26 : 18);

        if (d < minDist && d > 0) {
          // Push player away
          const nx = (player.x - ast.x) / d;
          const ny = (player.y - ast.y) / d;
          player.x = ast.x + nx * minDist;
          player.y = ast.y + ny * minDist;

          // Bounce velocity
          const impactSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
          player.vx = nx * (impactSpeed * 0.7 + 2);
          player.vy = ny * (impactSpeed * 0.7 + 2);

          const ramDamage = Math.max(12, impactSpeed * 3.5);
          if (player.isShieldActive && player.shield > 0) {
            player.shield = Math.max(0, player.shield - ramDamage);
            this.createShieldRipple(player.x, player.y, player.color);
            this.soundCallback?.({ shield: true });
          } else {
            player.health -= ramDamage;
            this.createSparkImpact(player.x, player.y, '#ff4444');
            this.soundCallback?.({ hit: true });

            if (player.health <= 0) {
              this.handlePlayerKill('Cosmic Asteroid', player);
            }
          }
        }
      }
    }
  }

  private applyPowerUp(player: PlayerState, type: PowerUpType) {
    if (type === 'repair') {
      player.health = Math.min(player.maxHealth, player.health + 45);
      return;
    }
    if (type === 'shield_boost') {
      player.shield = player.maxShield;
      player.invulnerableTimer = 3.5; // temporary invulnerability
      return;
    }
    // Weapons powerups last 14 seconds
    player.activePowerUp = {
      type,
      duration: 14,
    };
  }

  private destroyAsteroid(index: number, killerId: string) {
    const ast = this.state.asteroids[index];
    this.createExplosion(ast.x, ast.y, '#9e9e9e', ast.tier === 3 ? 24 : 14);
    this.soundCallback?.({ explosion: ast.tier === 3 ? 'medium' : 'small' });

    // Split into smaller tier
    if (ast.tier > 1) {
      const nextTier = (ast.tier - 1) as 1 | 2;
      this.state.asteroids.push(createAsteroid(nextTier, ast.x - 15, ast.y - 15));
      this.state.asteroids.push(createAsteroid(nextTier, ast.x + 15, ast.y + 15));
    }

    // Chance to drop power-up from large asteroid
    if (ast.tier === 3 && Math.random() < 0.45 && this.state.powerUps.length < MAX_POWERUPS) {
      this.state.powerUps.push(createPowerUp(ast.x, ast.y));
    }

    // Reward score to killer
    const killer = this.state.players[killerId];
    if (killer) {
      killer.score += ast.tier * 25;
    }

    this.state.asteroids.splice(index, 1);
  }

  private handlePlayerKill(killerIdOrName: string, victim: PlayerState) {
    victim.isAlive = false;
    victim.deaths += 1;
    victim.respawnTimer = 3.2;

    this.createExplosion(victim.x, victim.y, victim.color, 36);
    this.soundCallback?.({ explosion: 'large' });

    const killer = this.state.players[killerIdOrName];
    let killerName = killer ? killer.name : killerIdOrName;
    let killerColor = killer ? killer.color : '#888888';

    if (killer) {
      killer.kills += 1;
      killer.score += 150;

      // Check match victory condition
      if (killer.kills >= this.state.targetKills && this.state.gameStatus === 'playing') {
        this.state.gameStatus = 'ended';
        this.state.winner = {
          id: killer.id,
          name: killer.name,
          color: killer.color,
          kills: killer.kills,
        };
        this.soundCallback?.({ victory: true });
      }
    }

    // Record in Killfeed
    const feedItem: KillFeedItem = {
      id: `kf_${Date.now()}_${Math.random()}`,
      killerName,
      killerColor,
      victimName: victim.name,
      victimColor: victim.color,
      weapon: killer?.activePowerUp?.type || 'Dual Blaster',
      timestamp: Date.now(),
    };

    this.state.killFeed.unshift(feedItem);
    if (this.state.killFeed.length > 5) {
      this.state.killFeed.pop();
    }
  }

  private maintainSpawns(dt: number) {
    // Keep minimum asteroid population
    if (this.state.asteroids.length < MAX_ASTEROIDS && Math.random() < 0.02) {
      this.state.asteroids.push(createAsteroid(Math.random() < 0.6 ? 3 : 2));
    }

    // Maintain power-up spawns
    if (this.state.powerUps.length < MAX_POWERUPS && Math.random() < 0.008) {
      this.state.powerUps.push(createPowerUp());
    }
  }

  // Visual FX Helpers
  private createExplosion(x: number, y: number, primaryColor: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6;
      const life = 0.4 + Math.random() * 0.6;
      this.state.particles.push({
        id: `pt_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() < 0.6 ? primaryColor : '#ff8800',
        size: 2.5 + Math.random() * 4,
        life,
        maxLife: life,
        alpha: 1,
      });
    }
  }

  private createSparkImpact(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      this.state.particles.push({
        id: `pt_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 1.8,
        life: 0.25,
        maxLife: 0.25,
        alpha: 1,
      });
    }
  }

  private createShieldRipple(x: number, y: number, color: string) {
    this.createShockwave(x, y, color, 15);
  }

  private createShockwave(x: number, y: number, color: string, particleCount: number) {
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3.5;
      this.state.particles.push({
        id: `pt_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.2,
        life: 0.35,
        maxLife: 0.35,
        alpha: 0.8,
      });
    }
  }
}
