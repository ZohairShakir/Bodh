"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Trash2, Bot, User, Loader2, Sparkles } from "lucide-react";
import { TUTOR_FALLBACKS } from "@/lib/tutorFallbacks";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: any;
  chatHistory: Message[];
  setChatHistory: (history: Message[]) => void;
  userName?: string;
}

export default function BodhTutorPanel({ 
  isOpen, 
  onClose, 
  context, 
  chatHistory, 
  setChatHistory,
  userName 
}: TutorPanelProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const studentMessage = input.trim();
    setInput("");
    const newHistory: Message[] = [...chatHistory, { role: "user", content: studentMessage }];
    setChatHistory(newHistory);
    setIsLoading(true);
    
    // Track if we've already added an assistant response for this request
    const responseHandled = { current: false };

    // 6-second demo fallback logic
    timeoutRef.current = setTimeout(() => {
      if (!responseHandled.current) {
        responseHandled.current = true;
        const type = context?.entry_context?.type || "open";
        const fallback = (TUTOR_FALLBACKS as any)[type] || TUTOR_FALLBACKS.open;
        setChatHistory(prev => [...prev, { role: "assistant", content: fallback }]);
        setIsLoading(false);
      }
    }, 8000); // Increased to 8s to allow for OpenAI -> Gemini fallback time

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;

      const res = await fetch(`${cleanUrl}/api/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          chat_history: chatHistory,
          student_message: studentMessage
        })
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (!res.ok) throw new Error("Tutor unavailable");
      const data = await res.json();
      
      if (!responseHandled.current) {
         responseHandled.current = true;
         setChatHistory(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      console.error("Tutor Error:", err);
      // Fallback already handled by timeout or if immediate error:
      if (!responseHandled.current) {
        responseHandled.current = true;
        const type = context?.entry_context?.type || "open";
        const fallback = (TUTOR_FALLBACKS as any)[type] || TUTOR_FALLBACKS.open;
        setChatHistory(prev => [...prev, { role: "assistant", content: fallback }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      {/* Main Panel */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0A0A0B] border-l border-white/10 z-[101] flex flex-col transition-transform duration-500 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Bot size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-white font-medium flex items-center gap-2">
                Bodhik
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-white/40 uppercase tracking-widest border border-white/5">AI Buddy</span>
              </h2>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={10} className="text-indigo-500/60" />
                Talk to Bodhik
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={clearChat}
              className="p-2.5 rounded-xl hover:bg-white/5 text-stone-600 hover:text-red-400 transition-all group"
              title="Clear conversation"
            >
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-white/5 text-stone-500 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 px-8">
              <Bot size={64} className="mb-6" />
              <p className="font-playfair italic text-xl text-white mb-2">Hey {userName || 'Scholar'}, I'm Bodhik!</p>
              <p className="text-xs uppercase tracking-widest font-bold">Ask me anything about your notes or quiz performance.</p>
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-white/5 border-white/10 text-stone-400' : 'bg-indigo-600/20 border-indigo-500/20 text-indigo-400'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'user' ? 'bg-white/5 text-white/90 border border-white/5 rounded-tr-none' : 'bg-white/[0.03] text-stone-300 border border-white/5 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="max-w-[85%] flex gap-3">
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-indigo-600/20 border border-indigo-500/20 text-indigo-400">
                  <Bot size={14} />
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] text-stone-500 border border-white/5 rounded-tl-none flex items-center gap-3">
                   <Loader2 size={14} className="animate-spin" />
                   <span className="text-[11px] font-bold uppercase tracking-widest opacity-60 italic">Bodh is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5">
          <form 
            onSubmit={handleSend}
            className="relative flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 focus-within:border-indigo-500/30 transition-all"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Bodhik anything..."
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-white/90 px-4 py-3 placeholder:text-stone-600"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-600"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-3 text-center px-4">
            <p className="text-[9px] text-stone-700 uppercase font-bold tracking-[0.2em]">Contextual Academic Assistant • Restricted to your specific session</p>
          </div>
        </div>
      </div>
    </>
  );
}
