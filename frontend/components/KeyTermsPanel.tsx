"use client";

import React, { useState } from "react";
import { Search, Hash, Quote } from "lucide-react";

interface KeyTerm {
    term: string;
    definition: string;
}

interface KeyTermsPanelProps {
    keyTerms: KeyTerm[];
    isLoading: boolean;
}

export default function KeyTermsPanel({ keyTerms, isLoading }: KeyTermsPanelProps) {
    const [search, setSearch] = useState("");

    const filtered = keyTerms.filter(kt => 
        kt.term.toLowerCase().includes(search.toLowerCase()) || 
        kt.definition.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-2xl h-24" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-hover:text-indigo-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search terms or definitions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-6 rounded-2xl bg-neutral-900/50 border border-white/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-stone-600 text-[15px] leading-relaxed"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((kt, idx) => (
                    <div 
                        key={idx} 
                        className="p-6 rounded-2xl bg-neutral-900/40 border border-white/5 hover:border-indigo-500/20 hover:bg-neutral-900/60 transition-all duration-300 group"
                    >
                        <div className="flex gap-4">
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 h-fit transition-colors group-hover:bg-indigo-500/20">
                                <Hash size={16} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-playfair italic font-medium text-lg leading-snug text-white/90 translate-y-[-2px]">
                                    {kt.term}
                                </h4>
                                <p className="text-[13px] leading-relaxed text-stone-400 font-light group-hover:text-stone-300 transition-colors">
                                    {kt.definition}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="p-20 text-center space-y-4">
                    <Quote className="mx-auto text-stone-700" size={48} />
                    <p className="text-stone-500 font-light italic">No matching terms found. Try a broader search.</p>
                </div>
            )}
        </div>
    );
}
