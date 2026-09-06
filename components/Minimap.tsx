'use client';

import React, { useRef, useEffect } from 'react';
import { GameState } from '../lib/game/types';
import { ARENA_WIDTH, ARENA_HEIGHT } from '../lib/game/engine';

interface MinimapProps {
  gameState: GameState;
  localPlayerId: string;
}

export default function Minimap({ gameState, localPlayerId }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const scaleX = w / ARENA_WIDTH;
      const scaleY = h / ARENA_HEIGHT;

      // Dark tactical radar background - Artistic Flair #0a0a0c
      ctx.fillStyle = 'rgba(10, 10, 12, 0.92)';
      ctx.fillRect(0, 0, w, h);

      // Radar grid lines in neon indigo
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, w, h);

      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Radar sweep line effect in electric indigo
      const sweepAngle = (time / 1200) % (Math.PI * 2);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sweepAngle) * (w / 1.5), Math.sin(sweepAngle) * (h / 1.5));
      ctx.stroke();
      ctx.restore();

      // Draw Asteroids
      ctx.fillStyle = '#64748b';
      for (const ast of gameState.asteroids) {
        ctx.beginPath();
        ctx.arc(ast.x * scaleX, ast.y * scaleY, Math.max(1.5, ast.radius * scaleX), 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Power-ups
      ctx.fillStyle = '#00ff88';
      for (const pu of gameState.powerUps) {
        ctx.beginPath();
        ctx.arc(pu.x * scaleX, pu.y * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Players
      for (const id in gameState.players) {
        const p = gameState.players[id];
        if (!p.isAlive) continue;

        const isLocal = id === localPlayerId;
        const px = p.x * scaleX;
        const py = p.y * scaleY;

        ctx.fillStyle = isLocal ? '#ffffff' : p.color;
        ctx.beginPath();
        ctx.arc(px, py, isLocal ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Local player direction pointer
        if (isLocal) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + Math.cos(p.angle) * 7, py + Math.sin(p.angle) * 7);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, localPlayerId]);

  return (
    <div id="game-minimap-container" className="relative rounded-2xl overflow-hidden border border-indigo-500/40 shadow-xl shadow-black/60 bg-[#15151a]/95 backdrop-blur-xl">
      <div className="absolute top-1.5 left-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 select-none">
        Tactical Radar
      </div>
      <canvas ref={canvasRef} width={160} height={107} className="block" />
    </div>
  );
}
