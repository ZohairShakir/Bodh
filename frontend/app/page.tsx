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
                    <h1 className="hero-title r d1">The Study Tool Your Exams Deserve</h1>
                    <p className="hero-sub r d2">Paste your notes. Get a summary, quiz, and glossary in seconds.<br />Built for Indian college students. No login. No friction.</p>
                    <div className="hero-actions r d3">
                        <Link href="/auth?mode=signup" className="btn-outline">
                            Try Bodh Free
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
                    <div className="hero-logos-badge">Works great for subjects like</div>
                    <div className="hero-logos">
                        <span>Data Structures</span>
                        <span>Thermodynamics</span>
                        <span>Fluid Mechanics</span>
                        <span>Signals & Systems</span>
                        <span>Machine Learning</span>
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
                    <div className="s-badge r">How It Works</div>
                    <h2 className="s-title r d1">You paste it. Bodh builds it.</h2>
                    <p className="s-sub r d2">Paste any lecture note, chapter excerpt, or PDF text — Bodh returns a structured summary, a ready-to-use MCQ quiz, and a key terms glossary. One AI call. Under 8 seconds.</p>
                    <Link href="/auth?mode=signup" className="btn-outline r d3">
                        Try It Now
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
                            <h3>Summaries that actually make sense.</h3>
                            <p>Bodh reads your notes and organises them into clean topic-by-topic bullet summaries — the way a topper would write them, not a machine.</p>
                            <a href="#" className="btn-outline">
                                View Example
                            </a>
                        </div>
                        <div className="feat-vis">
                            <div className="cube">
                                <svg viewBox="0 0 200 200" fill="none">
                                    <rect className="nb" x="40" y="40" width="120" height="120" stroke="rgba(108, 99, 255, 0.4)" strokeWidth="0.5" />
                                    <rect className="nb2" x="60" y="60" width="80" height="80" stroke="rgba(108, 99, 255, 0.2)" strokeWidth="0.5" />
                                    <circle className="pr" cx="100" cy="100" r="12" stroke="#a89fff" strokeWidth="0.5" />
                                    <circle className="pr2" cx="100" cy="100" r="18" stroke="#a89fff" strokeWidth="0.2" />
                                </svg>
                            </div>
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
                            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        </div>
                        <h4>Built for Indian Exams</h4>
                        <p>Optimized for subjects frequently taught in Indian engineering and degree colleges.</p>
                    </div>
                    <div className="diff-card r d1">
                        <div className="diff-icon-box">
                            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <h4>Privacy First</h4>
                        <p>We don't store your notes. Everything is cleaned after your session ends.</p>
                    </div>
                </div>
            </section>

            <footer className="mt-20">
                <p>© 2026 Bodh AI. All rights reserved.</p>
                <div className="flinks">
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                    <a href="https://github.com/">GitHub</a>
                </div>
            </footer>
        </div>
    );
}
