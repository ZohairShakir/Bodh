"use client";

import React, { useState } from "react";
import { Link as LinkIcon, Check, Share2 } from "lucide-react";

interface ExportBarProps {
    onCopyLink: () => void;
    isVisible: boolean;
}

export default function ExportBar({ onCopyLink, isVisible }: ExportBarProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        onCopyLink();
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Desktop Sticky Bar */}
            <div className="hidden sm:block fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-1 p-1 bg-neutral-900 shadow-2xl shadow-indigo-500/10 border border-white/10 rounded-full glass animate-in slide-in-from-bottom-8 duration-700 delay-300">
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-indigo-600 text-white text-[11px] font-bold transition-all active:scale-95 group shadow-2xl relative overflow-hidden"
                        style={{
                            borderTop: '1px solid rgba(180, 170, 255, 0.5)',
                            boxShadow: '0 0 20px rgba(108, 99, 255, 0.15), inset 0 1px 0 rgba(180,170,255,0.15)'
                        }}
                    >
                        {copied ? (
                             <>
                                <Check size={14} className="text-white" />
                                <span>COPIED ARENA LINK!</span>
                             </>
                        ) : (
                             <>
                                <Share2 size={14} className="group-hover:rotate-12 transition-transform" />
                                <span>SHARE ARENA LOBBY</span>
                             </>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="sm:hidden fixed bottom-[96px] right-6 z-[105] flex flex-col items-end gap-4 group">
                 <button 
                    onClick={handleCopy}
                    className="glass-metal w-14 h-14 rounded-full flex items-center justify-center text-white/70 hover:text-white shadow-2xl relative overflow-hidden"
                >
                    {copied ? <Check size={20} className="text-emerald-400" /> : <Share2 size={20} />}
                    <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </>
    );
}
