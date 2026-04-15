"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { CheckCircle2, XCircle, Timer, Trophy, Users, Star, Award, Zap, ShieldAlert } from "lucide-react";
import { getAvatarById } from "./Arena/AvatarPicker";

interface ArenaParticipant {
    user: string;
    avatar: string;
    isReady: boolean;
    score: number;
    hp?: number;
    answerTime?: number;
    totalCorrect?: number;
    isWinner?: boolean;
    hasAnswered: boolean;
    lastAnswerCorrect: boolean | null;
}

interface ArenaState {
    code: string;
    participants: Record<string, ArenaParticipant>;
    status: 'lobby' | 'countdown' | 'prep' | 'playing' | 'reveal' | 'finished';
    mode: 'duel' | 'fourway';
    currentQuestionIndex: number;
    lastQuestionStartTime?: number;
    questions: any[];
}

interface ArenaQuizProps {
    arenaState: ArenaState;
    currentUser: string;
    onAnswer: (isCorrect: boolean) => void;
    onLeave: () => void;
}

function AnimatedHPBar({ value, max = 100, isMe = false, shake = false }: { value: number; max?: number; isMe?: boolean; shake?: boolean }) {
    const [animating, setAnimating] = useState(false);
    const [flashing, setFlashing] = useState(false);
    const prevValue = useRef(value);
    const percentage = Math.max(0, value);
    
    useEffect(() => {
        if (prevValue.current !== value) {
            setAnimating(true);
            setFlashing(true);
            prevValue.current = value;
            const timer = setTimeout(() => setAnimating(false), 400);
            const flashTimer = setTimeout(() => setFlashing(false), 300);
            return () => { clearTimeout(timer); clearTimeout(flashTimer); };
        }
    }, [value]);
    
    const isDamaged = value < max;
    
    return (
        <div className={`w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 ${shake ? 'hp-shake' : ''}`}>
            <div 
                className={`h-full transition-all duration-500 ease-out ${isMe ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-l from-red-400 to-red-600'} ${
                    flashing ? 'hp-bar-damage' : ''
                }`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}

function LeaderboardRow({ participant, currentUser, isReveal, index, prevIndex }: { participant: ArenaParticipant; currentUser: string; isReveal: boolean; index: number; prevIndex: number }) {
    const av = getAvatarById(participant.avatar);
    const isMe = participant.user === currentUser;
    const [justUpdated, setJustUpdated] = useState(false);
    const [showBadge, setShowBadge] = useState(false);
    
    useEffect(() => {
        if (prevIndex !== index && index < prevIndex) {
            setJustUpdated(true);
            setTimeout(() => setJustUpdated(false), 500);
        }
    }, [index, prevIndex]);

    return (
        <div 
            className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                isMe ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.02] border-white/5'
            } ${justUpdated ? 'leaderboard-shift' : ''}`}
        >
            <div className="flex items-center gap-3 w-full">
                <div className={`w-8 h-8 rounded-xl ${av.color} flex items-center justify-center text-white text-[10px] flex-shrink-0`}>
                    {React.cloneElement(av.icon as React.ReactElement, { size: 16 })}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/80 truncate block">{participant.user}</span>
                        {showBadge && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded badge-pop">Fastest</span>}
                    </div>
                    <span className="text-[10px] font-mono text-white/40">{participant.score} pts</span>
                </div>
                {participant.hasAnswered && !isReveal && (
                    <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse flex-shrink-0" />
                )}
                {isReveal && participant.hasAnswered && (
                    <div className="flex-shrink-0">
                        {participant.lastAnswerCorrect ? (
                            <div className="arena-correct-flash rounded-full p-1">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                            </div>
                        ) : (
                            <div className="arena-wrong-flash rounded-full p-1">
                                <XCircle size={14} className="text-red-500/50" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function OptionButton({ 
    option, 
    index, 
    isSelected, 
    isCorrect, 
    isDisabled, 
    isReveal, 
    onClick 
}: { 
    option: string; 
    index: number; 
    isSelected: boolean; 
    isCorrect: boolean; 
    isDisabled: boolean; 
    isReveal: boolean; 
    onClick: () => void; 
}) {
    const [isPressed, setIsPressed] = useState(false);
    
    const getOptionClass = () => {
        if (!isDisabled) {
            return "bg-white/[0.03] border-white/10 text-stone-300 arena-option-hover cursor-pointer";
        }
        
        if (isSelected) {
            if (isReveal) {
                return isCorrect
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)] arena-correct-flash"
                    : "bg-red-500/20 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.1)] arena-wrong-flash";
            }
            return "bg-white/10 border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]";
        }
        
        if (isCorrect && isReveal) {
            return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/60 ring-1 ring-emerald-500/10";
        }
        
        return "bg-white/[0.01] border-white/5 text-stone-600 opacity-40 grayscale";
    };
    
    return (
        <button
            disabled={isDisabled}
            onClick={() => { onClick(); setIsPressed(true); setTimeout(() => setIsPressed(false), 150); }}
            className={`text-left p-5 md:p-6 rounded-3xl border transition-all duration-300 flex items-center justify-between group ${
                isPressed ? 'arena-option-select' : ''
            } ${getOptionClass()}`}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="flex items-center gap-4 w-full">
                <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold font-mono group-hover:bg-white/10 transition-colors flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                </span>
                <span className="text-sm font-medium pr-4 break-words leading-relaxed">{option}</span>
            </div>
            {isReveal && isSelected && isCorrect && <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />}
            {isReveal && isSelected && !isCorrect && <XCircle size={24} className="text-red-400 flex-shrink-0" />}
            {isReveal && !isSelected && isCorrect && <CheckCircle2 size={24} className="text-emerald-400/50 flex-shrink-0" />}
        </button>
    );
}

export default function ArenaQuiz({ arenaState, currentUser, onAnswer, onLeave }: ArenaQuizProps) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(12);
    const [prevHp, setPrevHp] = useState<number>(100);
    const [oppPrevHp, setOppPrevHp] = useState<number>(100);
    const [shakeMe, setShakeMe] = useState(false);
    const [shakeOpp, setShakeOpp] = useState(false);
    const [scoreAnim, setScoreAnim] = useState(false);
    const [justAnswered, setJustAnswered] = useState(false);

    const participantList = Object.values(arenaState.participants || {});
    const sortedPlayers = useMemo(() => [...participantList].sort((a, b) => b.score - a.score), [participantList]);
    const isDuel = arenaState.mode === 'duel';

    const myParticipant = arenaState.participants[currentUser];
    const isReveal = arenaState.status === 'reveal';
    const isMyTurnLocked = myParticipant?.hasAnswered === true || isReveal;

    useEffect(() => {
        if (arenaState.status === 'playing' && arenaState.lastQuestionStartTime) {
            setSelectedOption(null);
            const interval = setInterval(() => {
                const elapsed = (Date.now() - (arenaState.lastQuestionStartTime || Date.now())) / 1000;
                const remain = Math.max(0, 12 - Math.floor(elapsed));
                setTimeLeft(remain);
            }, 100);
            return () => clearInterval(interval);
        } else if (arenaState.status === 'prep') {
            setTimeLeft(12);
            setJustAnswered(false);
        }
    }, [arenaState.status, arenaState.lastQuestionStartTime]);

    useEffect(() => {
        if (arenaState.status === 'prep') {
            setSelectedOption(null);
        }
    }, [arenaState.status]);

    useEffect(() => {
        if (myParticipant?.hp !== undefined && prevHp > myParticipant.hp) {
            setShakeMe(true);
            setTimeout(() => setShakeMe(false), 400);
        }
        setPrevHp(myParticipant?.hp ?? 100);
    }, [myParticipant?.hp]);

    useEffect(() => {
        const opp = participantList.find(p => p.user !== currentUser);
        if (opp && opp.hp !== undefined && oppPrevHp > opp.hp) {
            setShakeOpp(true);
            setTimeout(() => setShakeOpp(false), 400);
        }
        setOppPrevHp(opp?.hp ?? 100);
    }, [participantList, currentUser]);

    if (arenaState.status === 'lobby' || arenaState.status === 'countdown') return null;

    const quiz = arenaState.questions || [];
    const currentQuestion = quiz[arenaState.currentQuestionIndex];
    if (!currentQuestion) return (
        <div className="flex items-center justify-center py-20 text-stone-700 uppercase tracking-widest text-sm arena-pulse">
            Fetching Next Challenge...
        </div>
    );

    const handleOptionSelect = (index: number) => {
        if (isMyTurnLocked || selectedOption !== null) return;
        setSelectedOption(index);
        setJustAnswered(true);
        setTimeout(() => setJustAnswered(false), 300);
        const isCorrect = index === currentQuestion.correct_index;
        onAnswer(isCorrect);
    };

    if (arenaState.status === 'finished') {
        const winner = sortedPlayers[0];
        const isWinner = winner?.user === currentUser;
        const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;
        let knockout = false;
        if (isDuel) {
            const anyDead = sortedPlayers.some(p => (p.hp || 0) <= 0);
            if (anyDead && !isTie) knockout = true;
        }

        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 winner-reveal">
                <div className="relative mb-10">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center text-violet-400 ${
                        isWinner ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-violet-500/10 border border-violet-500/20'
                    }`}>
                        <Trophy size={64} />
                    </div>
                    {!isTie && (
                        <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-black border-4 border-[#0a0a0a] badge-pop">
                            <Award size={24} />
                        </div>
                    )}
                </div>
                
                <h2 className="text-4xl font-playfair italic text-white/90 mb-2">
                    {knockout ? (isWinner ? "K.O. Victory!" : "Knocked Out!") : (isTie ? "It's a Tie!" : (isWinner ? "Champion!" : "Arena Result"))}
                </h2>
                <p className="text-stone-500 mb-10 max-w-sm text-center italic">
                    {isTie ? "Incredible match! Absolute deadlock." : (isWinner ? "You dominated the arena. Well played!" : "Good effort! Keep clashing to reach the top.")}
                </p>

                <div className="w-full max-w-lg space-y-3 mb-10">
                    {sortedPlayers.map((p, idx) => {
                        if (!p) return null;
                        const av = getAvatarById(p.avatar);
                        return (
                            <div 
                                key={p.user} 
                                className={`flex items-center justify-between p-5 rounded-[24px] border transition-all duration-500 ${
                                    p.user === currentUser ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20 winner-reveal' : 'bg-white/[0.03] border-white/10'
                                }`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center w-8">
                                        <span className={`text-xl font-bold font-mono ${idx === 0 ? 'text-yellow-400' : 'text-white/20'}`}>#{idx + 1}</span>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl ${av.color} flex items-center justify-center text-white shadow-lg relative`}>
                                        {React.cloneElement(av.icon as React.ReactElement, { size: 24 })}
                                        {isDuel && (p.hp || 0) <= 0 && (
                                            <div className="absolute inset-0 bg-red-500/80 rounded-2xl flex items-center justify-center">
                                                <XCircle size={20} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white/90">{p.user} {p.user === currentUser && '(You)'}</h4>
                                        <div className="flex items-center gap-1 opacity-40">
                                            <Star size={10} className="text-yellow-500" />
                                            <span className="text-[9px] uppercase tracking-widest font-bold">{p.totalCorrect || 0} Correct</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`font-mono text-2xl ${scoreAnim ? 'score-pop' : 'text-violet-400'}`}>{p.score}</span>
                                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Points Earned</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4">
                    <button onClick={onLeave} className="btn-outline !px-10 active:scale-[0.98] transition-transform">Return to HQ</button>
                    <button onClick={() => window.location.reload()} className="btn-play-clean bg-violet-600 hover:bg-violet-700 !text-white !px-10 active:scale-[0.98] transition-transform">Play Again</button>
                </div>
            </div>
        );
    }

    if (arenaState.status === 'prep') {
        const roundNum = arenaState.currentQuestionIndex + 1;
        return (
            <div className="flex flex-col items-center justify-center py-32 prep-zoom">
                <Zap size={48} className="text-yellow-500 mb-6" />
                <h3 className="text-sm font-bold tracking-[0.5em] text-yellow-500/80 mb-2 uppercase">Round {roundNum}</h3>
                <h2 className="text-5xl font-playfair italic text-white/90">Get Ready...</h2>
            </div>
        );
    }

    const timerPercentage = (timeLeft / 12) * 100;
    const opp = participantList.find(p => p.user !== currentUser);

    return (
        <div className="max-w-4xl mx-auto w-full pb-12 arena-question-enter">
            
            {isDuel && (
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-3xl mb-8 relative overflow-hidden backdrop-blur-md screen-shake-trigger">
                    <div className="flex items-center gap-4 w-2/5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${getAvatarById(myParticipant?.avatar).color}`}>
                            {React.cloneElement(getAvatarById(myParticipant?.avatar).icon as React.ReactElement, { size: 24 })}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-white/90">You</span>
                                <span className="text-[10px] font-mono font-bold text-red-400">{myParticipant?.hp ?? 100} HP</span>
                            </div>
                            <AnimatedHPBar value={myParticipant?.hp ?? 100} isMe={true} shake={shakeMe} />
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">RND {arenaState.currentQuestionIndex + 1}</span>
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 mt-1">
                            <ShieldAlert size={14} className="text-white/40" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-2/5 flex-row-reverse text-right">
                        {opp ? (
                            <>
                                <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${getAvatarById(opp.avatar).color}`}>
                                    {React.cloneElement(getAvatarById(opp.avatar).icon as React.ReactElement, { size: 24 })}
                                    {opp.hasAnswered && !isReveal && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full arena-opp-answered" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1 flex-row-reverse">
                                        <span className="text-xs font-bold text-white/90 truncate pl-2">{opp.user}</span>
                                        <span className="text-[10px] font-mono font-bold text-red-400">{opp.hp ?? 100} HP</span>
                                    </div>
                                    <div className="transform scale-x-[-1]">
                                        <AnimatedHPBar value={opp.hp ?? 100} shake={shakeOpp} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 opacity-20">Waiting...</div>
                        )}
                    </div>
                </div>
            )}

            <div className={`grid grid-cols-1 ${!isDuel ? 'md:grid-cols-4' : 'md:grid-cols-1'} gap-6`}>
                
                {!isDuel && (
                    <div className="order-2 md:order-1 md:col-span-1 space-y-3">
                        <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-4 flex items-center gap-2">
                            <Users size={12} /> Live Standing
                        </div>
                        {sortedPlayers.map((p, idx) => (
                            <LeaderboardRow 
                                key={p.user} 
                                participant={p} 
                                currentUser={currentUser} 
                                isReveal={isReveal}
                                index={idx}
                                prevIndex={idx}
                            />
                        ))}
                    </div>
                )}

                <div className={`order-1 md:order-2 ${!isDuel ? 'md:col-span-3' : 'col-span-1'} space-y-6`}>
                    
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-5 md:p-6 rounded-[24px] relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-100 linear"
                                style={{ width: `${timerPercentage}%` }}
                            />
                        </div>
                        <div className="flex flex-col z-10">
                            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">STAGE</span>
                            <span className="font-mono text-xl md:text-2xl text-white/90">
                                {arenaState.currentQuestionIndex + 1} <span className="text-white/20 text-lg">/{quiz.length}</span>
                            </span>
                        </div>
                        <div className="flex flex-col items-end z-10">
                            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">TIME</span>
                            <div className="flex items-center gap-2">
                                <Timer size={18} className={(timeLeft <= 3 && !isReveal) ? "text-red-500" : "text-yellow-500"} />
                                <span className={`font-mono text-2xl ${(timeLeft <= 3 && !isReveal) ? "text-red-500 font-bold arena-pulse" : "text-yellow-500"}`}>
                                    {isReveal ? "0" : timeLeft}s
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 p-8 sm:p-12 rounded-[40px] shadow-2xl relative overflow-hidden backdrop-blur-xl">
                        {isReveal && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 w-full" style={{ animation: 'timer-shrink 0.5s ease-out forwards' }} />
                            </div>
                        )}

                        <h3 className="text-xl sm:text-2xl font-medium text-white/90 leading-relaxed mb-8">
                            {currentQuestion.question}
                        </h3>

                        <div className="grid grid-cols-1 gap-3">
                            {(currentQuestion?.options || []).map((option: string, idx: number) => (
                                <OptionButton
                                    key={idx}
                                    option={option}
                                    index={idx}
                                    isSelected={selectedOption === idx}
                                    isCorrect={idx === currentQuestion.correct_index}
                                    isDisabled={isMyTurnLocked}
                                    isReveal={isReveal}
                                    onClick={() => handleOptionSelect(idx)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-20 flex items-center justify-center">
                        {justAnswered && !isReveal && (
                            <span className="uppercase text-xs tracking-[0.2em] font-bold text-yellow-400 arena-pulse">Answer locked!</span>
                        )}
                        {myParticipant?.hasAnswered && !isReveal && !justAnswered && (
                            <span className="uppercase text-xs tracking-[0.2em] font-bold text-stone-500 arena-pulse">Wait for opponent...</span>
                        )}
                        {isReveal && myParticipant?.hasAnswered && (
                            <div className="flex items-center gap-4 arena-option-reveal">
                                {myParticipant.lastAnswerCorrect ? (
                                    <div className="text-emerald-400 text-sm font-bold flex items-center gap-2 arena-correct-flash rounded-lg px-4 py-2">
                                        <CheckCircle2 size={18} /> CORRECT!
                                    </div>
                                ) : (
                                    <div className="text-red-400 text-sm font-bold flex items-center gap-2 arena-wrong-flash rounded-lg px-4 py-2">
                                        <XCircle size={18} /> INCORRECT!
                                    </div>
                                )}
                            </div>
                        )}
                        {myParticipant?.lastAnswerCorrect && opp && !opp.hasAnswered && (
                            <div className="text-yellow-400 text-sm font-bold flex items-center gap-2 badge-pop ml-4">
                                <Zap size={16} /> You were faster!
                            </div>
                        )}
                        {isReveal && myParticipant?.hasAnswered === false && (
                            <div className="text-red-400 text-sm font-bold flex items-center gap-2 arena-wrong-flash">
                                <XCircle size={18} /> Time's up!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

