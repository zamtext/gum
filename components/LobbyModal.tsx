'use client';

import React, { useState } from 'react';
import { ShipClassType, SHIP_CLASSES, SHIP_COLORS } from '../lib/game/types';
import { Rocket, Shield, Zap, Crosshair, Users, Play, Github, Sparkles } from 'lucide-react';

interface LobbyModalProps {
  onHostRoom: (roomCode: string, name: string, color: string, shipClass: ShipClassType) => void;
  onJoinRoom: (roomCode: string, name: string, color: string, shipClass: ShipClassType) => void;
  onSoloPractice: (name: string, color: string, shipClass: ShipClassType) => void;
  onOpenExportGuide: () => void;
  initialRoomCode?: string;
  isConnecting: boolean;
  statusMessage?: string;
}

const DEFAULT_NAMES = ['StarHawk', 'NovaBlade', 'ViperOne', 'AstroGhost', 'SolarFlare', 'NebulaRider'];

export default function LobbyModal({
  onHostRoom,
  onJoinRoom,
  onSoloPractice,
  onOpenExportGuide,
  initialRoomCode = '',
  isConnecting,
  statusMessage,
}: LobbyModalProps) {
  const [name, setName] = useState(() => {
    return DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
  });
  const [selectedClass, setSelectedClass] = useState<ShipClassType>('interceptor');
  const [selectedColor, setSelectedColor] = useState(SHIP_COLORS[0].hex);
  const [joinCode, setJoinCode] = useState(initialRoomCode.toUpperCase());
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');

  const handleHost = (e: React.FormEvent) => {
    e.preventDefault();
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    onHostRoom(code, name, selectedColor, selectedClass);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), name, selectedColor, selectedClass);
  };

  const handleSolo = () => {
    onSoloPractice(name, selectedColor, selectedClass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#15151a]/95 border-2 border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-950/70 p-6 sm:p-8 text-slate-100 my-8">
        {/* Title & Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            WebRTC P2P • 100% Free GitHub Pages Ready
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic text-white flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            Cosmic Dogfight
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Real-time peer-to-peer 2D multiplayer space arena dogfights with zero backend server costs.
          </p>
        </div>

        {/* 1. PILOT CUSTOMIZER */}
        <div className="space-y-4 mb-6 bg-[#0a0a0c] p-5 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1.5">
              Pilot Call-Sign
            </label>
            <input
              type="text"
              id="pilot-name-input"
              value={name}
              maxLength={16}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your call-sign"
              className="w-full px-4 py-2.5 rounded-xl bg-[#15151a] border border-slate-700 text-white focus:outline-none focus:border-indigo-400 text-sm font-semibold"
            />
          </div>

          {/* Ship Class Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1.5">
              Select Ship Class
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(SHIP_CLASSES) as ShipClassType[]).map((clsKey) => {
                const cls = SHIP_CLASSES[clsKey];
                const isSelected = selectedClass === clsKey;
                return (
                  <button
                    key={clsKey}
                    type="button"
                    onClick={() => setSelectedClass(clsKey)}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-500/25 to-purple-600/25 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                        : 'bg-[#15151a] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-black italic uppercase mb-1">{cls.name}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{cls.description.split('.')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hull Paint Color */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1.5">
              Hull Paint Scheme
            </label>
            <div className="flex items-center justify-between gap-2">
              {SHIP_COLORS.map((col) => {
                const isSelected = selectedColor === col.hex;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedColor(col.hex)}
                    title={col.name}
                    className={`w-9 h-9 rounded-full transition-transform flex items-center justify-center ${
                      isSelected
                        ? 'scale-110 ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#0a0a0c] shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                        : 'hover:scale-105 opacity-80'
                    }`}
                    style={{ backgroundColor: col.hex }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. PLAY OPTIONS TABS */}
        <div className="flex rounded-xl bg-[#0a0a0c] p-1.5 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              tab === 'create'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Host New Room
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              tab === 'join'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Join with Code
          </button>
        </div>

        {/* Tab 1: Host Room */}
        {tab === 'create' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 text-center">
              Generate a free multiplayer room. Share the room code or invite URL with any friend to fight in real-time!
            </p>
            <button
              id="host-room-btn"
              onClick={handleHost}
              disabled={isConnecting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              {isConnecting ? 'Opening P2P Signaling...' : 'Create Multiplayer Room'}
            </button>
          </div>
        )}

        {/* Tab 2: Join Room */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1.5">
                Enter Room Code
              </label>
              <input
                type="text"
                id="join-code-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. A92XK"
                maxLength={10}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0c] border border-slate-700 text-center tracking-widest text-indigo-300 font-mono text-lg font-black focus:outline-none focus:border-indigo-400 uppercase"
              />
            </div>
            <button
              id="join-room-btn"
              type="submit"
              disabled={isConnecting || !joinCode.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Crosshair className="w-4 h-4" />
              {isConnecting ? 'Connecting to Room...' : 'Connect & Join Battle'}
            </button>
          </form>
        )}

        {/* Instant Solo / Practice Option */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            id="solo-practice-btn"
            onClick={handleSolo}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-[#0a0a0c] hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            Quick Solo vs AI Bot
          </button>

          <button
            type="button"
            onClick={onOpenExportGuide}
            className="w-full sm:w-auto px-3.5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
          >
            <Github className="w-3.5 h-3.5" />
            How to Host on GitHub Pages
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mt-4 p-2.5 rounded-xl bg-[#0a0a0c] border border-indigo-500/30 text-center text-xs font-mono text-indigo-300">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}
