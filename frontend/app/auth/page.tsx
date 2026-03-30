"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shapes } from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

function AuthContent() {
    const { login, isLoggedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // Social login state — tracks which provider was clicked and shows email/name collection step
    const [socialProvider, setSocialProvider] = useState<string | null>(null);
    const [socialEmail, setSocialEmail] = useState('');
    const [socialName, setSocialName] = useState('');

    useEffect(() => {
        const modeParam = searchParams.get('mode');
        if (modeParam === 'login') setMode('login');
        if (modeParam === 'forgot') setMode('forgot');
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
        setSuccess('');
        
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/generate', '') || "http://localhost:5000/api";
            
            if (mode === 'forgot') {
                const res = await fetch(`${apiUrl}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
                setSuccess('Check your email for reset instructions!');
                return;
            }

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

    const handleSocialLogin = (provider: string) => {
        // Fallback for non-Google providers
        setError('');
        setSocialEmail(email);
        setSocialName(name);
        setSocialProvider(provider);
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError('');
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/generate', '') || "http://localhost:5000/api";
                
                const res = await fetch(`${apiUrl}/auth/social-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        provider: 'google',
                        credential: tokenResponse.access_token
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Google login failed');

                login(data.token, data.name, data.userId);
                router.push('/dashboard');
            } catch (err: any) {
                setError(err.message || 'Failed to authenticate with Google');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError("Google login failed.")
    });

    const handleSocialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!socialEmail.trim() || !socialName.trim()) {
            setError('Please enter your name and email to continue.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/generate', '') || "http://localhost:5000/api";
            // Generate a stable provider ID from email + provider (not random)
            const providerId = `${socialProvider}_${btoa(socialEmail.toLowerCase()).replace(/=/g, '')}`;
            const res = await fetch(`${apiUrl}/auth/social-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: socialEmail.trim().toLowerCase(),
                    name: socialName.trim(),
                    provider: socialProvider,
                    providerId
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Social login failed');
            login(data.token, data.name, data.userId);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || `Failed to log in with ${socialProvider}`);
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
                                {mode === 'signup' ? 'Create an account' : (mode === 'forgot' ? 'Reset Password' : 'Welcome back')}
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--silver)', lineHeight: 1.6 }}>
                                {mode === 'signup' 
                                    ? 'Access your tasks, notes, and projects anytime, anywhere.' 
                                    : (mode === 'forgot' ? 'Enter your email to receive recovery instructions.' : 'Enter your details to access your account.')}
                            </p>
                        </div>

                        {error && <div style={{ color: '#ff4d4d', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}
                        {success && <div style={{ color: '#00e676', fontSize: '12px', marginBottom: '16px' }}>{success}</div>}

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
                            
                            {mode !== 'forgot' && (
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
                            )}

                            {mode === 'login' && (
                                <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => setMode('forgot')}
                                        style={{ background: 'none', border: 'none', fontSize: '11.5px', color: 'var(--silver)', cursor: 'pointer', outline: 'none' }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="btn-submit"
                                disabled={loading}
                                style={{ width: '100%', background: 'var(--white)', color: 'var(--black)', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 500, marginTop: '8px', transition: 'all 0.25s', boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15)', opacity: loading ? 0.7 : 1, cursor: 'pointer' }}
                            >
                                {loading ? 'Processing...' : (mode === 'signup' ? 'Create account' : (mode === 'forgot' ? 'Send Recovery Email' : 'Log in'))}
                            </button>
                            
                            {mode !== 'forgot' && (
                                <>
                                    <div className="divider" style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '24px 0', color: 'rgba(255, 255, 255, 0.25)', fontSize: '11px' }}>
                                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} />
                                        <span style={{ padding: '0 14px' }}>or continue with</span>
                                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} />
                                    </div>

                                    {/* Social provider inline form */}
                                    {socialProvider ? (
                                        <form onSubmit={handleSocialSubmit} style={{ animation: 'fade-in 0.3s ease forwards' }}>
                                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
                                                <span style={{ fontSize: '11px', color: 'var(--silver)', textTransform: 'capitalize' }}>Continuing with {socialProvider}</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Your full name"
                                                value={socialName}
                                                onChange={e => setSocialName(e.target.value)}
                                                required
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--white)', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }}
                                            />
                                            <input
                                                type="email"
                                                placeholder="Your email address"
                                                value={socialEmail}
                                                onChange={e => setSocialEmail(e.target.value)}
                                                required
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--white)', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSocialProvider(null); setError(''); }}
                                                    style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: 'var(--silver)', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    style={{ flex: 2, background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                                >
                                                    {loading ? 'Connecting...' : `Continue with ${socialProvider}`}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="social-logins" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => googleLogin()}
                                                className="btn-social" 
                                                style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '50%', aspectRatio: '1/1', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', width: '56px', height: '56px' }}
                                            >
                                                <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', fill: 'var(--white)' }}>
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="form-footer" style={{ textAlign: 'center', marginTop: '26px', fontSize: '12px', color: 'var(--silver)' }}>
                                {mode === 'forgot' ? (
                                    <button 
                                        type="button" 
                                        onClick={() => setMode('login')}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}
                                    >
                                        Back to Log in
                                    </button>
                                ) : (
                                    <>
                                        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                                        {' '}
                                        <button 
                                            type="button" 
                                            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}
                                        >
                                            {mode === 'signup' ? 'Log in' : 'Register'}
                                        </button>
                                    </>
                                )}
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
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                <AuthContent />
            </GoogleOAuthProvider>
        </Suspense>
    );
}
