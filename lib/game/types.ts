export type ShipClassType = 'interceptor' | 'vanguard' | 'wraith';

export interface ShipClassDef {
  id: ShipClassType;
  name: string;
  description: string;
  maxHealth: number;
  maxShield: number;
  speed: number;
  turnSpeed: number;
  shieldRechargeRate: number;
  fireRate: number; // shots per sec
  color: string;
}

export const SHIP_CLASSES: Record<ShipClassType, ShipClassDef> = {
  interceptor: {
    id: 'interceptor',
    name: 'Interceptor',
    description: 'Balanced speed, agile maneuvering, and standard dual plasma blasters.',
    maxHealth: 100,
    maxShield: 80,
    speed: 5.5,
    turnSpeed: 0.08,
    shieldRechargeRate: 15,
    fireRate: 4,
    color: '#00f0ff',
  },
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard Heavy',
    description: 'Heavy armor plating and reinforced deflector shields with high-impact cannons.',
    maxHealth: 150,
    maxShield: 120,
    speed: 4.2,
    turnSpeed: 0.06,
    shieldRechargeRate: 10,
    fireRate: 3,
    color: '#ffaa00',
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith Scout',
    description: 'Ultra-light chassis engineered for blazing speed and rapid turbo bursts.',
    maxHealth: 75,
    maxShield: 60,
    speed: 7.0,
    turnSpeed: 0.10,
    shieldRechargeRate: 20,
    fireRate: 5,
    color: '#b026ff',
  },
};

export const SHIP_COLORS = [
  { id: 'cyan', name: 'Neon Cyan', hex: '#00f0ff' },
  { id: 'crimson', name: 'Crimson Fury', hex: '#ff2a5f' },
  { id: 'emerald', name: 'Emerald Plasma', hex: '#00ff88' },
  { id: 'amber', name: 'Solar Amber', hex: '#ffaa00' },
  { id: 'purple', name: 'Void Violet', hex: '#b026ff' },
  { id: 'white', name: 'Nova White', hex: '#f0f6fc' },
];

export interface PlayerInput {
  thrust: boolean;
  reverse: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  fire: boolean;
  shield: boolean;
  boost: boolean;
  mouseAngle?: number;
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  shipClass: ShipClassType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  boostEnergy: number; // 0 to 100
  isShieldActive: boolean;
  isBoosting: boolean;
  isThrusting: boolean;
  isAlive: boolean;
  respawnTimer: number; // seconds remaining
  invulnerableTimer: number; // seconds remaining
  score: number;
  kills: number;
  deaths: number;
  isBot: boolean;
  activePowerUp?: {
    type: PowerUpType;
    duration: number;
  };
  lastFireTime: number;
  ping?: number;
}

export type PowerUpType = 'triple_shot' | 'railgun' | 'homing' | 'shield_boost' | 'repair';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  duration: number; // remaining lifetime on map
  pulse: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  ownerColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  damage: number;
  life: number; // remaining seconds
  radius: number;
  type: 'standard' | 'spread' | 'railgun' | 'homing';
  targetPlayerId?: string;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  radius: number;
  health: number;
  maxHealth: number;
  tier: 1 | 2 | 3; // 3 = large, 2 = medium, 1 = small
  vertices: { x: number; y: number }[];
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface KillFeedItem {
  id: string;
  killerName: string;
  killerColor: string;
  victimName: string;
  victimColor: string;
  weapon: string;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  hostId: string;
  arenaWidth: number;
  arenaHeight: number;
  players: Record<string, PlayerState>;
  projectiles: Projectile[];
  asteroids: Asteroid[];
  powerUps: PowerUp[];
  particles: Particle[];
  killFeed: KillFeedItem[];
  matchTime: number; // elapsed seconds
  targetKills: number; // first to X kills wins
  winner?: {
    id: string;
    name: string;
    color: string;
    kills: number;
  };
  gameStatus: 'lobby' | 'playing' | 'ended';
}

export interface NetworkMessage {
  type:
    | 'join'
    | 'join_ack'
    | 'leave'
    | 'state_sync'
    | 'player_input'
    | 'ping'
    | 'pong'
    | 'chat'
    | 'game_start'
    | 'game_restart'
    | 'bot_toggle';
  senderId: string;
  payload?: any;
  timestamp: number;
}
