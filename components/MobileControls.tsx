'use client';

import React from 'react';
import { Crosshair, Shield, Zap, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileControlsProps {
  onInputStateChange: (key: string, value: boolean) => void;
}

export default function MobileControls({ onInputStateChange }: MobileControlsProps) {
  const handleTouch = (key: string, value: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputStateChange(key, value);
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-4 pointer-events-none z-30 flex items-end justify-between px-4 select-none">
      {/* Direction Pad (Left Hand) */}
      <div className="pointer-events-auto relative w-36 h-36 bg-[#15151a]/90 backdrop-blur-xl rounded-full border-2 border-indigo-500/30 p-2 shadow-2xl shadow-black/80 flex items-center justify-center">
        {/* Up / Thrust */}
        <button
          onTouchStart={handleTouch('thrust', true)}
          onTouchEnd={handleTouch('thrust', false)}
          onMouseDown={handleTouch('thrust', true)}
          onMouseUp={handleTouch('thrust', false)}
          className="absolute top-1.5 w-11 h-11 rounded-full bg-[#0a0a0c] active:bg-indigo-500/40 text-indigo-300 flex items-center justify-center border border-slate-700 active:scale-95 transition-transform shadow"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        {/* Down / Reverse */}
        <button
          onTouchStart={handleTouch('reverse', true)}
          onTouchEnd={handleTouch('reverse', false)}
          onMouseDown={handleTouch('reverse', true)}
          onMouseUp={handleTouch('reverse', false)}
          className="absolute bottom-1.5 w-11 h-11 rounded-full bg-[#0a0a0c] active:bg-indigo-500/40 text-indigo-300 flex items-center justify-center border border-slate-700 active:scale-95 transition-transform shadow"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Left */}
        <button
          onTouchStart={handleTouch('turnLeft', true)}
          onTouchEnd={handleTouch('turnLeft', false)}
          onMouseDown={handleTouch('turnLeft', true)}
          onMouseUp={handleTouch('turnLeft', false)}
          className="absolute left-1.5 w-11 h-11 rounded-full bg-[#0a0a0c] active:bg-indigo-500/40 text-indigo-300 flex items-center justify-center border border-slate-700 active:scale-95 transition-transform shadow"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Right */}
        <button
          onTouchStart={handleTouch('turnRight', true)}
          onTouchEnd={handleTouch('turnRight', false)}
          onMouseDown={handleTouch('turnRight', true)}
          onMouseUp={handleTouch('turnRight', false)}
          className="absolute right-1.5 w-11 h-11 rounded-full bg-[#0a0a0c] active:bg-indigo-500/40 text-indigo-300 flex items-center justify-center border border-slate-700 active:scale-95 transition-transform shadow"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Center hub */}
        <div className="w-6 h-6 rounded-full bg-slate-900 border border-indigo-500/40" />
      </div>

      {/* Action Buttons (Right Hand) */}
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        <div className="flex gap-2.5">
          {/* Turbo Boost */}
          <button
            onTouchStart={handleTouch('boost', true)}
            onTouchEnd={handleTouch('boost', false)}
            onMouseDown={handleTouch('boost', true)}
            onMouseUp={handleTouch('boost', false)}
            className="w-13 h-13 rounded-2xl bg-[#15151a]/90 active:bg-amber-500/40 border border-amber-500/40 text-amber-400 flex flex-col items-center justify-center active:scale-95 transition-transform shadow-xl"
          >
            <Zap className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">DASH</span>
          </button>

          {/* Deflector Shield */}
          <button
            onTouchStart={handleTouch('shield', true)}
            onTouchEnd={handleTouch('shield', false)}
            onMouseDown={handleTouch('shield', true)}
            onMouseUp={handleTouch('shield', false)}
            className="w-13 h-13 rounded-2xl bg-[#15151a]/90 active:bg-indigo-500/40 border border-indigo-500/40 text-indigo-300 flex flex-col items-center justify-center active:scale-95 transition-transform shadow-xl"
          >
            <Shield className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">SHIELD</span>
          </button>
        </div>

        {/* Primary Blaster Fire Button */}
        <button
          onTouchStart={handleTouch('fire', true)}
          onTouchEnd={handleTouch('fire', false)}
          onMouseDown={handleTouch('fire', true)}
          onMouseUp={handleTouch('fire', false)}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 active:from-rose-500 active:to-indigo-500 border-2 border-white/30 text-white flex flex-col items-center justify-center active:scale-95 transition-transform shadow-[0_0_25px_rgba(99,102,241,0.5)]"
        >
          <Crosshair className="w-8 h-8" />
          <span className="text-[10px] font-black uppercase tracking-widest italic">FIRE</span>
        </button>
      </div>
    </div>
  );
}
