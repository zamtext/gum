'use client';

import React, { useState } from 'react';
import { GameState, PlayerState, SHIP_CLASSES } from '../lib/game/types';
import {
  Shield,
  Heart,
  Zap,
  Volume2,
  VolumeX,
  Copy,
  Check,
  HelpCircle,
  Github,
  Wifi,
  Users,
  Trophy,
  Bot,
} from 'lucide-react';
import Minimap from './Minimap';

interface HUDProps {
  gameState: GameState;
  localPlayerId: string;
  roomCode: string;
  isHost: boolean;
  ping: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onAddBot?: () => void;
  onRemoveBot?: () => void;
  onOpenExportGuide: () => void;
  onLeaveRoom: () => void;
}

export default function HUD({
  gameState,
  localPlayerId,
  roomCode,
  isHost,
  ping,
  isMuted,
  onToggleMute,
  onAddBot,
  onRemoveBot,
  onOpenExportGuide,
  onLeaveRoom,
}: HUDProps) {
  const [copied, setCopied] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const localPlayer = gameState.players[localPlayerId] as PlayerState | undefined;
  const classDef = localPlayer ? SHIP_CLASSES[localPlayer.shipClass] : SHIP_CLASSES.interceptor;

  // Format match time mm:ss
  const minutes = Math.floor(gameState.matchTime / 60);
  const seconds = Math.floor(gameState.matchTime % 60);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Sorted leaderboard
  const playerList = Object.values(gameState.players).sort((a, b) => b.kills - a.kills || b.score - a.score);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const healthPct = localPlayer ? Math.max(0, (localPlayer.health / localPlayer.maxHealth) * 100) : 0;
  const shieldPct = localPlayer ? Math.max(0, (localPlayer.shield / localPlayer.maxShield) * 100) : 0;
  const boostPct = localPlayer ? Math.max(0, localPlayer.boostEnergy) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden z-20">
      {/* 1. TOP STATUS BAR */}
      <div className="flex items-start justify-between gap-3 w-full">
        {/* Left: Room & Arena Identity */}
        <div className="pointer-events-auto flex items-center gap-3 bg-[#15151a]/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl px-4 py-2.5 shadow-xl shadow-black/50">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <span className="text-base font-black italic text-white">N</span>
          </div>

          <div className="flex flex-col pr-3 border-r border-slate-800">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Room Code</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-black text-white tracking-wider">{roomCode}</span>
              <button
                onClick={handleCopyLink}
                title="Copy invite URL"
                className="p-1 rounded hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Connected players counter */}
          <div className="flex flex-col pr-2">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Active Squad</span>
            <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              {Object.keys(gameState.players).length} Pilots
            </span>
          </div>

          {/* Host Add/Remove Bot controls */}
          {isHost && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={onAddBot}
                title="Add AI Drone bot"
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 transition"
              >
                <Bot className="w-3 h-3" />
                +Bot
              </button>
              {playerList.some((p) => p.isBot) && (
                <button
                  onClick={onRemoveBot}
                  title="Remove an AI bot"
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition"
                >
                  -Bot
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Match Goal & Timer */}
        <div className="flex flex-col items-center bg-[#15151a]/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl px-6 py-2 shadow-xl shadow-black/50">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              TARGET: <span className="text-amber-400 font-bold">{gameState.targetKills}</span> KILLS
            </span>
          </div>
          <div className="font-mono text-xl font-black italic text-white tracking-wider">
            {timeFormatted}
          </div>
        </div>

        {/* Right: Network Connection, Audio, Info & GitHub Hosting */}
        <div className="pointer-events-auto flex items-center gap-3 bg-[#15151a]/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl px-4 py-2.5 shadow-xl shadow-black/50">
          {/* Ping indicator */}
          <div className="flex flex-col items-end pr-3 border-r border-slate-800">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Connection</span>
            <span className="text-emerald-400 font-mono text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              {ping < 80 ? 'STABLE' : 'FAIR'} ({ping}ms)
            </span>
          </div>

          {/* Sound Mute button */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Controls Toggle */}
          <button
            onClick={() => setShowControls((prev) => !prev)}
            title="Flight controls & guide"
            className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* GitHub Pages Host Guide */}
          <button
            onClick={onOpenExportGuide}
            title="Host free on GitHub Pages"
            className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/30 flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(99,102,241,0.3)]"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GH Pages</span>
          </button>

          {/* Leave match */}
          <button
            onClick={onLeaveRoom}
            className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* 2. KILLFEED & LEADERBOARD (Top-Right under bar) */}
      <div className="flex justify-end gap-3 pointer-events-none mt-3">
        <div className="flex flex-col items-end gap-2.5 max-w-xs">
          {/* Live Killfeed */}
          <div className="flex flex-col gap-1 w-full">
            {gameState.killFeed.slice(0, 4).map((kf) => (
              <div
                key={kf.id}
                className="text-[11px] font-mono bg-[#15151a]/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1 text-slate-300 shadow flex items-center justify-end gap-1.5 animate-fadeIn"
              >
                <span className="font-bold" style={{ color: kf.killerColor }}>
                  {kf.killerName}
                </span>
                <span className="text-slate-500 text-[10px] font-mono">[{kf.weapon}]</span>
                <span className="font-bold" style={{ color: kf.victimColor }}>
                  {kf.victimName}
                </span>
              </div>
            ))}
          </div>

          {/* Leaderboard Panel */}
          <div className="pointer-events-auto bg-[#15151a]/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 w-60 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400">
                Leaderboard
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                K / D
              </span>
            </div>
            <div className="space-y-1.5">
              {playerList.slice(0, 5).map((p, idx) => {
                const isLocal = p.id === localPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition ${
                      isLocal
                        ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-white/5 border-white/5 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className={`text-xs font-black italic ${
                          idx === 0
                            ? 'text-amber-500'
                            : idx === 1
                            ? 'text-slate-300'
                            : idx === 2
                            ? 'text-indigo-400'
                            : 'text-slate-500'
                        }`}
                      >
                        0{idx + 1}
                      </span>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className={`text-xs truncate ${isLocal ? 'font-bold text-white' : 'text-slate-300 font-medium'}`}>
                        {p.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {p.kills} <span className="text-slate-600 font-normal">/</span> {p.deaths}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS GUIDE MODAL / OVERLAY */}
      {showControls && (
        <div className="pointer-events-auto self-center bg-[#15151a]/95 border-2 border-indigo-500/50 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-indigo-950/60 z-30 animate-fadeIn my-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-black italic uppercase tracking-tighter text-white text-base">
                Flight Controls
              </h3>
            </div>
            <button
              onClick={() => setShowControls(false)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold transition"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs mt-4 text-slate-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Thrust Engine</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] font-black text-indigo-400">
                  W / ↑
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Turn / Aim</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] font-black text-indigo-400">
                  A/D or Mouse
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Reverse Brake</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] font-black text-indigo-400">
                  S / ↓
                </kbd>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Fire Pulse</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] font-black text-amber-400">
                  SPACE / L-Click
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Deflector Shield</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] font-black text-indigo-400">
                  SHIFT / R-Click
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Hyper Dash</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] font-black text-rose-400">
                  Q / E
                </kbd>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center font-medium">
            Destroy asteroids to unlock rare weapons: Spread Pulse, Railgun, and Shield Overcharge.
          </div>
        </div>
      )}

      {/* 3. BOTTOM COCKPIT HUD & RADAR */}
      <div className="flex items-end justify-between w-full gap-4">
        {/* Local Ship Vital Status - Styled like Artistic Flair HUD */}
        {localPlayer && (
          <div className="pointer-events-auto bg-[#15151a]/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 sm:p-5 w-84 sm:w-96 shadow-2xl shadow-black/70 flex flex-col gap-3">
            {/* Header: Class, Call-sign, and Active Powerup */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-md rotate-45 border border-white/40 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  style={{ backgroundColor: localPlayer.color }}
                />
                <span className="text-sm font-black italic uppercase text-white tracking-wide">{localPlayer.name}</span>
                <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 font-bold">
                  {classDef.name}
                </span>
              </div>
              {localPlayer.activePowerUp && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded font-black tracking-wider animate-pulse">
                  {localPlayer.activePowerUp.type.toUpperCase()} ({Math.ceil(localPlayer.activePowerUp.duration)}s)
                </span>
              )}
            </div>

            {/* Triad Key Metric Digits - Artistic Flair Signature pattern */}
            <div className="grid grid-cols-3 gap-2 bg-[#0a0a0c] p-2.5 rounded-xl border border-slate-800">
              <div className="flex flex-col items-center justify-center border-r border-slate-800 pr-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Health</span>
                <span className="text-2xl font-black italic text-rose-500 leading-none">
                  {Math.ceil(localPlayer.health)}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center border-r border-slate-800 px-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Shield</span>
                <span className="text-2xl font-black italic text-indigo-400 leading-none">
                  {Math.ceil(localPlayer.shield)}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center pl-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Elims</span>
                <span className="text-2xl font-black italic text-amber-400 leading-none">
                  {localPlayer.kills}
                </span>
              </div>
            </div>

            {/* Health & Shield Dual Progress Bars */}
            <div className="space-y-2">
              {/* Hull Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 font-bold">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500/30" />
                    Hull Integrity
                  </span>
                  <span>{Math.round(healthPct)}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-150"
                    style={{ width: `${healthPct}%` }}
                  />
                </div>
              </div>

              {/* Shield Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 font-bold">
                    <Shield className="w-3 h-3 text-indigo-400 fill-indigo-400/30" />
                    Deflector Shield
                  </span>
                  <span>{Math.round(shieldPct)}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-150 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    style={{ width: `${shieldPct}%` }}
                  />
                </div>
              </div>

              {/* Boost Afterburner Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    Hyper Dash Energy
                  </span>
                  <span>{Math.ceil(boostPct)}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-100"
                    style={{ width: `${boostPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Respawn notice if destroyed */}
            {!localPlayer.isAlive && (
              <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-2.5 text-center text-rose-400 font-black italic uppercase text-xs animate-pulse">
                SHIP VAPORIZED — Respawning in {Math.ceil(localPlayer.respawnTimer)}s...
              </div>
            )}
          </div>
        )}

        {/* Tactical Radar Minimap (Bottom-Right) */}
        <div className="pointer-events-auto">
          <Minimap gameState={gameState} localPlayerId={localPlayerId} />
        </div>
      </div>
    </div>
  );
}
