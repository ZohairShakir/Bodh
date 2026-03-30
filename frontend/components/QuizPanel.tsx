"use client";

import React, { useState } from "react";
import { Eye, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import ConfidenceQuiz from "./ConfidenceQuiz";

interface QuizItem {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

interface QuizPanelProps {
    quiz: QuizItem[];
    isLoading: boolean;
    onRegenerate?: (index: number) => Promise<void>;
    isRegenerating?: boolean;
    onFinishDuel?: (score: number, total: number) => void;
    duelResults?: {user: string, score: number, total: number}[];
    onAskTutor?: (ctx: any) => void;
    onCompleteWithResults?: (score: number, total: number, missedIndices: number[]) => void;
    shareCode?: string;
}

export default function QuizPanel({ quiz, isLoading, onRegenerate, isRegenerating, onFinishDuel, duelResults, onAskTutor, onCompleteWithResults, shareCode }: QuizPanelProps) {
    const [mode, setMode] = useState<"browse" | "confidence">("confidence");

    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-2xl h-40" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Mode Selector */}
            <div className="flex justify-center">
                <div className="inline-flex p-1 bg-white/[0.03] border border-white/10 rounded-full overflow-hidden">
                    <button 
                        onClick={() => setMode("browse")}
                        className={`px-8 py-2.5 flex items-center gap-2 rounded-full text-xs font-semibold tracking-wider transition-all
                            ${mode === "browse" ? 'bg-white/10 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
                    >
                        <Eye size={16} />
                        BROWSE MODE
                    </button>
                    <button 
                        onClick={() => setMode("confidence")}
                        className={`px-8 py-2.5 flex items-center gap-2 rounded-full text-xs font-semibold tracking-wider transition-all
                            ${mode === "confidence" ? 'bg-indigo-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
                    >
                        <ShieldCheck size={16} />
                        CONFIDENCE MODE
                    </button>
                </div>
            </div>

            {mode === "browse" ? (
                <div className="space-y-6">
                    {quiz.map((q, idx) => (
                        <div key={idx} className="group bg-white/[0.03] p-8 rounded-[32px] border border-white/5 hover:border-white/10 transition-all duration-500">
                             <div className="flex gap-4">
                                <span className="text-xl font-mono text-stone-700 group-hover:text-indigo-500/80 transition-colors">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </span>
                                <div className="space-y-6 flex-1">
                                    <h3 className="text-lg sm:text-xl font-medium text-white/90 leading-relaxed">
                                        {q.question}
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {q.options.map((option, oi) => (
                                            <div 
                                                key={oi} 
                                                className={`p-4 px-6 rounded-2xl border transition-all duration-300 flex items-center justify-between
                                                    ${oi === q.correct_index 
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                        : 'bg-white/[0.02] border-white/5 text-stone-500'}`}
                                            >
                                                <span className="text-sm font-medium">
                                                    {option}
                                                </span>
                                                {oi === q.correct_index && (
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                     <div className="pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-1 group-hover:translate-y-0">
                                        <div className="bg-emerald-500/5 p-4 rounded-2xl">
                                            <p className="text-[11px] leading-relaxed text-emerald-400/80 italic flex items-start gap-2">
                                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                                <span>{q.explanation}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => setMode("confidence")}
                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest mt-8"
                    >
                        Retake Assessment
                    </button>
                </div>
            ) : (
                <ConfidenceQuiz 
                    quiz={quiz} 
                    onRetry={() => setMode("confidence")} 
                    onComplete={() => setMode("browse")} 
                    onRegenerate={onRegenerate}
                    isRegenerating={isRegenerating}
                    onFinishDuel={onFinishDuel}
                    duelResults={duelResults}
                    onAskTutor={onAskTutor}
                    onCompleteWithResults={onCompleteWithResults}
                    shareCode={shareCode}
                />
            )}
        </div>
    );
}
