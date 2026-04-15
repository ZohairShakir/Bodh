"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Copy, CheckCircle2, Play, UserPlus, Zap } from 'lucide-react';
import AvatarPicker, { getAvatarById } from './AvatarPicker';

interface ArenaParticipant {
    user: string;
    avatar: string;
    isReady: boolean;
    score: number;
}

interface ArenaLobbyProps {
    code: string;
    participants: Record<string, ArenaParticipant>;
    currentUser: string;
    onReady: (isReady: boolean) => void;
    onJoin: (name: string, avatar: string) => void;
    isLoading?: boolean;
}

function AnimatedParticipantCard({ participant, currentUser, index }: { participant: ArenaParticipant; currentUser: string; index: number }) {
    const av = getAvatarById(participant.avatar);
    const isMe = participant.user === currentUser;
    const [justJoined, setJustJoined] = useState(false);
    const [prevReady, setPrevReady] = useState(participant.isReady);
    
    useEffect(() => {
        if (!prevReady && participant.isReady) {
            const timer = setTimeout(() => setPrevReady(true), 300);
            return () => clearTimeout(timer);
        }
        setPrevReady(participant.isReady);
    }, [participant.isReady, prevReady]);

    return (
        <div 
            className={`p-5 rounded-[24px] border flex items-center justify-between transition-all duration-300 ${
                participant.isReady 
                ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                : 'bg-white/[0.02] border-white/5'
            } ${justJoined ? 'arena-player-join' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center gap-4">
                <div className={`relative w-12 h-12 rounded-2xl ${av.color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 ${participant.isReady ? 'scale-105' : ''}`}>
                    {React.cloneElement(av.icon as React.ReactElement, { size: 24 })}
                    {participant.isReady && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={10} className="text-black" />
                        </div>
                    )}
                </div>
                <div>
                    <h4 className="font-medium text-white/90">{participant.user} {isMe && '(You)'}</h4>
                    <span className={`text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 ${participant.isReady ? 'text-emerald-400' : 'text-stone-600 arena-pulse'}`}>
                        {participant.isReady ? (
                            <>
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                Ready to Clash
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 bg-stone-700 rounded-full" />
                                Waiting...
                            </>
                        )}
                    </span>
                </div>
            </div>
            {participant.isReady && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={14} />
                </div>
            )}
        </div>
    );
}

function WaitingIndicator() {
    return (
        <div className="p-5 rounded-[24px] border border-dashed border-white/5 bg-white/[0.01] flex items-center justify-center">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-stone-700 rounded-full arena-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-stone-700 rounded-full arena-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 bg-stone-700 rounded-full arena-pulse" style={{ animationDelay: '400ms' }} />
                <span className="text-stone-600 italic text-sm ml-2">Waiting for opponents...</span>
            </div>
        </div>
    );
}

export default function ArenaLobby({ code, participants, currentUser, onReady, onJoin, isLoading }: ArenaLobbyProps) {
    const [name, setName] = useState('');
    const [avatarId, setAvatarId] = useState('A1');
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [playerKeys, setPlayerKeys] = useState<string[]>([]);

    const participantList = Object.values(participants || {});
    const allReady = participantList.length >= 2 && participantList.every(p => p.isReady);

    useEffect(() => {
        if (participants) {
            const newKeys = Object.keys(participants);
            const joined = newKeys.filter(k => !playerKeys.includes(k));
            if (joined.length > 0) {
                setPlayerKeys(newKeys);
            }
        }
    }, [participants, playerKeys]);

    useEffect(() => {
        if (allReady && participantList.length >= 2) {
            setCountdown(3);
            const timer = setTimeout(() => setCountdown(2), 1000);
            setTimeout(() => setCountdown(1), 2000);
            setTimeout(() => setCountdown(0), 3000);
            return () => { clearTimeout(timer); };
        } else {
            setCountdown(null);
        }
    }, [allReady, participantList.length]);

    const isJoined = participants && participants[currentUser];
    const myParticipant = participants ? participants[currentUser] : null;

    const handleCopy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/dashboard?arena=${code}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isJoined) {
        return (
            <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl">
                    <div className="flex justify-center mb-8">
                        <div className="p-4 rounded-3xl bg-violet-500/10 text-violet-400 animate-float">
                            <UserPlus size={48} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-playfair italic text-white/90 text-center mb-2">Join the Arena</h2>
                    <p className="text-stone-500 text-center mb-8 text-sm">Enter your name and pick an avatar to enter Room #{code}.</p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">Your Battle Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Brainiac"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:border-violet-500/50 outline-none transition-all"
                                maxLength={12}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">Choose Your Avatar</label>
                            <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />
                        </div>

                        <button 
                            onClick={() => onJoin(name || "Player", avatarId)}
                            disabled={isLoading || !name.trim()}
                            className="w-full btn-outline !py-4 !rounded-2xl flex items-center justify-center gap-2 group active:scale-[0.98] transition-transform"
                        >
                            <span>Enter Lobby</span>
                            <Play size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-300">
            {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[32px]">
                    <div className="arena-countdown-pop text-8xl font-playfair italic text-yellow-400 font-bold">
                        {countdown}
                    </div>
                </div>
            )}
            {countdown === 0 && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-[32px]">
                    <div className="arena-countdown-pop text-6xl font-playfair italic text-emerald-400 font-bold flex items-center gap-3">
                        <Zap className="text-yellow-400" />
                        GO!
                    </div>
                </div>
            )}
            
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/[0.02]">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-[3000ms]" style={{ width: countdown !== null ? '100%' : '0%' }} />
                </div>
                
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-2xl font-playfair italic text-white/90">Lobby Room</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Code:</span>
                            <button 
                                onClick={handleCopy}
                                className="font-mono text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2"
                            >
                                {code}
                                {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {participantList.map((p, i) => {
                                const av = getAvatarById(p.avatar);
                                return (
                                    <div 
                                        key={p.user} 
                                        className={`w-10 h-10 rounded-full border-2 border-[#0a0a0a] ${av.color} flex items-center justify-center text-white ring-2 ring-black/20`}
                                        style={{ zIndex: 10 - i }}
                                        title={p.user}
                                    >
                                        {React.cloneElement(av.icon as React.ReactElement, { size: 16 })}
                                    </div>
                                );
                            })}
                        </div>
                        <span className="text-xs text-white/20 font-mono">{participantList.length} Players</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {participantList.map((p, i) => (
                        <AnimatedParticipantCard 
                            key={p.user} 
                            participant={p} 
                            currentUser={currentUser}
                            index={i}
                        />
                    ))}
                    {participantList.length < 2 && <WaitingIndicator />}
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button 
                        onClick={() => onReady(!myParticipant?.isReady)}
                        className={`w-full !py-5 !rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-all duration-300 ${
                            myParticipant?.isReady 
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98]' 
                            : 'btn-outline border-violet-500/30 text-violet-300 hover:bg-violet-500/10 active:scale-[0.98]'
                        }`}
                    >
                        {myParticipant?.isReady ? (
                            <>
                                <CheckCircle2 size={18} />
                                <span>I'm Ready!</span>
                            </>
                        ) : (
                            <>
                                <Users size={18} />
                                <span>Mark as Ready</span>
                            </>
                        )}
                    </button>
                    {allReady ? (
                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            Battle starting...
                        </div>
                    ) : (
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">All players must be ready to start</p>
                    )}
                </div>
            </div>
        </div>
    );
}
