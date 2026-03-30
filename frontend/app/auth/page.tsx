"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shapes } from 'lucide-react';

function AuthContent() {
    const { login, isLoggedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const modeParam = searchParams.get('mode');
        if (modeParam === 'login') setMode('login');
    }, [searchParams]);

    useEffect(() => {
        if (isLoggedIn) {
            router.push('/dashboard');
        }
    }, [isLoggedIn, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/generate', '') || "http://localhost:5000/api";
            const endpoint = mode === 'signup' ? '/auth/register' : '/auth/login';
            
            const res = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name: mode === 'signup' ? name : undefined })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }
            
            login(data.token, data.name, data.userId);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100svh', // Use svh for better mobile support
            width: '100dvw',
            background: 'var(--black)',
            position: 'relative',
            overflow: 'hidden',
            padding: '20px' // Ensure some breathing room
        }}>
            {/* Ambient Background Orbs */}
            <div className="ambient-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div className="orb orb-1" style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', width: '580px', height: '280px', background: 'radial-gradient(ellipse, rgba(108, 99, 255, 0.18) 0%, transparent 70%)', top: '20%', left: '-10%', animation: 'orb-drift-auth 12s ease-in-out infinite alternate' }}></div>
                <div className="orb orb-2" style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', width: '480px', height: '240px', background: 'radial-gradient(ellipse, rgba(29, 158, 117, 0.12) 0%, transparent 70%)', bottom: '5%', right: '-5%', animation: 'orb-drift-auth 16s ease-in-out infinite alternate-reverse' }}></div>
            </div>

            {/* Auth Container */}
            <main className="auth-container relative z-10 w-full max-w-[900px] min-h-[550px] flex flex-col md:flex-row bg-[#0c0c0c]/50 backdrop-blur-2xl border border-white/10 rounded-[20px] shadow-[0_30px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden" 
                  style={{ animation: 'fade-in-up 0.8s ease forwards' }}>
                
                {/* Left Branding Panel */}
                <div className="brand-panel hidden md:flex flex-1 flex-col justify-between p-10 relative overflow-hidden border-r border-white/10" 
                     style={{ background: 'linear-gradient(145deg, rgba(239, 159, 39, 0.2) 0%, rgba(108, 99, 255, 0.15) 60%, rgba(6, 6, 6, 0.9) 100%), #0a0a0c' }}>
                    <Link href="/" className="brand-logo flex items-center gap-3 no-underline text-white z-10">
                        <div className="top-logo-auth w-11 h-11 bg-white/5 border border-white/10 rounded-full flex items-center justify-center p-2.5">
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.24 12.24a5 5 0 00-8.49-4.8 5 5 0 00-8.49 4.8 5 5 0 008.49 4.8 5 5 0 008.49-4.8z" />
                        </svg>
                        </div>
                        <span className="font-playfair italic font-bold text-2xl tracking-tight text-white/90">Bodh</span>
                    </Link>
                    <div className="brand-text z-10 mb-5">
                        <div className="text-silver text-[13px] font-normal mb-3 tracking-[0.1em] uppercase">Personal AI Hub</div>
                        <h1 className="font-playfair italic text-[38px] font-normal leading-[1.15] text-white/90">
                            Unlock clarity and dominate your studies with Bodh.
                        </h1>
                    </div>
                </div>

                {/* Right Forms Panel */}
                <div className="form-panel flex-1 md:flex-[1.2] p-7 sm:p-12 flex flex-col justify-center bg-[#0a0a0c]/70 relative">
                    <Link href="/" className="absolute top-5 sm:top-6 right-6 sm:right-8 inline-flex items-center gap-1.5 text-[11.5px] text-silver no-underline transition-colors hover:text-white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Home
                    </Link>

                    <div className="auth-view active" style={{ display: 'block', animation: 'fade-in 0.4s ease forwards' }}>
                        <div className="form-header" style={{ marginBottom: '26px' }}>
                            <div className="icon-sparkle" style={{ color: 'var(--accent)', fontSize: '24px', marginBottom: '10px', display: 'inline-block' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M4.929 4.929l14.142 14.142M4.929 19.071L19.071 4.929" />
                                </svg>
                            </div>
                            <h2 className="font-playfair italic" style={{ fontSize: '32px', fontWeight: 400, marginBottom: '8px', color: 'var(--white)' }}>
                                {mode === 'signup' ? 'Create an account' : 'Welcome back'}
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--silver)', lineHeight: 1.6 }}>
                                {mode === 'signup' 
                                    ? 'Access your tasks, notes, and projects anytime, anywhere.' 
                                    : 'Enter your details to access your account.'}
                            </p>
                        </div>

                        {error && <div style={{ color: '#ff4d4d', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}

                        <form onSubmit={handleSubmit}>
                            {mode === 'signup' && (
                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: 'var(--silver)', marginBottom: '6px' }}>Full name</label>
                                    <div className="input-wrapper" style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            style={{ width: '100%', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '12px 14px', fontSize: '13.5px', color: 'var(--white)', outline: 'none' }}
                                            placeholder="Zohai" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="form-group" style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: 'var(--silver)', marginBottom: '6px' }}>Your email</label>
                                <div className="input-wrapper" style={{ position: 'relative' }}>
                                    <input 
                                        type="email" 
                                        className="form-input" 
                                        style={{ width: '100%', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '12px 14px', fontSize: '13.5px', color: 'var(--white)', outline: 'none' }}
                                        placeholder="topper@university.in" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: 'var(--silver)', marginBottom: '6px' }}>
                                    {mode === 'signup' ? 'Create password' : 'Password'}
                                </label>
                                <div className="input-wrapper" style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        className="form-input" 
                                        style={{ width: '100%', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '12px 14px', fontSize: '13.5px', color: 'var(--white)', outline: 'none' }}
                                        placeholder="••••••••••••" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        className="eye-toggle" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--silver)', padding: '4px', cursor: 'pointer' }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {mode === 'login' && (
                                <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                                    <a href="#" style={{ fontSize: '11.5px', color: 'var(--silver)', textDecoration: 'none' }}>Forgot password?</a>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="btn-submit"
                                disabled={loading}
                                style={{ width: '100%', background: 'var(--white)', color: 'var(--black)', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 500, marginTop: '8px', transition: 'all 0.25s', boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15)', opacity: loading ? 0.7 : 1, cursor: 'pointer' }}
                            >
                                {loading ? 'Processing...' : (mode === 'signup' ? 'Create account' : 'Log in')}
                            </button>
                            
                            <div className="divider" style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '24px 0', color: 'rgba(255, 255, 255, 0.25)', fontSize: '11px' }}>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} />
                                <span style={{ padding: '0 14px' }}>or continue with</span>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} />
                            </div>

                            <div className="social-logins" style={{ display: 'flex', gap: '12px' }}>
                                {['google', 'github', 'apple'].map(provider => (
                                    <button key={provider} type="button" className="btn-social" style={{ cursor: 'pointer', flex: 1, background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}>
                                        <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'var(--white)' }}>
                                            {provider === 'google' && <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>}
                                            {provider === 'github' && <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />}
                                            {provider === 'apple' && <path d="M16.345 13.929c-.015 3.091 2.527 4.06 2.551 4.07-.024.081-.397 1.365-1.298 2.684-.78 1.139-1.595 2.274-2.86 2.298-1.242.023-1.644-.73-3.072-.73-1.428 0-1.874.707-3.093.754-1.266.046-2.19-1.206-2.973-2.34-1.602-2.31-2.825-6.521-1.192-9.35 .807-1.393 2.254-2.277 3.82-2.298 1.22-.023 2.378.82 3.123.82.742 0 2.144-.99 3.593-.843  1.52.174 2.894.614 3.733 1.84 -3.122 1.873 -2.628 6.307 .668 7.095zM15.42 4.144c.677-.82 1.133-1.956 1.008-3.091-1.002.04-2.164.667-2.861 1.488-.553.649-1.097 1.802-.953 2.913 1.116.086 2.13-.589 2.806-1.31z" />}
                                        </svg>
                                    </button>
                                ))}
                            </div>

                            <div className="form-footer" style={{ textAlign: 'center', marginTop: '26px', fontSize: '12px', color: 'var(--silver)' }}>
                                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                                {' '}
                                <button 
                                    type="button" 
                                    onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}
                                >
                                    {mode === 'signup' ? 'Log in' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans text-sm tracking-widest uppercase">
                Loading Secure Vault...
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}
