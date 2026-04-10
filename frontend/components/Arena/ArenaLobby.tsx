"use client";

import React, { useState } from 'react';
import { Users, Copy, CheckCircle2, Play, UserPlus } from 'lucide-react';
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

export default function ArenaLobby({ code, participants, currentUser, onReady, onJoin, isLoading }: ArenaLobbyProps) {
    const [name, setName] = useState('');
    const [avatarId, setAvatarId] = useState('A1');
    const [copied, setCopied] = useState(false);

    const isJoined = participants && participants[currentUser];
    const myParticipant = participants ? participants[currentUser] : null;

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isJoined) {
        return (
            <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl">
                    <div className="flex justify-center mb-8">
                        <div className="p-4 rounded-3xl bg-violet-500/10 text-violet-400">
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
                            className="w-full btn-outline !py-4 !rounded-2xl flex items-center justify-center gap-2 group"
                        >
                            <span>Enter Lobby</span>
                            <Play size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const participantList = Object.values(participants || {});
    const allReady = participantList.length >= 2 && participantList.every(p => p.isReady);

    return (
        <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-500">
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl">
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
                                        className={`w-10 h-10 rounded-full border-2 border-[#0a0a0a] ${av.color} flex items-center justify-center text-white`}
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
                    {participantList.map((p) => {
                        const av = getAvatarById(p.avatar);
                        return (
                            <div 
                                key={p.user} 
                                className={`p-5 rounded-[24px] border flex items-center justify-between transition-all duration-500 ${
                                    p.isReady ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/5'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl ${av.color} flex items-center justify-center text-white shadow-lg`}>
                                        {React.cloneElement(av.icon as React.ReactElement, { size: 24 })}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white/90">{p.user} {p.user === currentUser && '(You)'}</h4>
                                        <span className={`text-[9px] uppercase tracking-widest font-bold ${p.isReady ? 'text-emerald-400' : 'text-stone-600'}`}>
                                            {p.isReady ? 'Ready to Clash' : 'Waiting...'}
                                        </span>
                                    </div>
                                </div>
                                {p.isReady && <CheckCircle2 size={20} className="text-emerald-500" />}
                            </div>
                        );
                    })}
                    {participantList.length < 2 && (
                        <div className="p-5 rounded-[24px] border border-dashed border-white/5 bg-white/[0.01] flex items-center justify-center text-stone-700 italic text-sm">
                            Waiting for opponents...
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button 
                        onClick={() => onReady(!myParticipant?.isReady)}
                        className={`w-full !py-5 !rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-all duration-500 ${
                            myParticipant?.isReady 
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'btn-outline border-violet-500/30 text-violet-300'
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
                        <div className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-[0.2em] animate-pulse">
                            Battle starting in 3s...
                        </div>
                    ) : (
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">All players must be ready to start</p>
                    )}
                </div>
            </div>
        </div>
    );
}
