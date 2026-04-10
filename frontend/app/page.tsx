"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SilkCanvas from '@/components/Landing/SilkCanvas';

export default function LandingPage() {
    useEffect(() => {
        // --- REVEAL ON SCROLL ---
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); });
        }, { threshold: .08, rootMargin: '0px 0px -28px 0px' });
        
        document.querySelectorAll('.r').forEach(el => io.observe(el));

        // --- COUNT UP STATS ---
        function doCount(el: HTMLElement) {
            const target = + (el.dataset.t || 0);
            const suffix = el.dataset.s || '';
            const divisor = el.dataset.div ? +el.dataset.div : 1;
            let current = 0; 
            const fps = 60, duration = 1800, increment = target / (duration / (1000 / fps));
            const timer = setInterval(() => {
                current += increment; 
                if (current >= target) { 
                    current = target; 
                    clearInterval(timer); 
                }
                el.textContent = (divisor > 1 ? (current / divisor).toFixed(1) : Math.floor(current)) + suffix;
            }, 1000 / fps);
        }
        
        const sio = new IntersectionObserver(entries => {
            entries.forEach(e => { 
                if (e.isIntersecting) { 
                    document.querySelectorAll('[data-t]').forEach(el => doCount(el as HTMLElement)); 
                    sio.disconnect(); 
                } 
            });
        }, { threshold: .22 });
        
        const statsEl = document.getElementById('stats');
        if (statsEl) sio.observe(statsEl);

        // --- HERO PARTICLES ---
        const hpc = document.getElementById('hp');
        if (hpc) {
            hpc.innerHTML = ''; 
            for (let i = 0; i < 38; i++) {
                const p = document.createElement('div'); 
                p.className = 'p';
                const big = Math.random() > .65;
                p.style.cssText = `
                    --x:${8 + Math.random() * 84}%;
                    --y:${52 + Math.random() * 42}%;
                    --d:${5.5 + Math.random() * 10}s;
                    --dl:-${Math.random() * 14}s;
                    --sx:${(Math.random() - .5) * 28}px;
                    ${big ? 'background:rgba(255,252,230,.65);width:1px;height:1px;' : ''}
                `;
                hpc.appendChild(p);
            }
        }

        return () => {
            io.disconnect();
            sio.disconnect();
        };
    }, []);

    return (
        <div id="bodh-landing">
            <Navbar />

            <section id="hero">
                <SilkCanvas />
                <video autoPlay muted loop playsInline>
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay"></div>
                <div className="hero-nature"></div>
                <div className="hero-particles" id="hp"></div>

                <div className="hero-content">
                    <div className="hero-badge r">
                        <span className="badge-pill">New</span>
                        Introducing AI-powered study tools for Indian students.
                    </div>
                    <h1 className="hero-title r d1">Turn any chapter into a live quiz battle</h1>
                    <p className="hero-sub r d2">Challenge your friends in real time. Create custom arenas from any topic and see who earns the ultimate clarity.<br />Fast. Fun. No login required.</p>
                    <div className="hero-actions r d3">
                        <Link href="/dashboard" className="btn-outline">
                            Start Battle Arena
                            <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                                <path d="M1 10L10 1M10 1H3M10 1V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <a href="#how" className="btn-play-clean">
                            <svg width="10" height="11" viewBox="0 0 10 11" fill="none">
                                <path d="M1 1.5L9 5.5L1 9.5V1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                            </svg>
                            See How It Works
                        </a>
                    </div>
                </div>

                <div className="hero-logos-wrapper">
                    <div className="hero-logos-badge">Personalized for subjects like</div>
                    <div className="hero-logos">
                        <span>Physics (Class 12)</span>
                        <span>Maths (Boards)</span>
                        <span>Chemistry (NCERT)</span>
                        <span>Biology (Class 11)</span>
                        <span>English Literature</span>
                    </div>
                </div>
            </section>

            <section id="how">
                <video autoPlay muted loop playsInline>
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-ink-animation-in-slow-motion-9-large.mp4" type="video/mp4" />
                </video>
                <div className="how-overlay"></div>
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <div className="how-svg">
                    <svg viewBox="0 0 1400 600" preserveAspectRatio="xMidYMid slice" fill="none">
                        <path className="flow-line" d="M-200,300 C100,218 300,382 620,298 S930,175 1230,298 S1530,400 1700,300" stroke="rgba(108, 99, 255, 0.32)" strokeWidth="1.2" style={{ "--fd": "8s" } as any} />
                        <path className="flow-line" d="M-200,322 C200,242 420,392 730,308 S1040,182 1340,308" stroke="rgba(29, 158, 117, 0.20)" strokeWidth="0.9" style={{ "--fd": "11s" } as any} />
                        <path className="flow-line" d="M-200,278 C150,198 360,368 680,288 S990,162 1280,288" stroke="rgba(239, 159, 39, 0.14)" strokeWidth="0.7" style={{ "--fd": "13s" } as any} />
                    </svg>
                </div>
                <div className="how-inner">
                    <div className="s-badge r">Personal Path</div>
                    <h2 className="s-title r d1">A faster way to clash.</h2>
                    <p className="s-sub r d2">Enter any topic or paste your notes to instantly generate a competitive arena. Share the room code with friends and battle it out in a real-time leaderboard duel. No distractions, just high-speed academic competition.</p>
                    <Link href="/dashboard" className="btn-outline r d3">
                        Create Your Arena
                        <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                            <path d="M1 10L10 1M10 1H3M10 1V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>
            </section>

            <section id="features">
                <div className="feat-header">
                    <div className="s-badge r">Capabilities</div>
                    <h2 className="s-title r d1">Pro features. Zero complexity.</h2>
                </div>
                <div className="feat-grid">
                    <div className="feat-card r">
                        <div className="feat-text">
                            <h3>Instant Arena Creation.</h3>
                            <p>Bodh turns any text into a competitive playground. Whether it's a complex biology chapter or a history lecture, get 15 high-quality MCQs in seconds and invite your group to a live duel.</p>
                            <Link href="/dashboard" className="btn-outline">
                                Start a Battle
                            </Link>
                        </div>
                        <div className="feat-vis">
                            <div className="mock-ui-box">
                                <div className="mock-header">
                                    <div className="mock-circle" />
                                    <div className="mock-title">Battle Arena</div>
                                </div>
                                <div className="mock-body">
                                    <div className="mock-tag-row">
                                        <div className="mock-tag bg-violet-500/20 text-violet-300">Live Duel</div>
                                        <div className="mock-tag bg-blue-500/20 text-blue-300">#BK-42</div>
                                    </div>
                                    <div className="mock-stat-card">
                                        <div className="mock-label">Winner Rank</div>
                                        <div className="mock-value">Aarav Mehta - 850 pts</div>
                                    </div>
                                    <div className="mock-bar-container">
                                        <div className="mock-bar-inner bg-violet-500" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="feat-card r feat-card-rev">
                        <div className="feat-vis">
                             <div className="mock-ui-box">
                                <div className="mock-header" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                    <div className="mock-circle" style={{ background: '#10b981' }} />
                                    <div className="mock-title" style={{ color: '#10b981' }}>Live Leaderboard</div>
                                </div>
                                <div className="mock-body">
                                    <div className="mock-book-row">
                                        <div className="mock-book bg-emerald-500/10 border-emerald-500/20">Ishe: 120</div>
                                        <div className="mock-book bg-emerald-500/10 border-emerald-500/20">Rohan: 110</div>
                                    </div>
                                    <div className="mock-book-row">
                                        <div className="mock-book bg-emerald-500/10 border-emerald-500/20">Sneha: 95</div>
                                        <div className="mock-book bg-emerald-500/10 border-emerald-500/20">You: 105</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="feat-text">
                            <h3>Real-Time Global Interaction.</h3>
                            <p>No more studying in isolation. See who is answering fastest, track your rank after every question, and share your victory cards with one click. Speed is just as important as accuracy.</p>
                            <Link href="/dashboard" className="btn-outline">
                                Join a Room
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section id="difference">
                <div className="feat-header">
                    <div className="s-badge r">The Difference</div>
                    <h2 className="s-title r d1">Why choose Bodh?</h2>
                </div>
                <div className="diff-wrap">
                    <div className="diff-card r">
                        <div className="diff-icon-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        </div>
                        <h4>Instant Quiz Generation</h4>
                        <p>Our AI analyzes any text and generates 10–15 competitive MCQs in under 10 seconds.</p>
                    </div>
                    <div className="diff-card r d1">
                        <div className="diff-icon-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <h4>Multiplayer Duels</h4>
                        <p>Compete in 1v1 or 4-player lobbies. Real-time sync ensures everyone sees the same question.</p>
                    </div>
                    <div className="diff-card r d2">
                        <div className="diff-icon-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V5A2.5 2.5 0 0 1 6.5 2.5H20" /></svg>
                        </div>
                        <h4>Live Leaderboards</h4>
                        <p>Watch your rank climb in real time. Speed bonuses reward the fastest accurate solvers.</p>
                    </div>
                    <div className="diff-card r d3">
                        <div className="diff-icon-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.5 4 6.5 2 2 3 3.5 3 5.5a6.5 6.5 0 1 1-13 0z" /></svg>
                        </div>
                        <h4>No Friction</h4>
                        <p>No login required to join a battle. Just enter your name, pick an avatar, and start clashing.</p>
                    </div>
                </div>
            </section>

            <section id="stats">
                <div className="stats-glow"></div>
                <div className="stats-row r">
                    <div className="stat">
                        <div className="stat-n" data-t="12400" data-s="+">0</div>
                        <div className="stat-l">TOPICS ANALYZED</div>
                    </div>
                    <div className="stat">
                        <div className="stat-n" data-t="98" data-s="%" data-div="1">0</div>
                        <div className="stat-l">ACCURACY RATE</div>
                    </div>
                    <div className="stat">
                        <div className="stat-n" data-t="8" data-s="s">0</div>
                        <div className="stat-l">AVG RESPONSE</div>
                    </div>
                    <div className="stat">
                        <div className="stat-n" data-t="52" data-s="+">0</div>
                        <div className="stat-l">COLLEGES ACTIVE</div>
                    </div>
                </div>
            </section>

            <section id="testi">
                <div className="feat-header">
                    <div className="s-badge r">Testimonials</div>
                    <h2 className="s-title r d1">Voices of Bodh</h2>
                </div>
                <div className="testi-row">
                    <div className="tcard r">
                        <div className="tcard-q">"Bodh saved my Physics boards. The centralized library and summary engine are literal life savers during revisions."</div>
                        <div className="tcard-author">
                            <div className="tcard-name">Aarav Mehta</div>
                            <div className="tcard-role">Class 12, CBSE</div>
                        </div>
                    </div>
                    <div className="tcard r d1">
                        <div className="tcard-q">"The quiz generation for NCERT chapters is magic. I can test my knowledge of any chapter in under 10 seconds."</div>
                        <div className="tcard-author">
                            <div className="tcard-name">Isha Sharma</div>
                            <div className="tcard-role">Class 10, ICSE</div>
                        </div>
                    </div>
                    <div className="tcard r d2">
                        <div className="tcard-q">"Instead of searching for playlists on YouTube for hours, I just check my HQ. It's the cleanest UI for students ever."</div>
                        <div className="tcard-author">
                            <div className="tcard-name">Rohan Gupta</div>
                            <div className="tcard-role">Class 11, Science Stream</div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="fcta">
                <video autoPlay muted loop playsInline>
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4" type="video/mp4" />
                </video>
                <div className="fcta-grad"></div>
                <div className="fcta-inner">
                    <h2 className="fcta-title r">Ready to clash?</h2>
                    <Link href="/dashboard" className="btn-outline r d1">
                        Create Your First Arena
                        <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                            <path d="M1 10L10 1M10 1H3M10 1V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>
            </section>

            <footer>
                <p>© 2026 Bodh AI. All rights reserved.</p>
                <div className="flinks">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="https://github.com/">Open Source</a>
                    <a href="#">Contact</a>
                </div>
            </footer>
        </div>
    );
}
