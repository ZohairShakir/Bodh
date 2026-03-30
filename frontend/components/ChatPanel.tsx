"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, MessageSquare } from "lucide-react";

interface Message {
    user: string;
    message: string;
    timestamp: string;
}

interface ChatPanelProps {
    packId: string;
    currentUser: string;
}

export default function ChatPanel({ packId, currentUser }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat/${packId}`);
                const data = await res.json();
                setMessages(data);
            } catch (err) {
                console.error("Chat fetch failed:", err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [packId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packId, user: currentUser, message: newMessage })
            });
            if (res.ok) {
                setNewMessage("");
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
            }
        } catch (err) {
            console.error("Chat send failed:", err);
        }
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
                    messages.map((msg, idx) => {
                        const isMe = msg.user === currentUser;
                        return (
                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className="flex items-center gap-2 mb-1.5 px-2">
                                    <span className={`text-[10px] font-bold tracking-widest uppercase ${isMe ? 'text-violet-400' : 'text-stone-500'}`}>
                                        {msg.user}
                                    </span>
                                </div>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed
                                    ${isMe 
                                        ? 'bg-violet-600/10 border border-violet-500/20 text-white/90 rounded-tr-none' 
                                        : 'bg-white/[0.03] border border-white/5 text-stone-300 rounded-tl-none'}`}
                                >
                                    {msg.message}
                                </div>
                                <span className="text-[9px] text-white/10 mt-1 px-2">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white/[0.01] border-t border-white/5">
                <div className="relative flex items-center">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Share an insight or ask a question..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-6 pr-14 text-sm outline-none focus:border-violet-500/30 transition-all placeholder:text-white/10"
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
