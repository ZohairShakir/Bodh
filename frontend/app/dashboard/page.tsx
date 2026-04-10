"use client";

import React, { useState, useEffect, useRef } from "react";

import { Sparkles, AlertCircle, FileText, ListChecks, Settings, History, Layers, MessageSquare, ShieldCheck, Users, Plus, X, ChevronRight, Bot, Trophy, Trash2, Swords, Zap, Search } from "lucide-react";
import InputPanel from "@/components/InputPanel";
import GenerateButton from "@/components/GenerateButton";
import SummaryPanel from "@/components/SummaryPanel";
import QuizPanel from "@/components/QuizPanel";
import FlashcardsPanel from "@/components/FlashcardsPanel";
import ExportBar from "@/components/ExportBar";
import { generateStudyPackPDF } from "@/lib/pdfGenerator";
import { encodeStudyPack, decodeStudyPack, QuizItem } from "@/lib/shareLink";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import ProductTour from "@/components/ProductTour";
import BodhTutorPanel from "@/components/BodhTutorPanel";
import ArenaQuiz from "@/components/ArenaQuiz";
import ArenaLobby from "@/components/Arena/ArenaLobby";
import ArenaSetupOverlay from "@/components/Arena/ArenaSetupOverlay";

type Mode = "summary" | "quiz" | "terms";

