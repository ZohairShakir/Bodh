"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Timer, Trophy, Users } from "lucide-react";

interface ArenaParticipant {
    user: string;
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
}

interface QuizItem {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

interface ArenaQuizProps {
    quiz: QuizItem[];
    arenaState: ArenaState;
    currentUser: string;
    onAnswer: (isCorrect: boolean) => void;
    onLeave: () => void;
}

export default function ArenaQuiz({ quiz, arenaState, currentUser, onAnswer, onLeave }: ArenaQuizProps) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Reset local selection when question changes
    useEffect(() => {
        setSelectedOption(null);
    }, [arenaState.currentQuestionIndex]);

    if (arenaState.status === 'lobby' || arenaState.status === 'countdown') return null;

    // ── Finished screen ────────────────────────────────────────────────────────
    if (arenaState.status === 'finished') {
        const sortedPlayers = Object.values(arenaState.participants).sort((a, b) => b.score - a.score);
        const isWinner = sortedPlayers[0]?.user === currentUser;
        const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;

        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-24 h-24 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
                    <Trophy size={48} />
                </div>
                <h2 className="text-3xl font-playfair italic text-white/90 mb-2">
                    {isTie ? "It's a Tie!" : (isWinner ? "You Won!" : "Match Finished")}
                </h2>
                <p className="text-stone-400 mb-8 max-w-sm text-center">
                    The arena has concluded. Here are the final standings for this session.
                </p>

                <div className="w-full max-w-md space-y-3 mb-8">
                    {sortedPlayers.map((p, idx) => (
                        <div key={p.user} className={`flex items-center justify-between p-4 rounded-2xl border ${p.user === currentUser ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`text-xl font-bold font-mono ${idx === 0 ? 'text-yellow-400' : 'text-white/20'}`}>#{idx + 1}</span>
                                <span className="font-medium text-white/80">{p.user} {p.user === currentUser && '(You)'}</span>
                            </div>
                            <span className="font-mono text-xl text-violet-400">{p.score} <span className="text-xs text-white/30">pts</span></span>
                        </div>
                    ))}
                </div>

                <button onClick={onLeave} className="btn-metallic px-8">Return to Dashboard</button>
            </div>
        );
    }

    const currentQuestion = quiz[arenaState.currentQuestionIndex];
    if (!currentQuestion) return null;

    const allParticipants = Object.values(arenaState.participants) as ArenaParticipant[];
    const myParticipant = arenaState.participants[currentUser];
    const iAnswered = myParticipant?.hasAnswered === true;
    const someoneGotItRight = allParticipants.some(p => p.lastAnswerCorrect === true);
    const everyoneAnswered = allParticipants.every(p => p.hasAnswered);
    const questionDone = someoneGotItRight || everyoneAnswered;

    // Only lock MY buttons if I have answered — others keep playing
    const isMyTurnLocked = iAnswered || questionDone;

    const handleOptionSelect = (index: number) => {
        if (isMyTurnLocked || selectedOption !== null) return;
        setSelectedOption(index);
        const isCorrect = index === currentQuestion.correct_index;
        onAnswer(isCorrect);
    };

    // ── Option styling ─────────────────────────────────────────────────────────
    const getOptionStyle = (idx: number) => {
        const isSelected = selectedOption === idx;
        const isCorrectOption = idx === currentQuestion.correct_index;

        if (!isMyTurnLocked) {
            return "bg-white/[0.03] border-white/10 text-stone-400 hover:bg-white/[0.08] hover:border-white/20 cursor-pointer";
        }

        if (isSelected) {
            return isCorrectOption
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-red-500/20 border-red-500/40 text-red-300";
        }

        // Show correct answer when question is fully done (either I got it right or everyone's answered)
        if (isCorrectOption && questionDone) {
            return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/60";
        }

        return "bg-white/[0.01] border-white/5 text-stone-600 opacity-40";
    };

    // ── Feedback message ───────────────────────────────────────────────────────
    const renderFeedback = () => {
        if (!iAnswered && !questionDone) return null;

        let icon = <Timer size={16} className="text-orange-400 mt-0.5 flex-shrink-0 animate-pulse" />;
        let title = "";
        let subtitle = "";

        if (iAnswered) {
            if (myParticipant.lastAnswerCorrect) {
                icon = <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />;
                title = "You got it right! 🎉";
                subtitle = currentQuestion.explanation;
            } else if (questionDone) {
                // I was wrong and question is now over
                icon = <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />;
                title = "Incorrect answer.";
                subtitle = currentQuestion.explanation;
            } else {
                // I was wrong but others are still answering
                icon = <Timer size={16} className="text-orange-400 mt-0.5 flex-shrink-0 animate-pulse" />;
                title = "Wrong answer — waiting for other players...";
                subtitle = "The question is still open for your opponents.";
            }
        } else if (questionDone) {
            // Someone else got it right
            icon = <CheckCircle2 size={16} className="text-sky-400 mt-0.5 flex-shrink-0" />;
            title = "Someone answered correctly!";
            subtitle = currentQuestion.explanation;
        }

        return (
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                {icon}
                <div>
                    <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
                    <p className="text-xs text-stone-500 leading-relaxed">{subtitle}</p>
                    {questionDone && (
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">Next question starting soon...</p>
                    )}
                </div>
            </div>
        );
    };

    // ── HUD ────────────────────────────────────────────────────────────────────
    const isFourway = arenaState.mode === 'fourway' || allParticipants.length > 2;
    const sortedForHUD = [...allParticipants].sort((a, b) => b.score - a.score);

    return (
        <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-500">
            {/* HUD */}
            {isFourway ? (
                // Multi-player HUD: mini scoreboard row
                <div className="flex items-center justify-between gap-3 mb-8 p-4 bg-white/[0.02] border border-white/5 rounded-[24px] flex-wrap">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">QUESTION</span>
                        <span className="font-mono text-xl text-white/90">{arenaState.currentQuestionIndex + 1}<span className="text-white/20 text-base">/{quiz.length}</span></span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {sortedForHUD.map((p, i) => (
                            <div key={p.user} className={`flex flex-col items-center px-4 py-2 rounded-2xl border transition-all ${p.user === currentUser ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.03] border-white/5'}`}>
                                <span className="text-[9px] uppercase tracking-widest font-bold text-stone-500 mb-1">{p.user === currentUser ? 'YOU' : p.user.split(' ')[0]}</span>
                                <span className={`font-mono text-lg font-bold ${i === 0 ? 'text-yellow-400' : 'text-white/60'}`}>{p.score}</span>
                                {p.hasAnswered && (
                                    <span className={`text-[8px] mt-0.5 ${p.lastAnswerCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {p.lastAnswerCorrect ? '✓' : '✗'}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Duel HUD: current 3-column layout
                <div className="flex items-center justify-between mb-8 p-4 bg-white/[0.02] border border-white/5 rounded-[24px]">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">SCORE</span>
                        <span className="font-mono text-xl text-indigo-400">{myParticipant?.score || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">QUESTION</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xl text-white/90">{arenaState.currentQuestionIndex + 1}</span>
                            <span className="text-white/20">/</span>
                            <span className="font-mono text-lg text-white/50">{quiz.length}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">OPPONENT</span>
                        <span className="font-mono text-xl text-red-400">
                            {allParticipants.find(p => p.user !== currentUser)?.score || 0}
                        </span>
                    </div>
                </div>
            )}

            {/* Question Card */}
            <div className="bg-white/[0.03] border border-white/10 p-6 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden">
                {/* Progress bar when locked / question resolving */}
                {questionDone && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 w-full animate-pulse" />
                    </div>
                )}

                <h3 className="text-xl sm:text-2xl font-medium text-white/90 leading-relaxed mb-8">
                    {currentQuestion.question}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrectOption = idx === currentQuestion.correct_index;

                        return (
                            <button
                                key={idx}
                                disabled={isMyTurnLocked}
                                onClick={() => handleOptionSelect(idx)}
                                className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${getOptionStyle(idx)}`}
                            >
                                <span className="text-sm font-medium pr-4">{option}</span>
                                {isMyTurnLocked && isSelected && isCorrectOption && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
                                {isMyTurnLocked && isSelected && !isCorrectOption && <XCircle size={18} className="text-red-400 flex-shrink-0" />}
                                {isMyTurnLocked && !isSelected && isCorrectOption && questionDone && <CheckCircle2 size={18} className="text-emerald-400/50 flex-shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                {renderFeedback()}
            </div>
        </div>
    );
}
