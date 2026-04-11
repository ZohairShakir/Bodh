"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Timer, Trophy, Users, Star, Award } from "lucide-react";
import { getAvatarById } from "./Arena/AvatarPicker";

interface ArenaParticipant {
    user: string;
    avatar: string;
    isReady: boolean;
    score: number;
    hasAnswered: boolean;
    lastAnswerCorrect: boolean | null;
}

interface ArenaState {
    code: string;
    participants: Record<string, ArenaParticipant>;
    status: 'lobby' | 'countdown' | 'playing' | 'finished';
    mode: 'duel' | 'fourway';
    currentQuestionIndex: number;
    questions: any[];
}

interface ArenaQuizProps {
    arenaState: ArenaState;
    currentUser: string;
    onAnswer: (isCorrect: boolean) => void;
    onLeave: () => void;
}

export default function ArenaQuiz({ arenaState, currentUser, onAnswer, onLeave }: ArenaQuizProps) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Reset local selection when question changes
    useEffect(() => {
        setSelectedOption(null);
    }, [arenaState.currentQuestionIndex]);

    if (arenaState.status === 'lobby' || arenaState.status === 'countdown') return null;

    const participantList = Object.values(arenaState.participants || {});
    const sortedPlayers = [...participantList].sort((a, b) => b.score - a.score);

    // ── Finished screen ────────────────────────────────────────────────────────
    if (arenaState.status === 'finished') {
        const winner = sortedPlayers[0];
        const isWinner = winner?.user === currentUser;
        const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;

        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="relative mb-10">
                    <div className="w-32 h-32 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                        <Trophy size={64} />
                    </div>
                    {!isTie && (
                        <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-black border-4 border-[#0a0a0a] animate-bounce">
                            <Award size={24} />
                        </div>
                    )}
                </div>
                
                <h2 className="text-4xl font-playfair italic text-white/90 mb-2">
                    {isTie ? "It's a Tie!" : (isWinner ? "Champion!" : "Arena Result")}
                </h2>
                <p className="text-stone-500 mb-10 max-w-sm text-center italic">
                    {isTie ? "Incredible match! Both players showed absolute clarity." : (isWinner ? "You dominated the arena. Well played!" : "Good effort! Keep clashing to reach the top.")}
                </p>

                <div className="w-full max-w-lg space-y-3 mb-10">
                    {sortedPlayers.map((p, idx) => {
                        if (!p) return null;
                        const av = getAvatarById(p.avatar);
                        return (
                            <div key={p.user} className={`flex items-center justify-between p-5 rounded-[24px] border transition-all duration-500 ${p.user === currentUser ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20' : 'bg-white/[0.03] border-white/10'}`}>
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center w-8">
                                        <span className={`text-xl font-bold font-mono ${idx === 0 ? 'text-yellow-400' : 'text-white/20'}`}>#{idx + 1}</span>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl ${av.color} flex items-center justify-center text-white shadow-lg`}>
                                        {React.cloneElement(av.icon as React.ReactElement, { size: 24 })}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white/90">{p.user} {p.user === currentUser && '(You)'}</h4>
                                        <div className="flex items-center gap-1 opacity-40">
                                            <Star size={10} className="text-yellow-500" />
                                            <span className="text-[9px] uppercase tracking-widest font-bold">Elite Clarity</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-mono text-2xl text-violet-400">{p.score}</span>
                                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Points Earned</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4">
                    <button onClick={onLeave} className="btn-outline !px-10">Return to HQ</button>
                    <button onClick={() => window.location.reload()} className="btn-play-clean bg-violet-600 hover:bg-violet-700 !text-white !px-10">Play Again</button>
                </div>
            </div>
        );
    }

    const quiz = arenaState.questions || [];
    const currentQuestion = quiz[arenaState.currentQuestionIndex];
    if (!currentQuestion) return (
        <div className="flex items-center justify-center py-20 animate-pulse text-stone-700 uppercase tracking-widest text-sm">
            Fetching Next Challenge...
        </div>
    );

    const myParticipant = arenaState.participants[currentUser];
    const iAnswered = myParticipant?.hasAnswered === true;
    const everyoneAnswered = participantList.every(p => p.hasAnswered);
    const someoneGotItRight = participantList.some(p => p.lastAnswerCorrect === true && p.hasAnswered);

    // Show reveal if everyone answered or (if not solo) someone got it right
    const questionDone = everyoneAnswered || (someoneGotItRight && participantList.length > 1);
    const isMyTurnLocked = iAnswered || questionDone;

    const handleOptionSelect = (index: number) => {
        if (isMyTurnLocked || selectedOption !== null) return;
        setSelectedOption(index);
        const isCorrect = index === currentQuestion.correct_index;
        onAnswer(isCorrect);
    };

    const getOptionStyle = (idx: number) => {
        const isSelected = selectedOption === idx;
        const isCorrectOption = idx === currentQuestion.correct_index;

        if (!isMyTurnLocked) {
            return "bg-white/[0.03] border-white/10 text-stone-400 hover:bg-white/[0.08] hover:border-white/30 cursor-pointer active:scale-[0.98]";
        }

        if (isSelected) {
            return isCorrectOption
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                : "bg-red-500/20 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.1)]";
        }

        if (isCorrectOption && questionDone) {
            return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/60 ring-1 ring-emerald-500/10";
        }

        return "bg-white/[0.01] border-white/5 text-stone-600 opacity-40 grayscale";
    };

    if (!currentQuestion) return null;

    return (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-700">
            {/* GAME HUD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Scoreboard Sidebar (on large screens, row on mobile) */}
                <div className="order-2 md:order-1 md:col-span-1 space-y-3">
                    <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-4 flex items-center gap-2">
                        <Users size={12} /> Live Standing
                    </div>
                    {sortedPlayers.map((p, idx) => {
                        if (!p) return null;
                        const av = getAvatarById(p.avatar);
                        const isMe = p.user === currentUser;
                        return (
                            <div key={p.user} className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-500 ${isMe ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl ${av.color} flex items-center justify-center text-white text-[10px] shadow-lg`}>
                                        {React.cloneElement(av.icon as React.ReactElement, { size: 16 })}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white/80 truncate max-w-[60px]">{p.user}</span>
                                        <span className={`text-[8px] font-mono ${idx === 0 ? 'text-yellow-500' : 'text-white/20'}`}>{idx === 0 ? '★ CHIEF' : 'RIVAL'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-white/60">{p.score}</span>
                                    {p.hasAnswered && (
                                        <span className={`w-2 h-2 rounded-full ${p.lastAnswerCorrect ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Arena Content */}
                <div className="order-1 md:order-2 md:col-span-3 space-y-6">
                    {/* Header: Question Counter & Timer */}
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-6 rounded-[24px]">
                         <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">CURRENT STAGE</span>
                            <span className="font-mono text-2xl text-white/90">
                                {arenaState.currentQuestionIndex + 1}
                                <span className="text-white/20 text-lg">/{quiz.length}</span>
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">TIME REMAINING</span>
                            <div className="flex items-center gap-2">
                                <Timer size={18} className="text-orange-400 animate-pulse" />
                                <span className="font-mono text-2xl text-orange-400">12s</span>
                            </div>
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-white/[0.03] border border-white/10 p-8 sm:p-12 rounded-[40px] shadow-2xl relative overflow-hidden backdrop-blur-xl">
                        {questionDone && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 w-full animate-progress-reveal" />
                            </div>
                        )}

                        <h3 className="text-2xl sm:text-3xl font-medium text-white/90 leading-tight mb-10">
                            {currentQuestion.question}
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            {(currentQuestion?.options || []).map((option: string, idx: number) => {
                                const isSelected = selectedOption === idx;
                                const isCorrectOption = idx === currentQuestion.correct_index;

                                return (
                                    <button
                                        key={idx}
                                        disabled={isMyTurnLocked}
                                        onClick={() => handleOptionSelect(idx)}
                                        className={`text-left p-6 rounded-3xl border transition-all duration-300 flex items-center justify-between group ${getOptionStyle(idx)}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold font-mono group-hover:bg-white/10 transition-colors">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="text-sm sm:text-base font-medium pr-4">{option}</span>
                                        </div>
                                        {isMyTurnLocked && isSelected && isCorrectOption && <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />}
                                        {isMyTurnLocked && isSelected && !isCorrectOption && <XCircle size={24} className="text-red-400 flex-shrink-0" />}
                                        {isMyTurnLocked && !isSelected && isCorrectOption && questionDone && <CheckCircle2 size={24} className="text-emerald-400/50 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback Overlay Box */}
                    {iAnswered && (
                        <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/5 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className={`p-3 rounded-2xl ${myParticipant.lastAnswerCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {myParticipant.lastAnswerCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                             </div>
                             <div>
                                <h4 className="font-bold text-white/90 text-sm mb-1">
                                    {myParticipant.lastAnswerCorrect ? "Absolute Clarity! (+15 pts)" : "Incorrect Insight."}
                                </h4>
                                <p className="text-stone-500 text-xs leading-relaxed max-w-md">
                                    {currentQuestion.explanation}
                                </p>
                                {questionDone && (
                                    <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.3em] text-violet-400 animate-pulse">
                                        Initializing next challenge...
                                    </p>
                                )}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

