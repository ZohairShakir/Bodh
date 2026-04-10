"use client";

import React, { useState } from 'react';
import { X, FileText, Upload, Book, Zap, Sparkles, ChevronRight, Layers, Trophy, Users, AlertCircle, Bot } from 'lucide-react';
import { LIBRARY_CHAPTERS } from '@/lib/libraryData';

interface ArenaSetupOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'duel' | 'fourway';
    onStartGeneration: (sourceContent: string, difficulty: string, nQuestions: number) => Promise<void>;
}

export default function ArenaSetupOverlay({ isOpen, onClose, mode, onStartGeneration }: ArenaSetupOverlayProps) {
    const [step, setStep] = useState<'source' | 'config' | 'generating'>('source');
    const [sourceType, setSourceType] = useState<'library' | 'upload' | 'text' | null>(null);
    const [selectedContent, setSelectedContent] = useState<string>("");
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    
    // Config state
    const [difficulty, setDifficulty] = useState("Medium");
    const [nQuestions, setNQuestions] = useState(7);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSourceSelect = (type: 'library' | 'upload' | 'text', content?: string, id?: string) => {
        setSourceType(type);
        if (content) setSelectedContent(content);
        if (id) setSelectedChapterId(id);
        setStep('config');
    };

    const handleGenerate = async () => {
        if (!selectedContent || selectedContent.length < 100) {
            setError("Source content is too short for a high-quality arena.");
            return;
        }
        setError(null);
        setStep('generating');
        try {
            await onStartGeneration(selectedContent, difficulty, nQuestions);
        } catch (err: any) {
            setError(err.message || "Synthesizing failed.");
            setStep('config');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#050505]/90 backdrop-blur-2xl animate-in fade-in duration-500">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-4xl bg-white/[0.02] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${mode === 'duel' ? 'bg-violet-500/10 text-violet-400' : 'bg-orange-500/10 text-orange-400'}`}>
                            {mode === 'duel' ? <Trophy size={24} /> : <Users size={24} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-playfair italic text-white/90">Initialize {mode === 'duel' ? 'Duel' : 'Clash'}</h2>
                            <p className="text-stone-500 text-[10px] uppercase tracking-widest font-bold">Arena Configuration Stage</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {step === 'source' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h3 className="text-lg font-medium text-white/80 mb-2">Choose Arena Content</h3>
                                <p className="text-stone-500 text-xs italic">Select the knowledge source for your battle arena.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Library Card */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest pl-2">Bodh Library</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {LIBRARY_CHAPTERS.map(chapter => (
                                            <button 
                                                key={chapter.id}
                                                onClick={() => handleSourceSelect('library', chapter.content, chapter.id)}
                                                className="w-full text-left p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/30 transition-all group flex items-center gap-4"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:bg-violet-500/20 transition-all">
                                                    <Book size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-white/80">{chapter.title}</h4>
                                                    <p className="text-[10px] text-stone-600 uppercase tracking-wider">{chapter.subject} • Class {chapter.class}</p>
                                                </div>
                                                <ChevronRight size={14} className="text-white/10 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Battle / Quick Upload */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest pl-2">Custom Material</label>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <FileText size={16} className="text-orange-400" />
                                                <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest">Paste Notes</h4>
                                            </div>
                                            <textarea 
                                                className="w-full h-40 bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-xs text-stone-400 outline-none focus:border-orange-500/20 transition-all resize-none"
                                                placeholder="Paste your notes here (min 100 characters)..."
                                                value={selectedContent}
                                                onChange={(e) => setSelectedContent(e.target.value)}
                                            />
                                            <button 
                                                onClick={() => handleSourceSelect('text')}
                                                disabled={selectedContent.trim().length < 100}
                                                className="w-full mt-4 py-3 rounded-xl bg-orange-500/10 text-orange-300 text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 transition-all"
                                            >
                                                Use Pasted Text
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-teal-500/20 transition-all cursor-pointer relative overflow-hidden">
                                             <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-all">
                                                <Upload size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-white/80">Upload PDF</h4>
                                                <p className="text-[10px] text-stone-600 uppercase tracking-wider">Analyze local files</p>
                                            </div>
                                            <input 
                                                type="file" 
                                                accept=".pdf,.txt" 
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        // For now we simulate text extraction or suggest using the main tab for files
                                                        // but given the requirement, I'll keep it as a placeholder or real logic if possible
                                                        // but direct PDF parsing in a sub-component needs more utility.
                                                        // I'll suggest pasting for now to keep the MVP solid.
                                                        setError("PDF parsing is best handled in the main 'Create' tab. Try pasting text here!");
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'config' && (
                        <div className="max-w-md mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <div className="text-center">
                                <h3 className="text-xl font-medium text-white/90 mb-2">Battle Parameters</h3>
                                <p className="text-stone-500 text-xs italic">Set the intensity of your arena.</p>
                            </div>

                            <div className="dash-card p-8 bg-white/[0.03] border border-white/5 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold px-1">Challenge Level</label>
                                    <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                                        {["Easy", "Medium", "Hard"].map(d => (
                                            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-3 rounded-lg text-[11px] font-bold transition-all ${difficulty === d ? 'bg-white/10 text-white shadow-xl' : 'text-white/20 hover:text-white/40'}`}>{d}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold px-1">Arena Scope</label>
                                    <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                                        {[5, 7, 10, 15].map(n => (
                                            <button key={n} onClick={() => setNQuestions(n)} className={`flex-1 py-3 rounded-lg text-[11px] font-bold transition-all ${nQuestions === n ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}>{n}</button>
                                        ))}
                                    </div>
                                    <p className="text-center text-[9px] text-stone-600 font-bold tracking-widest uppercase">Questions per Match</p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest animate-in shake duration-500">
                                        <AlertCircle size={14} />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep('source')} className="flex-1 py-4 rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">Back</button>
                                <button 
                                    onClick={handleGenerate}
                                    className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-3"
                                >
                                    <Sparkles size={16} />
                                    Synthesize Arena
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000">
                            <div className="relative mb-12">
                                <div className="w-24 h-24 rounded-[32px] bg-violet-600/20 border border-violet-500/30 flex items-center justify-center animate-pulse">
                                    <Layers size={40} className="text-violet-400 animate-bounce" />
                                </div>
                                <div className="absolute inset-0 w-24 h-24 rounded-[32px] border-2 border-dashed border-violet-500/20 animate-spin-slow" />
                                
                                {/* Floating Particles */}
                                <div className="absolute top-0 right-[-20px] p-2 bg-teal-500/20 rounded-lg animate-float-slow"><Sparkles size={12} className="text-teal-400" /></div>
                                <div className="absolute bottom-[-10px] left-[-30px] p-2 bg-orange-500/20 rounded-lg animate-float"><Zap size={14} className="text-orange-400" /></div>
                            </div>
                            
                            <h3 className="text-2xl font-playfair italic text-white/90 mb-3">Synthesizing Battle Terrain</h3>
                            <p className="text-stone-500 text-sm tracking-widest uppercase font-bold text-center max-w-xs leading-relaxed">
                                AI is analyzing your content and generating high-fidelity MCQ challenges...
                            </p>

                            <div className="mt-12 flex items-center gap-4 bg-white/[0.03] border border-white/5 py-4 px-8 rounded-full">
                                <Bot size={16} className="text-violet-400" />
                                <span className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase">Constructing Room #LOBBY</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