export default function DashboardPage() {
    const { userName, avatarId: savedAvatarId, hasProfile, setProfile, updateProfile: updateUserProfile, historyCodes, addHistoryCode, removeHistoryCode } = useUser();
    const router = useRouter();

    const [text, setText] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [nQuestions, setNQuestions] = useState(7);
    const [language, setLanguage] = useState("English");
    const [view, setView] = useState<"arena" | "create" | "history" | "settings" | "chat">("arena");

    
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
    
    // Arena state
    const [arenaState, setArenaState] = useState<any>(null);
    const [resources, setResources] = useState<any[]>([]);
    const [activeArenaSetup, setActiveArenaSetup] = useState<'duel' | 'fourway' | null>(null);

    // Settings state
    const [displayName, setDisplayName] = useState("");
    const [avatarId, setAvatarId] = useState("A1");
    const [prefLanguage, setPrefLanguage] = useState("English");
    const [settingsSaved, setSettingsSaved] = useState(false);

    // Profile overlay (shown on first visit)
    const [showProfileOverlay, setShowProfileOverlay] = useState(false);
    const [overlayName, setOverlayName] = useState("");
    const [overlayAvatar, setOverlayAvatar] = useState("A1");

    // Chat lobby state
    const [chatMode, setChatMode] = useState<"lobby" | "join" | "create" | "active">("lobby");
    const [chatJoinInput, setChatJoinInput] = useState("");
    const [chatError, setChatError] = useState<string | null>(null);
    const [chatToast, setChatToast] = useState<{user: string, preview: string} | null>(null);
    const lastMsgCountRef = useRef(0);

    // Onboarding guide
    const [showGuide, setShowGuide] = useState(false);
    const [guideStep, setGuideStep] = useState(0);

    const handleAskTutor = (ctx: any) => {
        setTutorEntryContext(ctx);
        setIsTutorOpen(true);
    };
    const handleAskTutorTopic = (topic: string, bullets: string[]) => {
        setTutorEntryContext({ type: 'topic_question', topic, bullets });
        setIsTutorOpen(true);
    };


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
        if (!shareCode || view !== 'arena') return;

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

    // Load displayName/avatarId from UserContext
    useEffect(() => {
        if (userName) setDisplayName(userName);
        if (savedAvatarId) setAvatarId(savedAvatarId);
    }, [userName, savedAvatarId]);

    // Show profile overlay on first visit
    useEffect(() => {
        if (!hasProfile) setShowProfileOverlay(true);
    }, [hasProfile]);

    // Fetch history from backend using localStorage codes
    useEffect(() => {
        if (historyCodes.length === 0) { setHistory([]); return; }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const cleanUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
        fetch(`${cleanUrl.replace('/api','')}/api/history?codes=${historyCodes.join(',')}`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setHistory(data); })
            .catch(() => {});
    }, [historyCodes]);

    // Show guide on first pack generation
    const dismissGuide = () => {
        setShowGuide(false);
        localStorage.setItem('bodh_guide_seen', 'true');
    };

    const saveSettings = () => {
        setProfile({ displayName, avatarId });
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
            setView('create');
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

    const handleArenaCreateOrJoin = async (action: 'create' | 'join', codeToJoin?: string, mode: 'duel' | 'fourway' = 'duel', guestName?: string, guestAvatar?: string) => {
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
                    body: JSON.stringify({ pack: { summary, quiz, key_terms: keyTerms }, userId: userName || "Anonymous" })
                });
                const data = await res.json();
                if (res.ok) {
                    currentCode = data.code;
                    addHistoryCode(currentCode as string);
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

            const finalName = guestName || displayName || userName || "Anonymous";
            const finalAvatar = guestAvatar || avatarId || "A1";

            const arenaRes = await fetch(`${cleanUrl}/api/arena/${currentCode}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: finalName, avatar: finalAvatar, mode })
            });
            const arenaData = await arenaRes.json();
            
            setShareCode(currentCode || null);
            setArenaState(arenaData);
            
            // If guest provided name/avatar, save them
            if (guestName) {
                setDisplayName(guestName);
                setAvatarId(guestAvatar || "A1");
                localStorage.setItem('bodh_guest_prefs', JSON.stringify({ displayName: guestName, avatarId: guestAvatar }));
            }
            
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

    const handleStartArenaGeneration = async (sourceContent: string, diff: string, n: number) => {
        if (!activeArenaSetup) return;
        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            
            // 1. Generate
            const genRes = await fetch(`${apiUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: sourceContent, difficulty: diff, n_questions: n, language })
            });
            const genData = await genRes.json();
            if (!genRes.ok) throw new Error(genData.error || "Generation failed.");

            // Update local state (optional but good for context)
            setSummary(genData.summary || []);
            setQuiz(genData.quiz || []);
            setKeyTerms(genData.key_terms || []);
            
            // 2. Share & Join
            // We use a temporary flag or just pass data directly to handleArenaCreateOrJoin logic
            // To keep it simple, I'll update share code and then call join
            const shareRes = await fetch(`${apiUrl}/packs/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pack: genData, userId: userName || "Anonymous" })
            });
            const shareData = await shareRes.json();
            if (!shareRes.ok) throw new Error("Sharing failed.");
            
            addHistoryCode(shareData.code);
            
            // 3. Join Arena Lobby
            await handleArenaCreateOrJoin('join', shareData.code, activeArenaSetup);
            setActiveArenaSetup(null);

        } catch (err: any) {
            throw err;
        } finally {
            setIsLoading(false);
        }
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



    const handleCopyLink = () => {
        if (shareCode) {
            const joinUrl = `${window.location.origin}/dashboard?join=${shareCode}`;
            navigator.clipboard.writeText(joinUrl);
        } else if (summary.length || quiz.length) {
            const url = encodeStudyPack(summary, quiz, keyTerms);
            navigator.clipboard.writeText(url);
        }
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
                addHistoryCode(data.code);
                // Also update local history list
                setHistory(prev => [{ id: data.code, summary, quiz, key_terms: keyTerms, createdAt: new Date() }, ...prev]);
            }
        } catch (err) {
            console.error("Sharing failed:", err);
        }
    };

    const hasResults = summary.length > 0 || quiz.length > 0 || keyTerms.length > 0;
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    // Profile overlay (first visit)
    if (showProfileOverlay) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/10">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" className="w-10 h-10">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.24 12.24a5 5 0 00-8.49-4.8 5 5 0 00-8.49 4.8 5 5 0 008.49 4.8 5 5 0 008.49-4.8z" />
                        </svg>
                    </div>
                    <h1 className="font-playfair italic text-4xl text-white/90 mb-2">Welcome to Bodh</h1>
                    <p className="text-stone-500 text-sm">No sign-up needed. Just tell us what to call you.</p>
                </div>

                <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl space-y-8">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3">Your Battle Name</label>
                        <input
                            type="text"
                            value={overlayName}
                            onChange={e => setOverlayName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && overlayName.trim()) { setProfile({ displayName: overlayName.trim(), avatarId: overlayAvatar }); setDisplayName(overlayName.trim()); setAvatarId(overlayAvatar); setShowProfileOverlay(false); }}}
                            placeholder="e.g. Brainiac"
                            maxLength={18}
                            autoFocus
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/15 focus:border-violet-500/50 outline-none transition-all text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4">Pick Your Avatar</label>
                        <div className="grid grid-cols-4 gap-3">
                            {['A1','A2','A3','A4','A5','A6','A7','A8'].map(id => (
                                <button
                                    key={id}
                                    onClick={() => setOverlayAvatar(id)}
                                    className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 border-2 ${
                                        overlayAvatar === id
                                            ? 'border-violet-500 bg-violet-500/20 scale-110 shadow-lg shadow-violet-500/30'
                                            : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                                >
                                    {['🦁','🦊','🐺','🦅','🐉','🦋','🌙','⚡'][['A1','A2','A3','A4','A5','A6','A7','A8'].indexOf(id)]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        disabled={!overlayName.trim()}
                        onClick={() => {
                            setProfile({ displayName: overlayName.trim(), avatarId: overlayAvatar });
                            setDisplayName(overlayName.trim());
                            setAvatarId(overlayAvatar);
                            setShowProfileOverlay(false);
                        }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm tracking-widest uppercase disabled:opacity-30 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-500"
                    >
                        Enter Bodh →
                    </button>
                </div>
            </div>
        </div>
    );

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
                
                <button id="tour-arena" onClick={() => setView('arena')} className={`sidebar-icon-pill ${view === 'arena' ? 'active' : ''}`} title="Arena">
                    <Trophy size={20} />
                </button>
                <button id="tour-create" onClick={() => setView('create')} className={`sidebar-icon-pill ${view === 'create' ? 'active' : ''}`} title="Create Pack">
                    <Sparkles size={20} />
                </button>
                <button id="tour-history" onClick={() => setView('history')} className={`sidebar-icon-pill ${view === 'history' ? 'active' : ''}`} title="History">
                    <History size={20} />
                </button>
                <button id="tour-chat" onClick={() => setView('chat')} className={`sidebar-icon-pill ${view === 'chat' ? 'active' : ''}`} title="Team Chat">
                    <MessageSquare size={20} />
                </button>
                <button id="tour-settings" onClick={() => setView('settings')} className={`sidebar-icon-pill ${view === 'settings' ? 'active' : ''}`} title="Settings">
                    <Settings size={20} />
                </button>
            </aside>

            <div className="mobile-nav">
                <button onClick={() => setView('arena')} className={`mobile-nav-item ${view === 'arena' ? 'active' : ''}`}><Trophy size={20} /></button>
                <button onClick={() => setView('create')} className={`mobile-nav-item ${view === 'create' ? 'active' : ''}`}><Sparkles size={20} /></button>
                <button onClick={() => setView('history')} className={`mobile-nav-item ${view === 'history' ? 'active' : ''}`}><History size={20} /></button>
                <button onClick={() => setView('chat')} className={`mobile-nav-item ${view === 'chat' ? 'active' : ''}`}><MessageSquare size={20} /></button>
                <button onClick={() => setView('settings')} className={`mobile-nav-item ${view === 'settings' ? 'active' : ''}`}><Settings size={20} /></button>
            </div>

            {/* Main Content Stage */}
            <main className="dash-main">
                {/* Header Row */}
                <header className="dash-top-bar">
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <h2 className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-1">
                            {view === 'arena' && 'Battle Arena'}
                            {view === 'create' && 'Create Pack'}
                            {view === 'history' && 'Battle History'}
                            {view === 'chat' && 'Team Chat'}
                            {view === 'settings' && 'Settings'}
                        </h2>
                        <h1 className="font-playfair italic text-3xl text-white/90">
                            {displayName ? `Hey, ${displayName} ⚔️` : "Ready to Battle?"}
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
                            <button
                                onClick={() => setShowProfileOverlay(true)}
                                className="btn-metallic flex items-center gap-2"
                                title="Change name / avatar"
                            >
                                <span className="text-lg">{['🦁','🦊','🐺','🦅','🐉','🦋','🌙','⚡'][['A1','A2','A3','A4','A5','A6','A7','A8'].indexOf(avatarId)] || '🦁'}</span>
                                <span className="text-white/40 text-xs">{displayName || 'Set Name'}</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="dash-grid overflow-hidden pb-32">
                    {/* Arena View */}
                    {view === 'arena' && (
                        <div className="col-span-12 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
                            <div className="flex items-center justify-between px-2">
                                <div>
                                    <h2 className="font-playfair italic text-3xl text-white/90">Duel Arena</h2>
                                    <p className="text-stone-600 text-xs mt-1">Challenge others and track your competitive rankings.</p>
                                </div>
                                {shareCode && arenaState && <span className="font-mono text-[10px] text-violet-400/60 border border-violet-500/20 px-4 py-1.5 rounded-full bg-violet-500/5 shadow-inner">Active Lobby: #{shareCode}</span>}
                            </div>

                            {!arenaState ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                    {/* Create 1v1 Duel Card */}
                                    <button
                                        onClick={() => setActiveArenaSetup('duel')}
                                        disabled={isLoading}
                                        className="dash-card group text-left hover:border-violet-500/30 transition-all cursor-pointer bg-white/[0.02] flex flex-col gap-6 p-8"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-all group-hover:scale-110 duration-500 shadow-xl shadow-violet-500/5">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-lg mb-1.5 group-hover:text-white transition-colors">1v1 Duel</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">
                                                Challenge a friend head-to-head. Select from Bodh Library or upload your own chapter.
                                            </p>
                                        </div>
                                        <div className="mt-auto flex items-center gap-2 text-violet-400 font-bold text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-1 transition-all">
                                            Start Duel <ChevronRight size={12} />
                                        </div>
                                    </button>

                                    {/* Create 4-Way Clash Card */}
                                    <button
                                        onClick={() => setActiveArenaSetup('fourway')}
                                        disabled={isLoading}
                                        className="dash-card group text-left hover:border-orange-500/30 transition-all cursor-pointer bg-white/[0.02] border-orange-500/10 flex flex-col gap-6 p-8"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-all group-hover:scale-110 duration-500 shadow-xl shadow-orange-500/5">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-lg mb-1.5 group-hover:text-white transition-colors">4-Way Clash</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">
                                                Host a four-player battle royale. Pick any available chapter to begin.
                                            </p>
                                        </div>
                                        <div className="mt-auto flex items-center gap-2 text-orange-400 font-bold text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-1 transition-all">
                                            Host Clash <ChevronRight size={12} />
                                        </div>
                                    </button>


                                    {/* Join Arena Card */}
                                    <div className="dash-card bg-white/[0.02] border-teal-500/10 flex flex-col gap-6 p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-lg mb-1.5">Join Arena</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">
                                                Have a code? Enter it below to join a live arena.
                                            </p>
                                        </div>
                                        <div className="mt-auto space-y-3">
                                            <div className="flex gap-3">
                                                <input 
                                                    type="text" 
                                                    maxLength={6}
                                                    value={joinCode}
                                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && joinCode.length >= 4) {
                                                            handleArenaCreateOrJoin('join', joinCode);
                                                        }
                                                    }}
                                                    placeholder="CODE"
                                                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3.5 text-white font-mono text-sm outline-none focus:border-teal-500/50 transition-colors uppercase tracking-[0.3em] placeholder:tracking-widest"
                                                />
                                                <button 
                                                    onClick={() => handleArenaCreateOrJoin('join', joinCode)}
                                                    disabled={isLoading || joinCode.length < 4}
                                                    className="px-5 py-3.5 rounded-2xl bg-teal-600/20 border border-teal-500/30 text-teal-300 text-xs font-bold hover:bg-teal-600/40 hover:border-teal-500/50 transition-all disabled:opacity-30 flex items-center justify-center min-w-[80px]"
                                                >
                                                    {isLoading ? <Sparkles size={16} className="animate-spin" /> : 'JOIN'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                arenaState.status === 'playing' || arenaState.status === 'finished' ? (
                                    <ArenaQuiz 
                                        arenaState={arenaState}
                                        currentUser={displayName || userName || "Anonymous"}
                                        onAnswer={handleArenaAnswer}
                                        onLeave={() => { setArenaState(null); setShareCode(null); }}
                                    />
                                ) : (
                                    <ArenaLobby 
                                        code={shareCode || ""}
                                        participants={arenaState.participants}
                                        currentUser={displayName || userName || "Anonymous"}
                                        onReady={handleArenaReady}
                                        onJoin={(name, avatar) => handleArenaCreateOrJoin('join', shareCode || "", arenaState.mode, name, avatar)}
                                        isLoading={isLoading}
                                    />
                                )
                            )}
                        </div>
                    )}

                    {/* Create Pack View */}
                    {view === 'create' && (
                        <>
                            {/* Input Panel */}
                            <div id="tour-home" className="col-span-12 xl:col-span-5 flex flex-col gap-4 min-h-[400px]">
                                <div id="tour-input" className="dash-card flex-1 flex flex-col">
                                     <div className="flex items-center justify-between mb-6 opacity-40">
                                            <div className="flex gap-2">
                                                <div className="p-1.5 rounded-full bg-white/5 text-white/40"><FileText size={14} /></div>
                                                <div className="p-1.5 rounded-full border border-violet-500/20 text-violet-400/80 shadow-[0_0_10px_rgba(139,92,246,0.1)]"><Sparkles size={14} /></div>
                                            </div>
                                     </div>
                                     <InputPanel text={text} setText={setText} onClear={() => { setText(""); setSummary([]); setQuiz([]); setKeyTerms([]); }} />
                                     {error && <div className="mt-4 text-red-400 text-xs">{error}</div>}
                                </div>
                                
                                <div id="tour-config" className="dash-card">
                                     <div className="flex flex-col gap-6">
                                         <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold px-1">Complexity</label>
                                            <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                                                {["Easy", "Medium", "Hard"].map(d => (
                                                    <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${difficulty === d ? 'bg-white/10 text-white shadow-xl' : 'text-white/20 hover:text-white/40'}`}>{d}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold px-1">Scope (Qns)</label>
                                            <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                                                {[5, 7, 10, 15].map(n => (
                                                    <button key={n} onClick={() => setNQuestions(n)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${nQuestions === n ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}>{n}</button>
                                                ))}
                                            </div>
                                        </div>
                                     </div>
                                     <div id="tour-generate" className="mt-8">
                                         <GenerateButton onGenerate={handleGenerate} isLoading={isLoading} disabled={text.length < 100} />
                                     </div>
                                </div>
                            </div>

                            {/* Main Stage (Results) */}
                            <div className="col-span-12 xl:col-span-7 flex flex-col pt-0 sm:pt-4" id="assessment-stage">
                                {!hasResults && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/[0.01] rounded-[32px] border border-dashed border-white/10 min-h-[400px]">
                                        <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-6 border border-violet-500/20 shadow-lg shadow-violet-500/5">
                                            <Layers size={24} />
                                        </div>
                                        <h3 className="font-playfair italic text-xl text-white/50 mb-2">Workspace Empty</h3>
                                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/20">Paste text & generate to begin</p>
                                    </div>
                                )}
                                
                                {hasResults && (
                                    <div className="flex flex-col h-full space-y-6">
                                        <SummaryPanel summary={summary} isLoading={isLoading} />
                                        
                                        {/* Activity Tabs */}
                                        <div className="flex items-center gap-2 mb-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl sm:rounded-[20px] backdrop-blur-xl">
                                            <button 
                                                onClick={() => setActiveTab('quiz')} 
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-bold tracking-wide transition-all duration-300 border
                                                    ${activeTab === 'quiz' 
                                                        ? 'bg-indigo-600/20 text-indigo-100 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' 
                                                        : 'bg-indigo-900/10 text-indigo-300/80 border-indigo-500/20 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-400/40 hover:scale-[1.02]'}`}
                                            >
                                                <ShieldCheck size={14} className={activeTab === 'quiz' ? 'text-indigo-300' : 'text-indigo-400/60'} />
                                                Self-Quiz
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('terms')} 
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-bold tracking-wide transition-all duration-300 border
                                                    ${activeTab === 'terms' 
                                                        ? 'bg-teal-600/20 text-teal-100 border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.3)] scale-[1.02]' 
                                                        : 'bg-teal-900/10 text-teal-300/80 border-teal-500/20 hover:text-white hover:bg-teal-600/20 hover:border-teal-400/40 hover:scale-[1.02]'}`}
                                            >
                                                <Layers size={14} className={activeTab === 'terms' ? 'text-teal-300' : 'text-teal-400/60'} />
                                                Flashcards
                                            </button>
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
                                )}
                            </div>
                        </>
                    )}

                    {/* History View */}
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
                                            setView('create'); // Go to create view to see results
                                            setActiveTab('quiz');
                                        }}>
                                            <div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400"><Layers size={18} /></div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-mono text-white/20">#{h.id}</span>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm("Delete this pack from history?")) {
                                                                    removeHistoryCode(h.id || h.code);
                                                                    setHistory(prev => prev.filter(p => (p.id || p.code) !== (h.id || h.code)));
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
                                    <button
                                        onClick={handleChatCreate}
                                        className="dash-card group text-left hover:border-violet-500/30 transition-all cursor-pointer bg-white/[0.02] flex flex-col gap-5 p-6 sm:p-10"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-all">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-lg mb-2">Create a Session</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">Share your current pack with teammates.</p>
                                        </div>
                                    </button>

                                    <div className="dash-card bg-white/[0.02] flex flex-col gap-5 p-6 sm:p-10">
                                        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                                            <Users size={24} />
                                        </div>
                                        <div className="mt-auto space-y-3">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={chatJoinInput}
                                                onChange={(e) => setChatJoinInput(e.target.value.toUpperCase())}
                                                placeholder="CODE"
                                                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-3 text-white font-mono text-sm outline-none"
                                            />
                                            <button onClick={handleChatJoin} className="w-full py-3 rounded-2xl bg-teal-600/20 text-teal-300 font-bold text-xs">Join Session</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {chatMode === 'active' && shareCode && (
                                <ChatPanel packId={shareCode} currentUser={displayName || userName || 'Visitor'} summary={summary} keyTerms={keyTerms} />
                            )}
                        </div>
                    )}

                    {view === 'settings' && (
                        <div className="col-span-12 max-w-2xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="text-center mb-10">
                                <h2 className="font-playfair italic text-3xl text-white/90 mb-2">Workspace Configuration</h2>
                                <p className="text-stone-500 text-sm italic">Preferences are saved locally.</p>
                            </div>

                            {/* Display Name */}
                            <div className="dash-card p-8 border border-white/5 bg-white/[0.02]">
                                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">Display Name</h4>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none"
                                />
                            </div>

                            <button
                                onClick={saveSettings}
                                className="w-full py-4 rounded-3xl bg-violet-600/10 border border-violet-500/30 text-violet-300 font-bold text-xs uppercase"
                            >
                                {settingsSaved ? '\u2713 Preferences Saved' : 'Save Configuration'}
                            </button>
                        </div>
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
                            <span className="text-[10px] font-bold tracking-widest uppercase text-violet-300">New Message from {chatToast?.user}</span>
                            <span className="text-sm text-white/90 truncate max-w-[200px]">{chatToast?.preview}</span>
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
                        targetId: 'tour-dashboard',
                        title: 'Duel Arena',
                        body: 'Welcome to your multiplayer hub. Here you can start 1v1 duels, host 4-way clashes, or join active lobbies.',
                        position: 'right',
                        onActivate: () => setView('arena'),
                    },
                    {
                        targetId: 'tour-history',
                        title: 'Archived Packs',
                        body: 'Every study pack you generate is saved here automatically. Click any card to reload it.',
                        position: 'right',
                        onActivate: () => setView('history'),
                    },
                    {
                        targetId: 'tour-home',
                        title: 'Create & Synth Engine',
                        body: 'Paste your text or notes here to instantly generate custom quiz battle packs.',
                        position: 'right',
                        onActivate: () => setView('create'),
                    },
                    {
                        targetId: 'tour-chat',
                        title: 'Team Chat',
                        body: 'Click this icon to open the Team Chat and discuss strategies or study notes in real-time.',
                        position: 'right',
                        onActivate: () => setView('chat'),
                    },
                    {
                        targetId: 'tour-settings',
                        title: 'Profile Settings',
                        body: 'Set your display name and choose an avatar to represent you in the Arena.',
                        position: 'right',
                        onActivate: () => setView('settings'),
                    },
                ]}
            />
        </div>

            {/* All fixed-positioned overlays are OUTSIDE .dash-layout to avoid
                position:fixed being trapped by overflow-x:hidden / backdrop-filter
                on the layout container. */}
            <ExportBar isVisible={hasResults} onCopyLink={handleCopyLink} />
            <ArenaSetupOverlay 
                isOpen={!!activeArenaSetup} 
                onClose={() => setActiveArenaSetup(null)}
                mode={activeArenaSetup || 'duel'}
                onStartGeneration={handleStartArenaGeneration}
            />
        </>
    );
}
