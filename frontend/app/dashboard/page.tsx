"use client";

import React, { useState, useEffect, useRef } from "react";

import { Sparkles, AlertCircle, FileText, ListChecks, Home, Search, Settings, History, Layers, MessageSquare, LogOut, ShieldCheck, BookOpen, Users, Plus, X, ChevronRight, Bot, Trophy, Trash2 } from "lucide-react";
import InputPanel from "@/components/InputPanel";
import GenerateButton from "@/components/GenerateButton";
import SummaryPanel from "@/components/SummaryPanel";
import QuizPanel from "@/components/QuizPanel";
import FlashcardsPanel from "@/components/FlashcardsPanel";
import ExportBar from "@/components/ExportBar";
import { generateStudyPackPDF } from "@/lib/pdfGenerator";
import { encodeStudyPack, decodeStudyPack, QuizItem } from "@/lib/shareLink";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import ProductTour from "@/components/ProductTour";
import BodhTutorPanel from "@/components/BodhTutorPanel";
import ArenaQuiz from "@/components/ArenaQuiz";

type Mode = "summary" | "quiz" | "terms";

export default function DashboardPage() {
    const { isLoggedIn, logout, userName } = useAuth();
    const router = useRouter();

    const [text, setText] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [nQuestions, setNQuestions] = useState(7);
    const [language, setLanguage] = useState("English");
    const [view, setView] = useState<"engine" | "history" | "settings" | "chat" | "duel">("engine");

    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Mode>("summary");
    
    const [summary, setSummary] = useState<any[]>([]);
    const [quiz, setQuiz] = useState<QuizItem[]>([]);
    const [keyTerms, setKeyTerms] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isSharedView, setIsSharedView] = useState(false);
    const [shareCode, setShareCode] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [duelResults, setDuelResults] = useState<{user: string, score: number, total: number}[]>([]);
    const [isTutorOpen, setIsTutorOpen] = useState(false);
    const [tutorEntryContext, setTutorEntryContext] = useState<any>(null);
    const [tutorChatHistory, setTutorChatHistory] = useState<any[]>([]);
    const [weakTopics, setWeakTopics] = useState<string[]>([]);

    const handleAskTutor = (ctx: any) => {
        setTutorEntryContext(ctx);
        setIsTutorOpen(true);
    };

    const handleAskTutorTopic = (topic: string, bullets: string[]) => {
        setTutorEntryContext({ type: 'topic_question', topic, bullets });
        setIsTutorOpen(true);
    };

    // Onboarding guide
    const [showGuide, setShowGuide] = useState(false);
    const [guideStep, setGuideStep] = useState(0);

    // Settings state — real values
    const [displayName, setDisplayName] = useState("");
    const [prefLanguage, setPrefLanguage] = useState("English");
    const [settingsSaved, setSettingsSaved] = useState(false);

    // Chat lobby state
    const [chatMode, setChatMode] = useState<"lobby" | "join" | "create" | "active">("lobby");
    const [chatJoinInput, setChatJoinInput] = useState("");
    const [chatError, setChatError] = useState<string | null>(null);
    const [chatToast, setChatToast] = useState<{user: string, preview: string} | null>(null);
    const lastMsgCountRef = useRef(0);

    // Arena state
    const [arenaState, setArenaState] = useState<any>(null);

    // Global Chat Notification Polling & Duel Syncing
    useEffect(() => {
        if (!shareCode || view === 'chat') return;
        
        const pollChat = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat/${shareCode}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!Array.isArray(data)) return; // Safety check
                
                // Parse Duel Results
                const duels = data
                    .filter((m: any) => m.message && m.message.startsWith('SYSTEM_DUEL:'))
                    .map((m: any) => {
                        const [s, t] = m.message.replace('SYSTEM_DUEL:', '').split('/');
                        return { user: m.user, score: parseInt(s), total: parseInt(t) };
                    });
                setDuelResults(duels || []);

                if (data.length > lastMsgCountRef.current) {
                    const latest = data[data.length - 1];
                    // Only notify if someone else sent it and it's not a system duel message
                    if (latest && latest.user !== (displayName || userName || 'Visitor') && latest.message && !latest.message.startsWith('SYSTEM_DUEL:')) {
                        setChatToast({ user: latest.user, preview: latest.message });
                        setTimeout(() => setChatToast(null), 5000); // hide after 5s
                    }
                    lastMsgCountRef.current = data.length;
                }
            } catch (err) {
                // Ignore silent poll errors
            }
        };

        const intervalId = setInterval(pollChat, 3000);
        return () => clearInterval(intervalId);
    }, [shareCode, view, displayName, userName]);

    // Arena Polling
    useEffect(() => {
        if (!shareCode || view !== 'duel') return;

        const pollArena = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;
                const res = await fetch(`${cleanUrl}/api/arena/${shareCode}/status`);
                if (!res.ok) return;
                const data = await res.json();
                if (data) setArenaState(data);
            } catch (err) {
                // Ignore
            }
        };

        const intervalId = setInterval(pollArena, 1500); 
        pollArena(); 
        return () => clearInterval(intervalId);
    }, [shareCode, view]);

    // Reset notification count logic when entering chat
    useEffect(() => {
        if (view === 'chat' && shareCode) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat/${shareCode}`)
                .then(r => r.json())
                .then(d => {
                   if (Array.isArray(d)) lastMsgCountRef.current = d.length;
                })
                .catch(() => {});
        }
    }, [view, shareCode]);

    useEffect(() => {
        const sharedData = decodeStudyPack();
        if (sharedData) {
            setSummary(sharedData.s || []);
            setQuiz(sharedData.q || []);
            setKeyTerms(sharedData.k || []);
            setIsSharedView(true);
            setActiveTab("summary");
            // Clear hash after loading to prevent reuse issues but keep state
            if (typeof window !== 'undefined') window.location.hash = "";
        } else if (!isLoggedIn) {
            const saved = typeof window !== 'undefined' ? localStorage.getItem('bodh_auth') : null;
            if (saved !== 'true') {
                router.push('/auth');
            }
        }
    }, [isLoggedIn, router]);

    // Fetch History
    const { userId } = useAuth();
    useEffect(() => {
        if (isLoggedIn && userId) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/history/${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setHistory(data);
                    else setHistory([]);
                })
                .catch(err => {
                    console.error("History Load Error:", err);
                    setHistory([]);
                });
        }
    }, [isLoggedIn, userId]);

    // Load saved settings from localStorage - Keyed by user to prevent name bleed
    useEffect(() => {
        if (!userName) return;
        const userPrefsKey = `bodh_prefs_${userName}`;
        const savedPrefs = JSON.parse(localStorage.getItem(userPrefsKey) || '{}');
        
        setDisplayName(savedPrefs.displayName || userName || '');
        setPrefLanguage(savedPrefs.language || 'English');
    }, [userName]);

    // Show guide on first ever login
    useEffect(() => {
        if (isLoggedIn) {
            const seen = localStorage.getItem('bodh_guide_seen');
            if (!seen) setShowGuide(true);
        }
    }, [isLoggedIn]);

    const dismissGuide = () => {
        setShowGuide(false);
        localStorage.setItem('bodh_guide_seen', 'true');
    };

    const saveSettings = () => {
        if (!userName) return;
        const userPrefsKey = `bodh_prefs_${userName}`;
        const prefs = {
            displayName,
            language: prefLanguage
        };
        localStorage.setItem(userPrefsKey, JSON.stringify(prefs));
        setLanguage(prefLanguage);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
    };

    const handleChatJoin = async () => {
        if (!chatJoinInput.trim()) return;
        setChatError(null);
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/packs/${chatJoinInput.toUpperCase()}`);
            const data = await res.json();
            if (res.ok) {
                setSummary(data.summary);
                setQuiz(data.quiz);
                setKeyTerms(data.key_terms);
                setShareCode(chatJoinInput.toUpperCase());
                setChatMode('active');
            } else {
                setChatError('Code not found. Please check and try again.');
            }
        } catch {
            setChatError('Connection failed. Is the server running?');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatCreate = async () => {
        if (!hasResults) {
            setChatMode('lobby');
            setView('engine');
            return;
        }
        setChatError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/packs/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pack: { summary, quiz, key_terms: keyTerms }, userId: userName })
            });
            const data = await res.json();
            if (res.ok) {
                setShareCode(data.code);
                setChatMode('active');
            }
        } catch {
            setChatError('Failed to create session.');
        }
    };

    const handleArenaCreateOrJoin = async (action: 'create' | 'join', codeToJoin?: string) => {
        setIsLoading(true);
        setChatError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;
            
            let currentCode = codeToJoin;
            
            if (action === 'create') {
                if (!hasResults) return;
                const res = await fetch(`${cleanUrl}/api/packs/share`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pack: { summary, quiz, key_terms: keyTerms }, userId: userName })
                });
                const data = await res.json();
                if (res.ok) {
                    currentCode = data.code;
                } else {
                    throw new Error("Failed to create pack share");
                }
            } else {
                const res = await fetch(`${cleanUrl}/api/packs/${currentCode}`);
                if (!res.ok) throw new Error("Arena link invalid!");
                const data = await res.json();
                setSummary(data.summary || []);
                setQuiz(data.quiz || []);
                setKeyTerms(data.key_terms || []);
            }

            const arenaRes = await fetch(`${cleanUrl}/api/arena/${currentCode}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: displayName || userName || "Anonymous" })
            });
            const arenaData = await arenaRes.json();
            
            setShareCode(currentCode || null);
            setArenaState(arenaData);
            
        } catch (err: any) {
            setChatError(err.message || 'Failed to enter arena.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleArenaReady = async (isReady: boolean) => {
        if (!shareCode) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;
            await fetch(`${cleanUrl}/api/arena/${shareCode}/ready`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: displayName || userName || "Anonymous", isReady })
            });
        } catch (e) {}
    };

    const handleArenaAnswer = async (isCorrect: boolean) => {
        if (!shareCode) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;
            await fetch(`${cleanUrl}/api/arena/${shareCode}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: displayName || userName || "Anonymous", isCorrect })
            });
        } catch (e) {}
    };

    // Auto-detect Hindi (Devanagari script)
    useEffect(() => {
        if (text) {
            const devanagariRegex = /[\u0900-\u097F]/;
            if (devanagariRegex.test(text)) {
                setLanguage("Hindi");
            }
        }
    }, [text]);

    const handleGenerate = async () => {
        if (text.length < 100) return;
        setIsLoading(true);
        setError(null);
        setSummary([]);
        setQuiz([]);
        setKeyTerms([]);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const apiUrl = `${baseUrl.replace(/\/$/, '')}/generate`;
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, difficulty, n_questions: nQuestions, language })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate pack.");
            setSummary(data.summary || []);
            setQuiz(data.quiz || []);
            setKeyTerms(data.key_terms || []);
            setActiveTab("summary");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateQuestion = async (index: number) => {
        setIsRegenerating(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;
            
            const res = await fetch(`${cleanUrl}/api/generate/question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, existingQuestion: quiz[index].question, difficulty })
            });
            const newQ = await res.json();
            if (newQ.question) {
                const newQuiz = [...quiz];
                newQuiz[index] = newQ;
                setQuiz(newQuiz);
            }
        } catch (e) {
            console.error("Regen failed", e);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleFinishDuel = async (score: number, total: number) => {
        if (!shareCode) return;
        const studentName = displayName || userName || "Anonymous";
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;

        try {
            // 1. Save to Chat
            await fetch(`${cleanUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packId: shareCode,
                    user: studentName,
                    message: `SYSTEM_DUEL:${score}/${total}`
                })
            });

            // 2. Save to Duel Results
            await fetch(`${cleanUrl}/api/duel/${shareCode}/result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: studentName,
                    score,
                    total
                })
            });
        } catch (e) {}
    };

    const handleQuizResults = (score: number, total: number, missedIndices: number[]) => {
        // Simple heuristic: match question text keywords against summary topic titles
        const newWeakTopics = new Set<string>();
        
        missedIndices.forEach(idx => {
            const q = quiz[idx];
            if (!q) return;
            
            const qLower = q.question.toLowerCase();
            summary.forEach(s => {
                const topicLower = s.topic.toLowerCase();
                // If topic name is in question, or question mentions key words from topic
                if (qLower.includes(topicLower) || topicLower.split(' ').some((word: string) => word.length > 4 && qLower.includes(word))) {
                    newWeakTopics.add(s.topic);
                }
            });
        });

        setWeakTopics(Array.from(newWeakTopics));
    };

    const handleDownload = () => {
        generateStudyPackPDF(text.slice(0, 100), summary, quiz, keyTerms);
    };

    const handleCopyLink = () => {
        if (!summary.length && !quiz.length) return;
        const url = encodeStudyPack(summary, quiz, keyTerms);
        navigator.clipboard.writeText(url);
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleJoinCode = async () => {
        if (!joinCode.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/packs/${joinCode.toUpperCase()}`);
            const data = await res.json();
            if (res.ok) {
                setSummary(data.summary);
                setQuiz(data.quiz);
                setKeyTerms(data.key_terms);
                setShareCode(data.id);
                setView('engine');
                setActiveTab('summary');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Failed to load study pack.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        if (!hasResults) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/packs/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pack: { summary, quiz, key_terms: keyTerms }, userId: userName })
            });
            const data = await res.json();
            if (res.ok) {
                setShareCode(data.code);
                // Also update local history list
                setHistory(prev => [{ id: data.code, summary, quiz, key_terms: keyTerms, createdAt: new Date() }, ...prev]);
            }
        } catch (err) {
            console.error("Sharing failed:", err);
        }
    };

    const hasResults = summary.length > 0 || quiz.length > 0 || keyTerms.length > 0;
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    return (
        <>  
        <div className="dash-layout">
            {/* Sidebar */}
            <aside className="dash-sidebar">
                <div className="top-logo-sidebar transition-transform hover:scale-110">
                    <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        background: 'rgba(139, 92, 246, 0.1)', 
                        border: '1px solid rgba(139, 92, 246, 0.2)', 
                        borderRadius: '14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.05)'
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.24 12.24a5 5 0 00-8.49-4.8 5 5 0 00-8.49 4.8 5 5 0 008.49 4.8 5 5 0 008.49-4.8z" />
                        </svg>
                    </div>
                </div>
                
                <button id="tour-home" onClick={() => setView('engine')} className={`sidebar-icon-pill ${view === 'engine' ? 'active' : ''}`} title="Home"><Home size={20} /></button>
                <button id="tour-history" onClick={() => setView('history')} className={`sidebar-icon-pill ${view === 'history' ? 'active' : ''}`} title="History"><History size={20} /></button>
                <button id="tour-chat" onClick={() => setView('chat')} className={`sidebar-icon-pill ${view === 'chat' ? 'active' : ''}`} title="Team Chat"><MessageSquare size={20} /></button>
                <button id="tour-duel" onClick={() => setView('duel')} className={`sidebar-icon-pill ${view === 'duel' ? 'active' : ''}`} title="Quiz Duels"><Trophy size={20} /></button>
                <button id="tour-settings" onClick={() => setView('settings')} className={`sidebar-icon-pill ${view === 'settings' ? 'active' : ''}`} title="Settings"><Settings size={20} /></button>
            </aside>

            {/* Mobile Navigation */}
            <div className="mobile-nav">
                <button id="tour-home-mobile" onClick={() => setView('engine')} className={`mobile-nav-item ${view === 'engine' ? 'active' : ''}`}><Home size={20} /></button>
                <button id="tour-history-mobile" onClick={() => setView('history')} className={`mobile-nav-item ${view === 'history' ? 'active' : ''}`}><History size={20} /></button>
                <button id="tour-chat-mobile" onClick={() => setView('chat')} className={`mobile-nav-item ${view === 'chat' ? 'active' : ''}`}><MessageSquare size={20} /></button>
                <button id="tour-duel-mobile" onClick={() => setView('duel')} className={`mobile-nav-item ${view === 'duel' ? 'active' : ''}`}><Trophy size={20} /></button>
                <button id="tour-settings-mobile" onClick={() => setView('settings')} className={`mobile-nav-item ${view === 'settings' ? 'active' : ''}`}><Settings size={20} /></button>
            </div>

            {/* Main Content Stage */}
            <main className="dash-main">
                {/* Header Row */}
                <header className="dash-top-bar">
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <h2 className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-1">
                            {userName ? `Greetings, ${userName}` : "Personal Stage"}
                        </h2>
                        <h1 className="font-playfair italic text-3xl text-white/90">
                            {userName ? `Welcome back.` : "Clarity Awaits."}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="dash-search hidden md:flex opacity-40 hover:opacity-100 transition-opacity">
                            <Search size={14} className="text-white/40" />
                            <input 
                                type="text" 
                                placeholder="Join Code: #BK-12" 
                                className="bg-transparent border-none outline-none w-full text-[11px] text-white/50 placeholder:text-white/20"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoinCode()}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="https://github.com" target="_blank" className="btn-metallic">
                                <span className="opacity-60">Support</span>
                            </a>
                            <button onClick={handleLogout} className="btn-metallic !border-red-500/20 hover:!bg-red-500/10">
                                <LogOut size={12} className="text-red-400" />
                                <span className="text-red-100/40">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="dash-grid overflow-hidden pb-32">
                    {/* Secondary Views: History and Settings */}
                    {view === 'history' && (
                        <div className="col-span-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-2 px-2">
                                <h2 className="font-playfair italic text-2xl text-white/80">Archived Synthesis</h2>
                                <span className="text-[10px] uppercase tracking-widest text-white/20">{history.length} Packs found</span>
                            </div>
                            
                            {history.length === 0 ? (
                                <div className="dash-card min-h-[400px] flex items-center justify-center text-white/20 bg-white/[0.01]">
                                    <div className="text-center">
                                        <History size={48} className="mx-auto mb-4 opacity-10" />
                                        <p className="text-xs tracking-widest uppercase">No synthesis packs in repository yet.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {history.map((h, i) => (
                                        <div key={i} className="dash-card group hover:border-violet-500/30 transition-all cursor-pointer bg-white/[0.02] flex flex-col justify-between" onClick={() => {
                                            setSummary(h.summary);
                                            setQuiz(h.quiz);
                                            setKeyTerms(h.key_terms);
                                            setShareCode(h.id);
                                            setView('engine');
                                            setActiveTab('summary');
                                        }}>
                                            <div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400"><Layers size={18} /></div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-mono text-white/20">#{h.id}</span>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm("Are you sure you want to delete this pack?")) {
                                                                    try {
                                                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                                                                        const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;
                                                                        await fetch(`${cleanUrl}/api/history/${userName}/${h.id}`, { method: 'DELETE' });
                                                                        setHistory(prev => prev.filter(p => p.id !== h.id));
                                                                    } catch (err) { }
                                                                }
                                                            }}
                                                            className="text-white/20 hover:text-red-400 transition-colors bg-white/5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 backdrop-blur-sm z-10 hover:bg-red-500/10"
                                                            title="Delete Pack"
                                                        >
                                                            <Trash2 size={13} strokeWidth={2.5}/>
                                                        </button>
                                                    </div>
                                                </div>
                                                <h3 className="text-white/80 font-medium mb-1 line-clamp-1">{h.summary[0]?.topic || "Untitled Pack"}</h3>
                                                <p className="text-[10px] text-white/20 uppercase tracking-widest">{new Date(h.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="mt-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] uppercase font-bold text-violet-400">Open Pack →</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'duel' && (
                        <div className="col-span-12 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
                             <div className="flex items-center justify-between px-2">
                                <div>
                                    <h2 className="font-playfair italic text-3xl text-white/90">Duel Arena</h2>
                                    <p className="text-stone-600 text-xs mt-1">Challenge others and track your competitive rankings.</p>
                                </div>
                                {shareCode && arenaState && <span className="font-mono text-[10px] text-violet-400/60 border border-violet-500/20 px-4 py-1.5 rounded-full bg-violet-500/5 shadow-inner">Active Lobby: #{shareCode}</span>}
                            </div>

                            {!arenaState ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    {/* Create Duel Card */}
                                    <button
                                        onClick={() => handleArenaCreateOrJoin('create')}
                                        disabled={isLoading || !hasResults}
                                        className="dash-card group text-left hover:border-violet-500/30 transition-all cursor-pointer bg-white/[0.02] flex flex-col gap-6 p-8 sm:p-10"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-all group-hover:scale-110 duration-500 shadow-xl shadow-violet-500/5">
                                            <Trophy size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-xl mb-2 group-hover:text-white transition-colors">Initiate 1v1 Duel</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">
                                                {hasResults 
                                                    ? 'Create a competitive arena from your current study pack and challenge a friend.' 
                                                    : 'Generate a study pack first to start a duel.'}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex items-center gap-2 text-violet-400 font-bold text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-1 transition-all">
                                            {hasResults ? 'Start Arena' : 'Build Pack First'} <ChevronRight size={12} />
                                        </div>
                                    </button>

                                    {/* Join Duel Card */}
                                    <div className="dash-card bg-white/[0.02] border-teal-500/10 flex flex-col gap-6 p-8 sm:p-10">
                                        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-xl shadow-teal-500/5">
                                            <Users size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-xl mb-2">Enter Arena</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">Have a duel code? Enter it below to join the challenge and see where you rank on the leaderboard.</p>
                                        </div>
                                        <div className="mt-auto space-y-4">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={chatJoinInput}
                                                    onChange={(e) => setChatJoinInput(e.target.value.toUpperCase())}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleArenaCreateOrJoin('join', chatJoinInput);
                                                    }}
                                                    placeholder="ARENA CODE"
                                                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-sm outline-none focus:border-teal-500/50 placeholder:text-white/10 tracking-[0.3em] uppercase transition-colors"
                                                />
                                                <button
                                                    onClick={() => handleArenaCreateOrJoin('join', chatJoinInput)}
                                                    disabled={isLoading || chatJoinInput.length < 4}
                                                    className="px-8 py-4 rounded-2xl bg-teal-600/20 border border-teal-500/30 text-teal-300 text-xs font-bold hover:bg-teal-600/40 hover:border-teal-400 transition-all disabled:opacity-20 translate-z-0"
                                                >
                                                    {isLoading ? '...' : 'JOIN'}
                                                </button>
                                            </div>
                                            {chatError && <p className="text-red-400/70 text-[11px] font-medium tracking-wide">{chatError}</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                arenaState.status === 'playing' || arenaState.status === 'finished' ? (
                                    <ArenaQuiz 
                                        quiz={quiz}
                                        arenaState={arenaState}
                                        currentUser={displayName || userName || "Anonymous"}
                                        onAnswer={handleArenaAnswer}
                                        onLeave={() => { setArenaState(null); setShareCode(null); }}
                                    />
                                ) : (
                                    <div className="dash-card bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center py-20 mt-8 relative overflow-hidden">
                                        {arenaState.status === 'countdown' && (
                                            <div className="absolute inset-0 bg-violet-600/20 flex flex-col items-center justify-center z-10 backdrop-blur-[2px] animate-in fade-in duration-300">
                                                <span className="text-7xl font-bold font-mono text-white tracking-widest animate-ping">READY</span>
                                            </div>
                                        )}
                                        <h3 className="text-3xl font-playfair italic text-white/90 mb-3 text-center">Arena Lobby Setup</h3>
                                        <p className="text-stone-400 text-sm mb-16 text-center">Waiting for both players to connect and ready up...</p>
                                        
                                        <div className="flex flex-col sm:flex-row items-center gap-12 w-full max-w-2xl justify-center z-20">
                                            {Object.values(arenaState.participants).map((p: any) => (
                                                <div key={p.user} className="flex flex-col items-center gap-5">
                                                    <div className={`w-24 h-24 rounded-3xl border-2 flex items-center justify-center text-4xl font-bold transition-all duration-500 shadow-2xl
                                                        ${p.isReady ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20 scale-105' : 'border-white/10 bg-white/5 text-white/40 border-dashed'}
                                                    `}>
                                                        {p.user.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-white/90 font-medium mb-1.5 text-lg">{p.user} {p.user === (displayName || userName || "Anonymous") ? '(You)' : ''}</p>
                                                        <span className={`text-[11px] uppercase tracking-widest font-bold ${p.isReady ? 'text-emerald-400' : 'text-stone-500'}`}>
                                                            {p.isReady ? 'READY' : 'Waiting...'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {Object.values(arenaState.participants).length === 1 && (
                                                <div className="flex flex-col items-center gap-5">
                                                    <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 animate-pulse text-4xl font-light">
                                                        ?
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-white/40 font-medium mb-1.5 text-lg">Waiting...</p>
                                                        <span className="text-[11px] uppercase tracking-widest font-bold text-stone-600">
                                                            Share code: {shareCode}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-20 z-20">
                                            {arenaState.participants[displayName || userName || "Anonymous"]?.isReady ? (
                                                <button onClick={() => handleArenaReady(false)} className="btn-metallic border-red-500/30 text-red-300/80 hover:bg-red-500/10 px-8">
                                                    Cancel Ready
                                                </button>
                                            ) : (
                                                <button onClick={() => handleArenaReady(true)} className="btn-metallic bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 shadow-xl shadow-emerald-500/10 font-bold px-12 py-3.5 rounded-full text-[13px] tracking-wider uppercase">
                                                    I am Ready
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {view === 'chat' && (
                        <div className="col-span-12 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
                            <div className="flex items-center justify-between px-2">
                                <div>
                                    <h2 className="font-playfair italic text-2xl text-white/80">Team Collaboration</h2>
                                    <p className="text-stone-600 text-xs mt-1">Study together in real-time with shared packs.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {shareCode && <span className="font-mono text-[10px] text-violet-400/60 border border-violet-500/20 px-3 py-1 rounded-full">Session #{shareCode}</span>}
                                    {chatMode === 'active' && (
                                        <button onClick={() => { setChatMode('lobby'); setShareCode(null); }} className="btn-metallic text-[10px] border-red-500/20 hover:bg-red-500/10 text-red-300/60 tracking-widest uppercase">
                                            <X size={12} /> Leave
                                        </button>
                                    )}
                                </div>
                            </div>

                            {chatMode === 'lobby' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {/* Create Session Card */}
                                    <button
                                        onClick={handleChatCreate}
                                        className="dash-card group text-left hover:border-violet-500/30 transition-all cursor-pointer bg-white/[0.02] flex flex-col gap-5 sm:gap-6 p-6 sm:p-10"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-all">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-lg mb-2">Create a Session</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">
                                                {hasResults 
                                                    ? 'Generate a shareable code for your current study pack and invite teammates.' 
                                                    : 'You need to generate a study pack first before creating a session.'}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex items-center gap-2 text-violet-400/60 text-[10px] font-bold uppercase tracking-widest group-hover:text-violet-400 transition-colors">
                                            {hasResults ? 'Share Current Pack' : 'Go Build a Pack'} <ChevronRight size={12} />
                                        </div>
                                    </button>

                                    {/* Join Session Card */}
                                    <div className="dash-card bg-white/[0.02] flex flex-col gap-5 sm:gap-6 p-6 sm:p-10">
                                        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-lg mb-2">Join a Session</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">Enter a 6-character code shared by your teammate to load their study pack and join the discussion.</p>
                                        </div>
                                        <div className="mt-auto space-y-4">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={chatJoinInput}
                                                    onChange={(e) => setChatJoinInput(e.target.value.toUpperCase())}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleChatJoin()}
                                                    placeholder="e.g. BK7X2A"
                                                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-3 text-white font-mono text-sm outline-none focus:border-teal-500/50 placeholder:text-white/15 tracking-widest uppercase"
                                                />
                                                <button
                                                    onClick={handleChatJoin}
                                                    disabled={isLoading || chatJoinInput.length < 4}
                                                    className="px-6 py-3 rounded-2xl bg-teal-600/20 border border-teal-500/30 text-teal-300 text-xs font-bold hover:bg-teal-600/30 transition-all disabled:opacity-30"
                                                >
                                                    {isLoading ? '...' : 'Join'}
                                                </button>
                                            </div>
                                            {chatError && <p className="text-red-400/70 text-[11px]">{chatError}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {chatMode === 'active' && shareCode && (
                                <ChatPanel packId={shareCode} currentUser={displayName || userName || 'Visitor'} />
                            )}
                        </div>
                    )}

                    {view === 'settings' && (
                        <div className="col-span-12 max-w-2xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="text-center mb-10">
                                <h2 className="font-playfair italic text-3xl text-white/90 mb-2">Workspace Configuration</h2>
                                <p className="text-stone-500 text-sm italic">Your preferences are saved locally. </p>
                            </div>

                            {/* Display Name */}
                            <div className="dash-card p-8 border border-white/5 bg-white/[0.02] hover:border-violet-500/20 transition-all">
                                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">Display Name</h4>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder={userName || 'Enter your display name'}
                                        className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-violet-500/50 placeholder:text-white/15"
                                    />
                                </div>
                            </div>

                            {/* Default Language */}
                            <div className="dash-card p-8 border border-white/5 bg-white/[0.02] hover:border-violet-500/20 transition-all">
                                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">Default Generation Language</h4>
                                <div className="flex p-1.5 bg-white/[0.03] rounded-2xl border border-white/5">
                                    {['English', 'Hindi'].map(l => (
                                        <button key={l} onClick={() => setPrefLanguage(l)} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                                            prefLanguage === l ? 'bg-violet-600/20 text-violet-200 border border-violet-500/40 shadow-[0_0_16px_rgba(139,92,246,0.15)]' : 'text-white/30 hover:text-white/60'
                                        }`}>{l}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="dash-card p-8 border border-white/5 bg-white/[0.01]">
                                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">Account</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm py-3 border-b border-white/5">
                                        <span className="text-white/40">Username</span>
                                        <span className="text-white/80 font-medium">{userName || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-3 border-b border-white/5">
                                        <span className="text-white/40">Packs Generated</span>
                                        <span className="text-violet-400/80 font-medium">{history.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-3">
                                        <span className="text-white/40">Synthesis Quota</span>
                                        <span className="text-emerald-400/80">Premium • Unlimited</span>
                                    </div>
                                </div>
                            </div>

                            {/* Onboarding re-trigger */}
                            <div className="dash-card p-8 border border-white/5 bg-white/[0.01] flex items-center justify-between">
                                <div>
                                    <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Platform Guide</h4>
                                    <p className="text-stone-600 text-xs">Replay the onboarding walkthrough at any time.</p>
                                </div>
                                <button onClick={() => { setGuideStep(0); setShowGuide(true); }} className="btn-metallic border border-white/10 text-white/40 hover:text-white text-[10px] tracking-widest uppercase">
                                    Launch Guide
                                </button>
                            </div>

                            {/* Save */}
                            <button
                                onClick={saveSettings}
                                className={`w-full py-4 rounded-3xl font-bold text-xs tracking-widest uppercase transition-all duration-500 ${
                                    settingsSaved
                                        ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.15)]'
                                        : 'bg-violet-600/10 border border-violet-500/30 text-violet-300 hover:bg-violet-600/20 shadow-[0_0_16px_rgba(139,92,246,0.1)]'
                                }`}
                            >
                                {settingsSaved ? '\u2713 Preferences Saved' : 'Save Configuration'}
                            </button>
                        </div>
                    )}

                    {view === 'engine' && (
                        <>
                            {/* Card 1: Primary Workspace (Text Input & Summary Selection) */}
                            {!hasResults ? (
                                <>
                                    <div id="tour-input" className="dash-card col-span-12 lg:col-span-8 flex flex-col min-h-[500px]">
                                        <div className="flex items-center justify-between mb-8 opacity-40">
                                            <div className="flex gap-2">
                                                <div className="p-1.5 rounded-full bg-white/5 text-white/40"><FileText size={14} /></div>
                                                <div className="p-1.5 rounded-full border border-violet-500/20 text-violet-400/80 shadow-[0_0_10px_rgba(139,92,246,0.1)]"><Sparkles size={14} /></div>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-8">
                                            <div className="block flex-1">
                                                <InputPanel text={text} setText={setText} onClear={() => { setText(""); setSummary([]); setQuiz([]); setKeyTerms([]); }} />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm animate-in shake duration-500">
                                                <AlertCircle size={18} />
                                                <span>{error}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card 2: Configuration Stage */}
                                    <div id="tour-config" className="dash-card col-span-12 lg:col-span-4 flex flex-col justify-between">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between opacity-20">
                                                <div className="p-1 px-3 rounded-full border border-violet-500/20 text-violet-400/80 text-[10px] font-bold uppercase tracking-widest">Configuration</div>
                                            </div>

                                            {/* Complexity Stage: Efficient Use of Space */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold px-1">Complexity</label>
                                                <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                                                    {["Easy", "Medium", "Hard"].map(d => (
                                                        <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${difficulty === d ? 'bg-white/10 text-white shadow-xl' : 'text-white/20 hover:text-white/40'}`}>{d}</button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold px-1 flex justify-between items-center">
                                                    <span>Scope (Qns)</span>
                                                    <span className="text-violet-500/60 font-mono text-[9px]">{nQuestions} Active</span>
                                                </label>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                                                        {[5, 7, 10, 15].map(n => (
                                                            <button key={n} onClick={() => setNQuestions(n)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${nQuestions === n ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}>{n}</button>
                                                        ))}
                                                    </div>
                                                    <div className="relative group">
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            max="25"
                                                            value={nQuestions}
                                                            onChange={(e) => setNQuestions(parseInt(e.target.value) || 5)}
                                                            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2 text-[11px] text-white/60 placeholder:text-white/10 focus:outline-none focus:border-violet-500/30 transition-all font-mono"
                                                            placeholder="Custom (Max 25)..."
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white/10 group-focus-within:text-violet-500/40 uppercase tracking-widest">Custom</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold px-1">Dialect</label>
                                                <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                                                    {["English", "Hindi"].map(l => (
                                                        <button key={l} onClick={() => setLanguage(l)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${language === l ? 'bg-white/10 text-white shadow-xl' : 'text-white/20 hover:text-white/40'}`}>{l}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div id="tour-generate" className="mt-8">
                                            <GenerateButton onGenerate={handleGenerate} isLoading={isLoading} disabled={text.length < 100 || wordCount > 8000} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Study Mode: Summary replaces Input section */
                                <div className="dash-card col-span-12 min-h-[600px] flex flex-col animate-in fade-in duration-1000">
                                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-full border border-violet-500/20 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.1)]"><FileText size={18} /></div>
                                            <div>
                                                <h2 className="text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase">Active Synthesis</h2>
                                                <h3 className="font-playfair italic text-xl text-white/90">Knowledge Study Pack</h3>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setSummary([]); setQuiz([]); setKeyTerms([]); }}
                                            className="btn-metallic !py-3 !px-6 border border-white/10 hover:border-violet-500/30 transition-all text-[10px] font-bold tracking-widest uppercase"
                                        >
                                            <Layers size={12} className="opacity-40" />
                                            <span>New Synthesis</span>
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <SummaryPanel summary={summary} isLoading={isLoading} onAskTutor={handleAskTutorTopic} />
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-center">
                                        <button 
                                            onClick={() => {
                                                setActiveTab('quiz');
                                                document.getElementById('assessment-stage')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="group flex items-center gap-3 transition-all hover:scale-105 active:scale-95 px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-400/30 shadow-[0_10px_40px_rgba(139,92,246,0.2)] hover:shadow-[0_10px_50px_rgba(139,92,246,0.4)] w-full max-w-[320px] justify-center"
                                        >
                                            <ListChecks size={18} className="text-white" />
                                            <span className="text-xs font-bold tracking-[0.1em] uppercase text-white">Proceed to Assessment</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Card 3: Interactive Quiz/Glossary/Team Stage */}
                            <div id="assessment-stage" className={`dash-card col-span-12 min-h-[400px] transition-all duration-700 ${hasResults ? 'opacity-100 mt-8 !p-4 sm:!p-10' : 'opacity-20 pointer-events-none'}`}>
                                 <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-10">
                                     <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                        <button 
                                            onClick={() => setActiveTab('quiz')} 
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-bold tracking-wide transition-all duration-300 border
                                                ${activeTab === 'quiz' 
                                                    ? 'bg-indigo-600/20 text-indigo-100 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' 
                                                    : 'bg-indigo-900/10 text-indigo-300/80 border-indigo-500/20 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-400/40 hover:scale-[1.02]'}`}
                                        >
                                            <ShieldCheck size={14} className={activeTab === 'quiz' ? 'text-indigo-300' : 'text-indigo-400/60'} />
                                            Quiz
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('terms')} 
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-bold tracking-wide transition-all duration-300 border
                                                ${activeTab === 'terms' 
                                                    ? 'bg-teal-600/20 text-teal-100 border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.3)] scale-[1.02]' 
                                                    : 'bg-teal-900/10 text-teal-300/80 border-teal-500/20 hover:text-white hover:bg-teal-600/20 hover:border-teal-400/40 hover:scale-[1.02]'}`}
                                        >
                                            <Layers size={14} className={activeTab === 'terms' ? 'text-teal-300' : 'text-teal-400/60'} />
                                            Flashcards
                                        </button>
                                     </div>
                                     <div className="hidden sm:block p-2 rounded-full border border-violet-500/20 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.1)]"><ListChecks size={16} /></div>
                                </div>
                                
                                <div className="min-h-[300px]">
                                    {activeTab === "quiz" && (
                                        <QuizPanel 
                                            quiz={quiz} 
                                            isLoading={isLoading} 
                                            onRegenerate={handleRegenerateQuestion}
                                            isRegenerating={isRegenerating}
                                            onFinishDuel={handleFinishDuel}
                                            duelResults={duelResults}
                                            onAskTutor={handleAskTutor}
                                            onCompleteWithResults={handleQuizResults}
                                            shareCode={shareCode || undefined}
                                        />
                                    )}
                                    {activeTab === "terms" && <FlashcardsPanel keyTerms={keyTerms} isLoading={isLoading} />}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Global Chat Toast */}
            {chatToast && (
                <div onClick={() => { setView('chat'); setChatToast(null); }} className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] cursor-pointer animate-in slide-in-from-top fade-in duration-500">
                    <div className="flex items-center gap-4 py-3 px-5 rounded-full bg-white/10 backdrop-blur-xl border border-violet-500/40 shadow-[0_10px_40px_rgba(139,92,246,0.3)] hover:bg-white/15 transition-all">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center">
                            <MessageSquare size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-violet-300">New Message from {chatToast.user}</span>
                            <span className="text-sm text-white/90 truncate max-w-[200px]">{chatToast.preview}</span>
                        </div>
                        <ChevronRight size={16} className="text-white/40 ml-2" />
                    </div>
                </div>
            )}



            <ProductTour
                active={showGuide}
                onDone={dismissGuide}
                steps={[
                    {
                        targetId: 'tour-input',
                        title: 'Synthesis Engine',
                        body: 'Paste your study notes or lecture text here, or drag-and-drop a PDF. Bodh extracts and cleans the content automatically.',
                        position: 'bottom',
                        onActivate: () => { setView('engine'); setSummary([]); setQuiz([]); setKeyTerms([]); },
                    },
                    {
                        targetId: 'tour-config',
                        title: 'Configuration Panel',
                        body: 'Choose your Complexity level, how many quiz Questions to generate, and the output Language before synthesising.',
                        position: 'left',
                        onActivate: () => { setView('engine'); setSummary([]); setQuiz([]); setKeyTerms([]); },
                    },
                    {
                        targetId: 'tour-generate',
                        title: 'Generate Study Pack',
                        body: 'When you\'re ready, hit Generate. Bodh will produce a full Summary, Self-Quiz, and Glossary in seconds.',
                        position: 'top',
                        onActivate: () => { setView('engine'); setSummary([]); setQuiz([]); setKeyTerms([]); },
                    },
                    {
                        targetId: 'assessment-stage',
                        title: 'Self-Quiz Engine',
                        body: 'After generation, scroll down here. Start with Confidence Mode — your score determines if you unlock Browse Mode where every answer is revealed with explanations.',
                        position: 'top',
                        onActivate: () => setView('engine'),
                    },
                    {
                        targetId: 'tour-chat',
                        title: 'Team Collaboration',
                        body: 'Click this icon to open the Team Chat. Create a session to get a shareable code, or enter a teammate\'s code to join their study pack and discuss in real-time.',
                        position: 'right',
                        onActivate: () => {},
                    },
                    {
                        targetId: 'tour-history',
                        title: 'Archive',
                        body: 'Every study pack you generate is saved here automatically. Click any card to reload it — your notes are never lost.',
                        position: 'right',
                        onActivate: () => {},
                    },
                    {
                        targetId: 'tour-settings',
                        title: 'Workspace Settings',
                        body: 'Set your display name, default language, and review your account stats. Changes are saved locally to your device.',
                        position: 'right',
                        onActivate: () => {},
                    },
                ]}
            />
        </div>

            {/* All fixed-positioned overlays are OUTSIDE .dash-layout to avoid
                position:fixed being trapped by overflow-x:hidden / backdrop-filter
                on the layout container. */}
            <ExportBar isVisible={hasResults} onDownload={handleDownload} onCopyLink={handleCopyLink} />

            {/* BodhTutorPanel + Floating Bubble */}
            <BodhTutorPanel 
                isOpen={isTutorOpen} 
                onClose={() => setIsTutorOpen(false)} 
                context={{
                    summary,
                    key_terms: keyTerms,
                    weak_topics: weakTopics,
                    entry_context: tutorEntryContext
                }}
                chatHistory={tutorChatHistory}
                setChatHistory={setTutorChatHistory}
                userName={displayName || userName || undefined}
            />

            {/* Floating Tutor Bubble — positioned relative to true viewport */}
            {!isTutorOpen && hasResults && (
                <button 
                    onClick={() => handleAskTutor({ type: 'open' })}
                    className="fixed bottom-[96px] lg:bottom-12 right-6 lg:right-12 z-[110] glass-metal-icon w-16 h-16 sm:w-20 sm:h-20 hover:scale-110 active:scale-95 group transition-all duration-500"
                    title="Ask Bodh AI Tutor"
                    style={{ position: 'fixed' }}
                >
                    {/* Metallic glow effects */}
                    <div className="absolute inset-0 bg-violet-600/10 blur-xl group-hover:bg-violet-600/20 transition-all duration-700" />
                    <div className="relative z-10 flex items-center justify-center">
                        <Bot size={32} className="text-white/80 group-hover:text-white transition-colors duration-500 group-hover:animate-bounce" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0A0A0B] rounded-full shadow-[0_0_10px_#10b981]" />
                    </div>
                </button>
            )}
        </>
    );
}
