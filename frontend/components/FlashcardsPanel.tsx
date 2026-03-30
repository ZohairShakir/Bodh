"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Layers, RefreshCcw } from "lucide-react";

interface KeyTerm {
    term: string;
    definition: string;
}

interface FlashcardsPanelProps {
    keyTerms: KeyTerm[];
    isLoading: boolean;
}

export default function FlashcardsPanel({ keyTerms, isLoading }: FlashcardsPanelProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[300px]">
                 <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!keyTerms || keyTerms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Layers size={48} className="mb-4 text-violet-400" />
                <p>No flashcards available.</p>
            </div>
        );
    }

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % keyTerms.length);
        }, 150);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + keyTerms.length) % keyTerms.length);
        }, 150);
    };

    const currentCard = keyTerms[currentIndex];

    return (
        <div className="flex flex-col items-center justify-center max-w-3xl mx-auto w-full group perspective-1000">
            {/* Header / Progress */}
            <div className="flex items-center justify-between w-full px-4 mb-6 text-stone-400 text-sm font-medium tracking-widest uppercase">
                <span>Flashcards</span>
                <span className="text-violet-400">{currentIndex + 1} / {keyTerms.length}</span>
            </div>

            {/* Flashcard */}
            <div 
                className="relative w-full aspect-[3/2] max-h-[400px] cursor-pointer transform-style-3d transition-transform duration-700 ease-spring"
                style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front (Term) */}
                <div 
                    className="absolute inset-0 flex flex-col items-center justify-center p-10 backface-hidden rounded-[32px] bg-neutral-900 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-colors hover:border-violet-500/30"
                >
                    <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-100 transition-opacity">
                        <RefreshCcw size={16} className="text-white animate-spin-slow" style={{ animationDuration: '4s' }} />
                    </div>
                    <span className="text-xs text-violet-400/60 uppercase tracking-[0.2em] mb-4 font-bold">Term</span>
                    <h3 className="text-3xl sm:text-4xl text-center font-playfair italic font-medium text-white/95 leading-tight">
                        {currentCard.term}
                    </h3>
                </div>

                {/* Back (Definition) */}
                <div 
                    className="absolute inset-0 flex flex-col items-center justify-center p-10 backface-hidden rounded-[32px] bg-violet-900/10 border border-violet-500/30 shadow-[0_20px_60px_rgba(139,92,246,0.1)] overflow-y-auto"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <span className="text-xs text-violet-400/60 uppercase tracking-[0.2em] mb-4 font-bold">Definition</span>
                    <p className="text-lg sm:text-xl text-center text-stone-300 leading-relaxed font-light">
                        {currentCard.definition}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mt-10">
                <button 
                    onClick={(e) => { e.stopPropagation(); prevCard(); }}
                    className="p-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                    className="px-8 py-4 rounded-2xl bg-violet-600/20 border border-violet-500/40 text-violet-200 font-bold uppercase tracking-widest text-xs hover:bg-violet-600/30 transition-all"
                >
                    {isFlipped ? "Show Term" : "Reveal Answer"}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); nextCard(); }}
                    className="p-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 active:scale-95"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
            <style jsx>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .transform-style-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                .ease-spring {
                    transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            `}</style>
        </div>
    );
}
