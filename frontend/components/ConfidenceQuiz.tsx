"use client";

import React, { useState } from "react";
import { Eye, ShieldCheck, HelpCircle, Check, X, ChevronRight, RotateCcw, Quote, Users, MessageSquare } from "lucide-react";

interface QuizItem {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

interface ConfidenceQuizProps {
    quiz: QuizItem[];
    onRetry: () => void;
    onComplete?: () => void;
    onRegenerate?: (index: number) => Promise<void>;
    isRegenerating?: boolean;
    onFinishDuel?: (score: number, total: number) => void;
    duelResults?: {user: string, score: number, total: number}[];
    onAskTutor?: (context: any) => void;
    onCompleteWithResults?: (score: number, total: number, missedIndices: number[]) => void;
    shareCode?: string;
}

export default function ConfidenceQuiz({ quiz, onRetry, onComplete, onRegenerate, isRegenerating, onFinishDuel, duelResults, onAskTutor, onCompleteWithResults, shareCode }: ConfidenceQuizProps) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [localRegen, setLocalRegen] = useState(false);
    const [missedIndices, setMissedIndices] = useState<number[]>([]);
    const [copyStatus, setCopyStatus] = useState(false);

    const finishAssessment = () => {
        setIsFinished(true);
        onFinishDuel?.(score, quiz.length);
        onCompleteWithResults?.(score, quiz.length, missedIndices);
    };

