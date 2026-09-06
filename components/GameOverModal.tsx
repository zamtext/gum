'use client';

import React, { useEffect } from 'react';
import { GameState } from '../lib/game/types';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  gameState: GameState;
  localPlayerId: string;
  isHost: boolean;
  onRematch: () => void;
  onReturnToLobby: () => void;
}

export default function GameOverModal({
  gameState,
  localPlayerId,
  isHost,
  onRematch,
  onReturnToLobby,
}: GameOverModalProps) {
  const winner = gameState.winner;
  const isLocalWinner = winner?.id === localPlayerId;

  // Trigger confetti burst on victory
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  }, []);

  const playerList = Object.values(gameState.players).sort((a, b) => b.kills - a.kills || b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#15151a]/95 border-2 border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-950/70 p-6 sm:p-8 text-slate-100 text-center animate-fadeIn">
        {/* Victory Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-400/40 flex items-center justify-center mb-4 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-1 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Match Victorious
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic text-white mb-1.5">
          {isLocalWinner ? 'Victory is Yours, Ace!' : `${winner?.name || 'Pilot'} Emerged Victorious!`}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          First pilot to secure {gameState.targetKills} confirmed dogfight victories.
        </p>

        {/* Final Standings Table */}
        <div className="bg-[#0a0a0c] rounded-2xl border border-slate-800 p-4 mb-6 text-left">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2 flex justify-between px-2">
            <span>Final Standings</span>
            <span>Kills / Deaths</span>
          </div>
          <div className="space-y-1.5">
            {playerList.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between text-xs px-3.5 py-2 rounded-xl border transition ${
                  idx === 0
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                    : 'bg-white/5 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-black italic text-xs ${
                      idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    0{idx + 1}.
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold">{p.name}</span>
                </div>
                <div className="font-mono text-xs">
                  <span className="font-bold text-white">{p.kills}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-slate-400">{p.deaths}</span>
                  <span className="text-indigo-400 ml-2 text-[10px] font-bold">({p.score} pts)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isHost ? (
            <button
              onClick={onRematch}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/30 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Rematch (Host)
            </button>
          ) : (
            <div className="flex-1 py-3.5 px-4 rounded-xl bg-[#0a0a0c] border border-slate-800 text-slate-400 text-xs font-mono flex items-center justify-center">
              Waiting for Host to Rematch...
            </div>
          )}

          <button
            onClick={onReturnToLobby}
            className="px-5 py-3.5 rounded-xl bg-[#0a0a0c] hover:bg-slate-800 text-slate-200 text-xs font-black uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            Return to Hangar
          </button>
        </div>
      </div>
    </div>
  );
}
