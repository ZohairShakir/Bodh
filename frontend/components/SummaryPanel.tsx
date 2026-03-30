"use client";

import React from "react";
import { BookOpen, MessageSquare } from "lucide-react";

interface Topic {
    topic: string;
    bullets: string[];
}

interface SummaryPanelProps {
    summary: Topic[];
    isLoading: boolean;
    onAskTutor?: (topic: string, bullets: string[]) => void;
}

export default function SummaryPanel({ summary, isLoading, onAskTutor }: SummaryPanelProps) {
    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-3xl h-32" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {summary.map((s, idx) => (
                <div 
                    key={idx} 
                    className="group bg-neutral-900/40 border border-white/10 hover:border-indigo-500/30 transition-all duration-300 rounded-[28px] overflow-hidden shadow-sm"
                >
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-5 md:gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all">
                                <BookOpen size={20} />
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <h3 className="font-playfair italic font-medium text-xl md:text-2xl leading-snug text-white/90">
                                    {s.topic}
                                </h3>
                                {onAskTutor && (
                                    <button 
                                        onClick={() => onAskTutor(s.topic, s.bullets)}
                                        className="mt-1 flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/20 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <MessageSquare size={12} />
                                        <span>Ask Bodh</span>
                                    </button>
                                )}
                            </div>

                            <ul className="space-y-4">
                                {s.bullets.map((bullet, bidx) => (
                                    <li key={bidx} className="flex items-start gap-4">
                                        <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
                                        <span className="text-[14px] md:text-[15px] max-w-3xl leading-relaxed text-stone-300 font-light">
                                            {bullet}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
