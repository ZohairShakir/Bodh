"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, MessageSquare, Paperclip, BookOpen, Hash, X, ChevronDown } from "lucide-react";

interface Message {
    user: string;
    message: string;
    timestamp: string;
}

interface Topic {
    topic: string;
    bullets: string[];
}

interface KeyTerm {
    term: string;
    definition: string;
}

interface ChatPanelProps {
    packId: string;
    currentUser: string;
    summary?: Topic[];
    keyTerms?: KeyTerm[];
}

// Prefix used to identify shared-card messages
const CARD_PREFIX = "BODH_CARD:";

function parseCard(message: string): { type: "summary" | "term"; data: any } | null {
    if (!message.startsWith(CARD_PREFIX)) return null;
    try {
        return JSON.parse(message.slice(CARD_PREFIX.length));
    } catch {
        return null;
    }
}

function SharedCard({ card }: { card: { type: "summary" | "term"; data: any } }) {
    if (card.type === "summary") {
        return (
            <div className="mt-1 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 p-4 max-w-[340px]">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400"><BookOpen size={12} /></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400/70">Summary Card</span>
                </div>
                <h4 className="text-white/90 font-semibold text-sm mb-2 font-playfair italic">{card.data.topic}</h4>
                <ul className="space-y-1.5">
                    {card.data.bullets?.slice(0, 3).map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-stone-400 leading-snug">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400/40 flex-shrink-0" />
                            {b}
                        </li>
                    ))}
                    {card.data.bullets?.length > 3 && (
                        <li className="text-[10px] text-indigo-400/50 pl-3">+{card.data.bullets.length - 3} more points</li>
                    )}
                </ul>
            </div>
        );
    }
    // Key term card
    return (
        <div className="mt-1 rounded-2xl bg-teal-500/5 border border-teal-500/20 p-4 max-w-[340px]">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400"><Hash size={12} /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-teal-400/70">Flashcard</span>
            </div>
            <h4 className="text-white/90 font-semibold text-sm mb-1.5 font-playfair italic">{card.data.term}</h4>
            <p className="text-[12px] text-stone-400 leading-snug">{card.data.definition}</p>
        </div>
    );
}

export default function ChatPanel({ packId, currentUser, summary = [], keyTerms = [] }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showCardPicker, setShowCardPicker] = useState(false);
    const [cardTab, setCardTab] = useState<"summary" | "terms">("summary");
    const scrollRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat/${packId}`);
                const data = await res.json();
                if (Array.isArray(data)) setMessages(data);
            } catch (err) {
                console.error("Chat fetch failed:", err);
            }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [packId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowCardPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const postMessage = async (text: string) => {
        if (!text.trim()) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packId, user: currentUser, message: text })
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
            }
        } catch (err) {
            console.error("Chat send failed:", err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const msg = newMessage;
        setNewMessage("");
        await postMessage(msg);
    };

    const handleShareCard = async (type: "summary" | "term", data: any) => {
        setShowCardPicker(false);
        const cardMessage = CARD_PREFIX + JSON.stringify({ type, data });
        await postMessage(cardMessage);
    };

    return (
        <div className="flex flex-col h-[600px] bg-white/[0.02] rounded-[32px] border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                        <MessageSquare size={18} />
                    </div>
                    <div>
                        <h3 className="font-playfair italic text-lg text-white/90">Team Discussion</h3>
                        <p className="text-[10px] uppercase tracking-widest text-white/20">Active Study Pack: #{packId}</p>
                    </div>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                        <MessageSquare size={48} className="mb-4" />
                        <p className="text-sm italic">No messages yet. Be the first to start the discussion!</p>
                    </div>
                ) : (
                    messages
                        .filter(msg => !msg.message?.startsWith('SYSTEM_DUEL:'))
                        .map((msg, idx) => {
                            const isMe = msg.user === currentUser;
                            const card = parseCard(msg.message);
                            return (
                                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className="flex items-center gap-2 mb-1.5 px-2">
                                        <span className={`text-[10px] font-bold tracking-widest uppercase ${isMe ? 'text-violet-400' : 'text-stone-500'}`}>
                                            {msg.user}
                                        </span>
                                    </div>
                                    {card ? (
                                        <SharedCard card={card} />
                                    ) : (
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed
                                            ${isMe 
                                                ? 'bg-violet-600/10 border border-violet-500/20 text-white/90 rounded-tr-none' 
                                                : 'bg-white/[0.03] border border-white/5 text-stone-300 rounded-tl-none'}`}
                                        >
                                            {msg.message}
                                        </div>
                                    )}
                                    <span className="text-[9px] text-white/10 mt-1 px-2">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 sm:p-6 bg-white/[0.01] border-t border-white/5">
                {/* Card picker popup */}
                {showCardPicker && (
                    <div ref={pickerRef} className="mb-3 rounded-2xl border border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Share a Card</span>
                            <button type="button" onClick={() => setShowCardPicker(false)} className="text-white/30 hover:text-white/60 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                        {/* Tabs */}
                        <div className="flex p-2 gap-1">
                            <button type="button" onClick={() => setCardTab("summary")} className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${cardTab === "summary" ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-white/30 hover:text-white/60"}`}>
                                Summary Topics
                            </button>
                            <button type="button" onClick={() => setCardTab("terms")} className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${cardTab === "terms" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "text-white/30 hover:text-white/60"}`}>
                                Flashcards
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {cardTab === "summary" && (
                                summary.length === 0 ? (
                                    <p className="text-center text-white/20 text-[11px] py-4">No summary topics available</p>
                                ) : summary.map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleShareCard("summary", { topic: s.topic, bullets: s.bullets })}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={11} className="text-indigo-400 flex-shrink-0" />
                                            <span className="text-[12px] text-white/80 font-medium truncate">{s.topic}</span>
                                        </div>
                                        <p className="text-[10px] text-stone-500 mt-0.5 ml-5 truncate">{s.bullets?.[0]}</p>
                                    </button>
                                ))
                            )}
                            {cardTab === "terms" && (
                                keyTerms.length === 0 ? (
                                    <p className="text-center text-white/20 text-[11px] py-4">No flashcards available</p>
                                ) : keyTerms.map((k: any, i: number) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleShareCard("term", { term: k.term, definition: k.definition })}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Hash size={11} className="text-teal-400 flex-shrink-0" />
                                            <span className="text-[12px] text-white/80 font-medium truncate">{k.term}</span>
                                        </div>
                                        <p className="text-[10px] text-stone-500 mt-0.5 ml-5 truncate">{k.definition}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className="relative flex items-center gap-2">
                    {/* Share card button */}
                    <button
                        type="button"
                        onClick={() => setShowCardPicker(p => !p)}
                        disabled={summary.length === 0 && keyTerms.length === 0}
                        title="Share a summary card or flashcard"
                        className={`p-3 rounded-xl border transition-all flex-shrink-0 ${showCardPicker ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/5 text-stone-500 hover:text-white/60 hover:bg-white/[0.06]'} disabled:opacity-20 disabled:cursor-not-allowed`}
                    >
                        <Paperclip size={16} />
                    </button>
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Share an insight or ask a question..."
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-6 pr-14 text-sm outline-none focus:border-violet-500/30 transition-all placeholder:text-white/10"
                    />
                    <button 
                        type="submit"
                        className="absolute right-2 p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-600/20 active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}
