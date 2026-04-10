import re

with open("app/dashboard/page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

replacement = """                    {/* Arena View */}
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
                                        onClick={() => handleArenaCreateOrJoin('create', undefined, 'duel')}
                                        disabled={isLoading || !hasResults}
                                        className="dash-card group text-left hover:border-violet-500/30 transition-all cursor-pointer bg-white/[0.02] flex flex-col gap-6 p-8"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-all group-hover:scale-110 duration-500 shadow-xl shadow-violet-500/5">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-lg mb-1.5 group-hover:text-white transition-colors">1v1 Duel</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">
                                                {hasResults 
                                                    ? 'Challenge a friend head-to-head from your current study pack.' 
                                                    : 'Generate a study pack first to start a duel.'}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex items-center gap-2 text-violet-400 font-bold text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-1 transition-all">
                                            {hasResults ? 'Start Duel' : 'Build Pack First'} <ChevronRight size={12} />
                                        </div>
                                    </button>

                                    {/* Create 4-Way Clash Card */}
                                    <button
                                        onClick={() => handleArenaCreateOrJoin('create', undefined, 'fourway')}
                                        disabled={isLoading || !hasResults}
                                        className="dash-card group text-left hover:border-orange-500/30 transition-all cursor-pointer bg-white/[0.02] border-orange-500/10 flex flex-col gap-6 p-8"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-all group-hover:scale-110 duration-500 shadow-xl shadow-orange-500/5">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white/90 font-semibold text-lg mb-1.5 group-hover:text-white transition-colors">4-Way Clash</h3>
                                            <p className="text-stone-500 text-sm leading-relaxed">
                                                {hasResults
                                                    ? 'Host a four-player battle royale. Invite three friends to compete.'
                                                    : 'Generate a study pack first to start a clash.'}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex items-center gap-2 text-orange-400 font-bold text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-1 transition-all">
                                            {hasResults ? 'Start Clash' : 'Build Pack First'} <ChevronRight size={12} />
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
                                                    value={chatJoinInput}
                                                    onChange={(e) => setChatJoinInput(e.target.value.toUpperCase())}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && chatJoinInput.length >= 4) {
                                                            handleArenaCreateOrJoin('join', chatJoinInput);
                                                        }
                                                    }}
                                                    placeholder="CODE"
                                                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3.5 text-white font-mono text-sm outline-none focus:border-teal-500/50 transition-colors uppercase tracking-[0.3em] placeholder:tracking-widest"
                                                />
                                                <button 
                                                    onClick={() => handleArenaCreateOrJoin('join', chatJoinInput)}
                                                    disabled={isLoading || chatJoinInput.length < 4}
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
                            <div className="col-span-12 xl:col-span-5 flex flex-col gap-4 min-h-[400px]">
                                <InputPanel inputMethod={inputMethod} setInputMethod={setInputMethod} inputText={inputText} setInputText={setInputText} isLoading={isLoading} />
                                <GenerateButton onGenerate={handleGenerate} isLoading={isLoading} disabled={!inputText.trim() || isLoading} />
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
"""

pattern = re.compile(r"\{\/\* HQ View: Personlized Student Dashboard \*\/\}.*?(?=\{\/\* History View \*\/\})", re.DOTALL)
new_text = pattern.sub(replacement, text)

if new_text != text:
    with open("app/dashboard/page.tsx", "w", encoding="utf-8") as f:
        f.write(new_text)
    print("SUCCESS: Replaced stale views with Arena and Create views.")
else:
    print("ERROR: Regex pattern not found.")
