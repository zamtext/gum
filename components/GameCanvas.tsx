'use client';

import React, { useEffect, useRef } from 'react';
import { GameState, PlayerState, Asteroid, Projectile, PowerUp, Particle, SHIP_CLASSES } from '../lib/game/types';
import { ARENA_WIDTH, ARENA_HEIGHT } from '../lib/game/engine';

interface GameCanvasProps {
  gameState: GameState;
  localPlayerId: string;
  onPointerMove?: (angle: number) => void;
  onFireRequest?: (active: boolean) => void;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  depth: number; // 0.2 (distant), 0.5 (mid), 1.0 (near)
}

export default function GameCanvas({
  gameState,
  localPlayerId,
  onPointerMove,
  onFireRequest,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const cameraRef = useRef<{ x: number; y: number; shake: number }>({ x: 0, y: 0, shake: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Initialize persistent starfield once
  useEffect(() => {
    const stars: Star[] = [];
    const count = 350;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * ARENA_WIDTH,
        y: Math.random() * ARENA_HEIGHT,
        size: Math.random() * 2 + 0.6,
        brightness: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 2 + 1,
        depth: Math.random() < 0.6 ? 0.3 : Math.random() < 0.85 ? 0.6 : 1.0,
      });
    }
    starsRef.current = stars;
  }, []);

  // Main 60 FPS rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Handle Canvas size & DPI
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Track local player
      const localPlayer = gameState.players[localPlayerId];
      const targetCamX = localPlayer ? localPlayer.x : ARENA_WIDTH / 2;
      const targetCamY = localPlayer ? localPlayer.y : ARENA_HEIGHT / 2;

      // Smooth camera interpolation
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;

      // Camera screen shake decay
      if (cameraRef.current.shake > 0) {
        cameraRef.current.shake = Math.max(0, cameraRef.current.shake - dt * 25);
      }
      const shakeX = (Math.random() - 0.5) * cameraRef.current.shake;
      const shakeY = (Math.random() - 0.5) * cameraRef.current.shake;

      // Clear frame with deep cosmic void - Artistic Flair #0a0a0c
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Translate to center of screen with camera offset & shake
      ctx.translate(width / 2 - cameraRef.current.x + shakeX, height / 2 - cameraRef.current.y + shakeY);

      // 1. Draw Nebula Background Gradients
      drawNebulae(ctx);

      // 2. Draw Parallax Starfield
      drawStars(ctx, now / 1000);

      // 3. Draw Arena Boundary Forcefield
      drawArenaBoundaries(ctx, now / 1000);

      // 4. Draw Power-Ups
      drawPowerUps(ctx, gameState.powerUps, now / 1000);

      // 5. Draw Asteroids
      drawAsteroids(ctx, gameState.asteroids);

      // 6. Draw Projectiles
      drawProjectiles(ctx, gameState.projectiles);

      // 7. Draw Ships & Players
      drawPlayers(ctx, gameState.players, localPlayerId, now / 1000);

      // 8. Draw Particles
      drawParticles(ctx, gameState.particles);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameState, localPlayerId]);

  // Pointer move handler for aiming
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onPointerMove) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;

    const localPlayer = gameState.players[localPlayerId];
    if (!localPlayer) return;

    // Local player screen position
    const playerScreenX = canvas.width / 2 + (localPlayer.x - cameraRef.current.x);
    const playerScreenY = canvas.height / 2 + (localPlayer.y - cameraRef.current.y);

    const angle = Math.atan2(mouseScreenY - playerScreenY, mouseScreenX - playerScreenX);
    onPointerMove(angle);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && onFireRequest) {
      onFireRequest(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && onFireRequest) {
      onFireRequest(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none cursor-crosshair">
      <canvas
        ref={canvasRef}
        id="game-viewport-canvas"
        className="w-full h-full block touch-none"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}

// ----------------- DRAWING HELPERS -----------------

function drawNebulae(ctx: CanvasRenderingContext2D) {
  // Atmospheric deep space glowing nebulas - Artistic Flair indigo & violet tones
  const grad1 = ctx.createRadialGradient(700, 500, 80, 700, 500, 750);
  grad1.addColorStop(0, 'rgba(79, 70, 229, 0.22)');
  grad1.addColorStop(0.5, 'rgba(147, 51, 234, 0.12)');
  grad1.addColorStop(1, 'rgba(10, 10, 12, 0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, 1600, 1200);

  const grad2 = ctx.createRadialGradient(1800, 1300, 100, 1800, 1300, 800);
  grad2.addColorStop(0, 'rgba(124, 58, 237, 0.2)');
  grad2.addColorStop(0.6, 'rgba(67, 56, 202, 0.1)');
  grad2.addColorStop(1, 'rgba(10, 10, 12, 0)');
  ctx.fillStyle = grad2;
  ctx.fillRect(1000, 600, 1400, 1000);
}

function drawStars(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  for (let i = 0; i < 280; i++) {
    const seed = i * 9973;
    const x = (seed % ARENA_WIDTH);
    const y = ((seed * 31) % ARENA_HEIGHT);
    const size = (seed % 3) * 0.7 + 0.8;
    const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + i);

    ctx.fillStyle = i % 5 === 0 ? `rgba(199, 210, 254, ${twinkle * 0.85})` : `rgba(255, 255, 255, ${twinkle * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawArenaBoundaries(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  // Outer forcefield boundary in electric indigo - Artistic Flair
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#6366f1';
  ctx.shadowBlur = 18;

  // Outer border
  ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Subtle interior grid lines every 300px
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 300; x < ARENA_WIDTH; x += 300) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ARENA_HEIGHT);
  }
  for (let y = 300; y < ARENA_HEIGHT; y += 300) {
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA_WIDTH, y);
  }
  ctx.stroke();

  // Corner hazard markers in vibrant purple/amber
  const cornerSize = 40;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  // Top-Left
  ctx.strokeRect(4, 4, cornerSize, cornerSize);
  // Top-Right
  ctx.strokeRect(ARENA_WIDTH - cornerSize - 4, 4, cornerSize, cornerSize);
  // Bottom-Left
  ctx.strokeRect(4, ARENA_HEIGHT - cornerSize - 4, cornerSize, cornerSize);
  // Bottom-Right
  ctx.strokeRect(ARENA_WIDTH - cornerSize - 4, ARENA_HEIGHT - cornerSize - 4, cornerSize, cornerSize);

  ctx.restore();
}

function drawPowerUps(ctx: CanvasRenderingContext2D, powerUps: PowerUp[], time: number) {
  for (const pu of powerUps) {
    ctx.save();
    ctx.translate(pu.x, pu.y);

    const pulse = 1 + 0.12 * Math.sin(time * 5 + pu.pulse);
    ctx.scale(pulse, pulse);

    // Color by type
    let color = '#00ff88';
    let label = 'P';
    if (pu.type === 'triple_shot') {
      color = '#00f0ff';
      label = '3X';
    } else if (pu.type === 'railgun') {
      color = '#ff2a5f';
      label = 'RG';
    } else if (pu.type === 'homing') {
      color = '#ffaa00';
      label = 'HM';
    } else if (pu.type === 'shield_boost') {
      color = '#b026ff';
      label = 'SH';
    } else if (pu.type === 'repair') {
      color = '#00ff88';
      label = '+HP';
    }

    // Outer aura
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;

    // Glowing diamond crate
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.fillStyle = 'rgba(15, 25, 35, 0.85)';

    ctx.beginPath();
    ctx.moveTo(0, -pu.radius);
    ctx.lineTo(pu.radius, 0);
    ctx.lineTo(0, pu.radius);
    ctx.lineTo(-pu.radius, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Icon text
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);

    ctx.restore();
  }
}

function drawAsteroids(ctx: CanvasRenderingContext2D, asteroids: Asteroid[]) {
  for (const ast of asteroids) {
    ctx.save();
    ctx.translate(ast.x, ast.y);
    ctx.rotate(ast.angle);

    ctx.fillStyle = '#1e2430';
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ast.vertices.forEach((v, idx) => {
      if (idx === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Internal crater lines
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ast.radius * 0.25, -ast.radius * 0.2, ast.radius * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Health bar if damaged
    if (ast.health < ast.maxHealth) {
      ctx.rotate(-ast.angle); // Un-rotate for horizontal health bar
      const barW = ast.radius * 1.6;
      const barH = 4;
      const barY = -ast.radius - 10;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-barW / 2, barY, barW, barH);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(-barW / 2, barY, barW * (ast.health / ast.maxHealth), barH);
    }

    ctx.restore();
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  for (const p of projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    ctx.shadowColor = p.ownerColor;
    ctx.shadowBlur = 10;

    if (p.type === 'railgun') {
      // Long piercing beam
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-20, -2, 40, 4);
      ctx.strokeStyle = '#ff2a5f';
      ctx.lineWidth = 2;
      ctx.strokeRect(-20, -2, 40, 4);
    } else if (p.type === 'homing') {
      // Missile body with flame trail
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();

      // Exhaust glow
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(-7, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Standard / Spread plasma bolt
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = p.ownerColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawPlayers(
  ctx: CanvasRenderingContext2D,
  players: Record<string, PlayerState>,
  localPlayerId: string,
  time: number
) {
  for (const id in players) {
    const player = players[id];
    if (!player.isAlive) continue;

    ctx.save();
    ctx.translate(player.x, player.y);

    // 1. Invulnerability Aura / Shield Bubble
    if (player.invulnerableTimer > 0) {
      const invAlpha = 0.4 + 0.3 * Math.sin(time * 12);
      ctx.strokeStyle = `rgba(255, 215, 0, ${invAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Active Deflector Shield
    if (player.isShieldActive) {
      ctx.save();
      ctx.strokeStyle = player.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = `${player.color}22`; // 13% opacity tint

      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Ship Body
    ctx.rotate(player.angle);

    // Thruster engine flare if thrusting
    if (player.isThrusting) {
      const flareLen = (player.isBoosting ? 26 : 15) + (Math.random() - 0.5) * 6;
      ctx.fillStyle = player.isBoosting ? '#ff8800' : '#00f0ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(-16, -5);
      ctx.lineTo(-16 - flareLen, 0);
      ctx.lineTo(-16, 5);
      ctx.closePath();
      ctx.fill();

      // Inner white core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-16, -2.5);
      ctx.lineTo(-16 - flareLen * 0.5, 0);
      ctx.lineTo(-16, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Render Craft by Class
    drawShipChassis(ctx, player.shipClass, player.color);

    // Un-rotate for HUD floating above ship
    ctx.rotate(-player.angle);

    // 4. Pilot Name, Health, and Shield bars
    drawShipHUD(ctx, player, id === localPlayerId);

    ctx.restore();
  }
}

function drawShipChassis(ctx: CanvasRenderingContext2D, shipClass: string, color: string) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fillStyle = '#111827';

  if (shipClass === 'vanguard') {
    // Heavy wide delta armor
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(8, -14);
    ctx.lineTo(-16, -18);
    ctx.lineTo(-12, -7);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-12, 7);
    ctx.lineTo(-16, 18);
    ctx.lineTo(8, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heavy cockpit
    ctx.fillStyle = color;
    ctx.fillRect(0, -3, 8, 6);
  } else if (shipClass === 'wraith') {
    // Swept forward scout needle
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(6, -6);
    ctx.lineTo(-10, -16);
    ctx.lineTo(-16, -12);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-8, 4);
    ctx.lineTo(-16, 12);
    ctx.lineTo(-10, 16);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Scout cockpit
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Interceptor (Default sleek triangle)
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-14, -14);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sleek cockpit visor
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(3, 0, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawShipHUD(ctx: CanvasRenderingContext2D, player: PlayerState, isLocal: boolean) {
  const barW = 38;
  const barH = 3.5;
  const startY = -34;

  // Name tag
  ctx.font = isLocal ? 'bold 11px system-ui, sans-serif' : '10px system-ui, sans-serif';
  ctx.fillStyle = isLocal ? '#00f0ff' : '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.fillText(player.name + (player.isBot ? ' [BOT]' : ''), 0, startY - 7);

  // Health bar background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(-barW / 2, startY, barW, barH);

  // Health fill
  const healthPercent = Math.max(0, player.health / player.maxHealth);
  ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff2a5f';
  ctx.fillRect(-barW / 2, startY, barW * healthPercent, barH);

  // Shield bar
  const shieldPercent = Math.max(0, player.shield / player.maxShield);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(-barW / 2, startY + barH + 1.5, barW, 2.5);
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-barW / 2, startY + barH + 1.5, barW * shieldPercent, 2.5);

  // Active Power-up indicator
  if (player.activePowerUp) {
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText(
      `${player.activePowerUp.type.toUpperCase()} (${Math.ceil(player.activePowerUp.duration)}s)`,
      0,
      startY - 19
    );
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const pt of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha));
    ctx.fillStyle = pt.color;
    ctx.shadowColor = pt.color;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
