"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface GenerateButtonProps {
  onGenerate: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function GenerateButton({ onGenerate, isLoading, disabled }: GenerateButtonProps) {
  return (
    <button
      onClick={onGenerate}
      disabled={disabled || isLoading}
      className={`relative group h-12 w-full px-8 rounded-full font-sans text-xs font-bold tracking-widest uppercase transition-all duration-500 overflow-hidden
        ${isLoading 
          ? 'bg-neutral-800 text-stone-500 cursor-not-allowed' 
          : disabled 
          ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed opacity-50'
          : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 active:scale-95'}`}
      style={!disabled && !isLoading ? {
        borderTop: '1px solid rgba(180, 170, 255, 0.5)',
        boxShadow: '0 0 20px rgba(108, 99, 255, 0.15), inset 0 1px 0 rgba(180,170,255,0.15)'
      } : {}}
    >
      {/* Shine effect for active state */}
      {!disabled && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}

      <div className="relative flex items-center justify-center gap-3">
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} className={disabled ? '' : 'group-hover:rotate-12 transition-transform'} />
            <span>BUILD STUDY PACK</span>
          </>
        )}
      </div>
    </button>
  );
}