    const copyShareLink = () => {
        if (!shareCode) return;
        const url = `${window.location.origin}/dashboard/duel/${shareCode}`;
        navigator.clipboard.writeText(url);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 3000);
    };

    if (!quiz || quiz.length === 0) {
        return (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[32px]">
                <ShieldCheck size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-stone-500 italic">No assessment available for this session.</p>
            </div>
        );
    }

    const handleAnswer = (idx: number) => {
        if (selectedIdx !== null) return;
        setSelectedIdx(idx);
        if (idx === quiz[currentIdx].correct_index) {
            setScore(prev => prev + 1);
        } else {
            setMissedIndices(prev => [...prev, currentIdx]);
        }
    };

    const nextQuestion = () => {
        if (currentIdx + 1 < quiz.length) {
            setCurrentIdx(prev => prev + 1);
            setSelectedIdx(null);
        } else {
            finishAssessment();
        }
    };

    if (isFinished) {
        const percentage = Math.round((score / quiz.length) * 100);
        return (
            <div className="max-w-xl mx-auto p-12 glass rounded-3xl text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                    <ShieldCheck size={48} />
                </div>
                <div>
                    <h2 className="text-4xl font-playfair italic font-medium mb-2 text-white/90">Clarity Achieved.</h2>
                    <p className="text-stone-500 text-sm tracking-wide">Your knowledge synthesis is complete. Review your performance below.</p>
                </div>
                
                <div className="flex justify-center gap-12">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-1">{score}/{quiz.length}</div>
                        <div className="text-xs uppercase tracking-widest text-stone-500">Correct</div>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl font-light text-indigo-400 mb-2">{percentage}%</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">Accuracy Rating</div>
                    </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm italic text-stone-400">
                      {percentage >= 80 ? "Excellent mastery! You're ready for the exam." : 
                       percentage >= 50 ? "Solid understanding. A quick review would solidify it." : 
                       "Good start. Let's revisit the notes and try again."}
                  </p>

                  {duelResults && duelResults.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
                              <Users size={12} />
                              <span>Live Duel Rankings</span>
                          </div>
                          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                              {duelResults.sort((a,b) => b.score - a.score).map((res, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                      <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-mono text-stone-600">#{i+1}</span>
                                          <span className="text-xs font-medium text-white/80">{res.user}</span>
                                      </div>
                                      <span className="text-xs font-bold text-indigo-400">{res.score}/{res.total}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <button 
                        onClick={onRetry}
                        className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-semibold text-xs border border-white/5 opacity-60 hover:opacity-100"
                    >
                        <RotateCcw size={16} className="transition-transform group-hover:-rotate-45" />
                        RETRY
                    </button>
                    <button 
                        onClick={onComplete}
                        className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-semibold text-xs border border-white/5 opacity-60 hover:opacity-100"
                    >
                        <Eye size={16} />
                        REVIEW
                    </button>
                    
                    {shareCode && (
                        <button 
                            onClick={copyShareLink}
                            className={`col-span-1 sm:col-span-2 group flex items-center justify-center gap-3 p-5 rounded-2xl transition-all font-bold text-sm shadow-xl active:scale-95 ${copyStatus ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-600/20'}`}
                        >
                            <Users size={18} className="group-hover:rotate-12 transition-transform" />
                            {copyStatus ? "LINK COPIED!" : "CHALLENGE A FRIEND 1V1"}
                        </button>
                    )}
                  </div>
                </div>
            </div>
        );
    }

    const currentQ = quiz[currentIdx];

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Progress Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-700 ease-out"
                        style={{ width: `${((currentIdx + 1) / quiz.length) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-mono text-stone-500 uppercase tracking-widest">
                    Question {currentIdx + 1}<span className="text-stone-700"> / {quiz.length}</span>
                </span>
            </div>

            {/* Question Card */}
            <div className="glass rounded-[28px] p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-lg border border-white/10">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                    <HelpCircle size={100} />
                </div>

                <div className="flex justify-between items-start gap-4 z-10 relative">
                    <h3 className={`text-[18px] sm:text-[22px] font-medium leading-snug tracking-tight text-white/95 flex-1 transition-opacity duration-300 ${isRegenerating || localRegen ? 'opacity-30' : 'opacity-100'}`}>
                        {currentQ.question}
                    </h3>
                    
                    {onRegenerate && selectedIdx === null && (
                        <button 
                            onClick={async () => {
                                setLocalRegen(true);
                                await onRegenerate(currentIdx);
                                setLocalRegen(false);
                            }}
                            disabled={isRegenerating || localRegen}
                            className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all group/regen"
                            title="Regenerate this question"
                        >
                            <RotateCcw size={14} className={`${isRegenerating || localRegen ? 'animate-spin' : 'group-hover/regen:-rotate-45'} transition-transform`} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                    {currentQ.options.map((option, idx) => {
                        const isCorrect = idx === currentQ.correct_index;
                        const isSelected = idx === selectedIdx;
                        const showCorrect = selectedIdx !== null && isCorrect;
                        const showWrong = isSelected && !isCorrect;

                        return (
                            <button
                                key={idx}
                                disabled={selectedIdx !== null}
                                onClick={() => handleAnswer(idx)}
                                className={`group p-4 flex items-center justify-between rounded-2xl border transition-all duration-300 min-h-[50px] text-left
                                    ${showCorrect 
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-medium shadow-[0_0_12px_rgba(16,185,129,0.1)]' 
                                        : showWrong 
                                        ? 'bg-red-500/10 border-red-500/30 text-red-400 font-medium'
                                        : selectedIdx !== null
                                        ? 'bg-neutral-900/50 border-white/5 opacity-40'
                                        : 'bg-neutral-900/40 border-white/5 hover:border-indigo-500/40 hover:bg-neutral-900/60'}`}
                            >
                                <span className={`text-[14px] leading-snug ${showCorrect || showWrong ? 'text-white' : 'text-stone-300 font-light'}`}>{option}</span>
                                <div className={`flex-shrink-0 ml-3 w-5 h-5 rounded-full border flex items-center justify-center transition-all
                                    ${showCorrect ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 
                                      showWrong ? 'bg-red-500 border-red-500 text-white shadow-md' : 
                                      'border-white/10 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10'}`}>
                                    {showCorrect && <Check size={12} strokeWidth={3} />}
                                    {showWrong && <X size={12} strokeWidth={3} />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {selectedIdx !== null && (
                    <div className="space-y-5 pt-5 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex gap-4">
                            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 h-fit border border-indigo-500/20 shadow-sm">
                                <Quote size={16} />
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-[10px] uppercase tracking-[0.15em] text-emerald-400 font-bold drop-shadow-sm">Why this is correct</div>
                                    {selectedIdx !== currentQ.correct_index && onAskTutor && (
                                        <button 
                                            onClick={() => onAskTutor({
                                                type: "wrong_answer",
                                                question: currentQ.question,
                                                student_answer: currentQ.options[selectedIdx!],
                                                correct_answer: currentQ.options[currentQ.correct_index],
                                                explanation: currentQ.explanation
                                            })}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/20 transition-all opacity-80 hover:opacity-100"
                                        >
                                            <MessageSquare size={12} />
                                            <span>Ask Bodhik why</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-[14px] text-white/80 leading-relaxed font-normal">{currentQ.explanation}</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button 
                                onClick={nextQuestion}
                                className="flex items-center justify-center gap-2 p-3.5 px-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold text-[13px] tracking-wide shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
                            >
                                {currentIdx + 1 === quiz.length ? "FINISH ASSESMENT" : "NEXT QUESTION"}
                                <ChevronRight size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
