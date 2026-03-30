"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Trophy, Users, Bot } from "lucide-react";
import ConfidenceQuiz from "@/components/ConfidenceQuiz";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export default function DuelPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;
    const { userName } = useAuth();
    
    const [pack, setPack] = useState<any>(null);
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem(`bodh_prefs_${userName}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setDisplayName(parsed.displayName || userName || "");
            } catch (e) {
                setDisplayName(userName || "");
            }
        } else {
            setDisplayName(userName || "");
        }
    }, [userName]);

    const fetchDuelData = async () => {
        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;

            // Fetch Pack
            const packRes = await fetch(`${cleanUrl}/api/packs/${code}`);
            if (!packRes.ok) throw new Error("Duel pack not found.");
            const packData = await packRes.ok ? await packRes.json() : null;
            setPack(packData);

            // Fetch Results
            const resRes = await fetch(`${cleanUrl}/api/duel/${code}/results`);
            if (resRes.ok) {
                const resData = await resRes.json();
                setResults(resData);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (code) fetchDuelData();
    }, [code]);

    const handleFinish = async (score: number, total: number) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const cleanUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;

            const studentName = displayName || userName || "Anonymous Scholar";

            await fetch(`${cleanUrl}/api/duel/${code}/result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: studentName,
                    score,
                    total
                })
            });

            // Re-fetch rankings
            const resRes = await fetch(`${cleanUrl}/api/duel/${code}/results`);
            if (resRes.ok) {
                const resData = await resRes.json();
                setResults(resData);
            }
        } catch (e) {
            console.error("Failed to save duel result", e);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center">
                <div className="animate-pulse text-violet-400 font-mono tracking-widest text-xs uppercase">Initialising Duel Arena...</div>
            </div>
        );
    }

    if (error || !pack) {
        return (
            <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center p-6 text-center">
                <ShieldCheck size={64} className="text-red-500/20 mb-6" />
                <h1 className="text-2xl font-playfair italic text-white mb-2">Duel Expired or Invalid</h1>
                <p className="text-stone-500 max-w-sm mb-8">This 1v1 challenge link might be broken or the study pack was removed.</p>
                <button onClick={() => router.push('/dashboard')} className="btn-metallic text-xs uppercase font-bold tracking-widest px-8">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060606] text-white selection:bg-violet-500/30">
            <Navbar />
            
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
                        <div>
                            <div className="flex items-center gap-3 text-violet-400 mb-3">
                                <Trophy size={20} />
                                <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Quick Duel Arena</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-playfair italic text-white/90">Challenge Accepted.</h1>
                            <p className="text-stone-500 mt-2 text-sm">Attempting: <span className="text-violet-300 italic">{pack.summary[0]?.topic || "Mixed Topics"}</span></p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-stone-600 uppercase font-bold tracking-widest">Entering as</p>
                                <p className="text-sm font-medium text-white/70 italic">{displayName || "Anonymous Scholar"}</p>
                            </div>
                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="p-3 rounded-full bg-white/5 border border-white/5 text-stone-400 hover:text-white hover:bg-white/10 transition-all"
                                title="Exit to Dashboard"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8 lg:gap-12">
                        {/* Quiz Section */}
                        <div className="col-span-12 lg:col-span-8">
                            <ConfidenceQuiz 
                                quiz={pack.quiz}
                                onRetry={() => {}} // No-op in duel mode maybe? or just refresh
                                onComplete={() => {}}
                                onFinishDuel={handleFinish}
                                duelResults={results}
                                shareCode={code}
                            />
                        </div>

                        {/* Leaderboard Sidebar */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <div className="dash-card bg-indigo-600/5 border-indigo-500/10 p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <Users size={16} />
                                    </div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-200">Arena Ranking</h3>
                                </div>

                                <div className="space-y-3">
                                    {results.length === 0 ? (
                                        <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                                            <p className="text-[10px] text-stone-600 uppercase tracking-widest">No Warriors Yet</p>
                                        </div>
                                    ) : (
                                        results
                                            .sort((a, b) => b.score - a.score)
                                            .map((res, i) => (
                                                <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${res.user === displayName ? 'bg-violet-600/10 border-violet-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-mono ${i === 0 ? 'text-yellow-500' : 'text-stone-600'}`}>#{i+1}</span>
                                                        <div>
                                                            <p className="text-xs font-medium text-white/80">{res.user}</p>
                                                            <p className="text-[9px] text-stone-600">{new Date(res.timestamp).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-indigo-400">{res.score}<span className="text-[10px] text-stone-700 font-normal">/{res.total}</span></p>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>

                            <div className="dash-card p-6 border-white/5 bg-white/[0.01]">
                                <div className="flex items-center gap-3 text-stone-500 mb-4">
                                    <Bot size={16} className="text-indigo-500/50" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Bodhik says:</span>
                                </div>
                                <p className="text-xs text-stone-500 leading-relaxed italic italic">"Knowledge is the only wealth that increases when shared. Compete fairly, learn deeply."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
