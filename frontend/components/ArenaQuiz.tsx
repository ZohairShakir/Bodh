"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, XCircle, Timer, Trophy } from "lucide-react";

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

    const handleOptionSelect = (index: number) => {
        if (selectedOption !== null || myParticipant?.hasAnswered || anyoneElseAnswered) return;
        
        setSelectedOption(index);
        const isCorrect = index === currentQuestion.correct_index;
        onAnswer(isCorrect);
    };

    if (arenaState.status === 'lobby' || arenaState.status === 'countdown') return null;

    if (arenaState.status === 'finished') {
        const sortedPlayers = Object.values(arenaState.participants).sort((a, b) => b.score - a.score);
        const me = sortedPlayers.find(p => p.user === currentUser);
        const isWinner = sortedPlayers[0]?.user === currentUser;
        const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;

        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-24 h-24 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
                    <Trophy size={48} />
                </div>
                <h2 className="text-3xl font-playfair italic text-white/90 mb-2">
                    {isTie ? "It's a Tie!" : (isWinner ? "You Won the Duel!" : "Match Finished")}
                </h2>
                <p className="text-stone-400 mb-8 max-w-sm text-center">
                    The arena has concluded. Here are the final standings for this session.
                </p>

                <div className="w-full max-w-md space-y-3 mb-8">
                    {sortedPlayers.map((p, idx) => (
                        <div key={p.user} className={`flex items-center justify-between p-4 rounded-2xl border ${p.user === currentUser ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold font-mono text-white/20">#{idx + 1}</span>
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

    const myParticipant = arenaState.participants[currentUser];
    const opponentParticipant = Object.values(arenaState.participants).find(p => p.user !== currentUser);
    
    const anyoneElseAnswered = opponentParticipant?.hasAnswered;
    const isLocked = selectedOption !== null || myParticipant?.hasAnswered || anyoneElseAnswered;

    return (
        <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-500">
            {/* HUD */}
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
                    <span className="font-mono text-xl text-red-400">{opponentParticipant?.score || 0}</span>
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/[0.03] border border-white/10 p-6 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                {/* Feedback Overlay */}
                {isLocked && (
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
                        
                        let stateStyles = "bg-white/[0.03] border-white/10 text-stone-400 hover:bg-white/[0.08] hover:border-white/20";
                        
                        if (isLocked) {
                            if (isSelected) {
                                stateStyles = isCorrectOption 
                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" 
                                    : "bg-red-500/20 border-red-500/40 text-red-300";
                            } else if (isCorrectOption && (myParticipant?.hasAnswered || anyoneElseAnswered)) {
                                stateStyles = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/50";
                            } else {
                                stateStyles = "bg-white/[0.01] border-white/5 text-stone-600 opacity-50";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                disabled={isLocked}
                                onClick={() => handleOptionSelect(idx)}
                                className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group/btn ${stateStyles}`}
                            >
                                <span className="text-sm font-medium pr-4">{option}</span>
                                {isLocked && isSelected && isCorrectOption && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
                                {isLocked && isSelected && !isCorrectOption && <XCircle size={18} className="text-red-400 flex-shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                {isLocked && (
                    <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                        {myParticipant?.hasAnswered ? (
                            myParticipant.lastAnswerCorrect ? (
                                <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                            ) : (
                                <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                            )
                        ) : (
                            <Timer size={16} className="text-orange-400 mt-0.5 flex-shrink-0 animate-pulse" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-white/80 mb-1">
                                {myParticipant?.hasAnswered 
                                    ? (myParticipant.lastAnswerCorrect ? "You got it right!" : "Incorrect answer.") 
                                    : "Opponent answered first!"}
                            </p>
                            <p className="text-xs text-stone-500 leading-relaxed">{currentQuestion.explanation}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">Next question starting soon...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
