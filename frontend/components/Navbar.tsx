"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, ArrowUpRight } from 'lucide-react';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isLoggedIn, logout } = useAuth();
    const pathname = usePathname();

    // Close menu when route changes or window is resized
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navLinks = [
        { name: 'Home', href: '#hero' },
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how' },
        { name: 'About', href: '#difference' },
    ];

    return (
        <>
            <header className="main-header">
                <Link href="/" className="top-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" />
                    </svg>
                </Link>
                
                <nav>
                    <ul className="nav-links">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <a href={link.href}>{link.name}</a>
                            </li>
                        ))}
                    </ul>

                    <Link href="/auth?mode=signup" className="nav-cta">
                        Try Bodh
                        <ArrowUpRight size={14} />
                    </Link>

                    <button 
                        className="hamburger" 
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="Open Menu"
                    >
                        <Menu size={24} />
                    </button>
                </nav>
            </header>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
                <button 
                    className="close-menu" 
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Close Menu"
                >
                    <X size={24} />
                </button>

                <ul className="mobile-menu-links">
                    {navLinks.map((link) => (
                        <li key={link.name}>
                            <a href={link.href} onClick={() => setIsMenuOpen(false)}>{link.name}</a>
                        </li>
                    ))}
                    <li className="mt-4">
                        {isLoggedIn ? (
                            <button 
                                onClick={() => { logout(); setIsMenuOpen(false); }}
                                className="text-red-400 font-medium italic text-3xl"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link href="/auth?mode=signup" onClick={() => setIsMenuOpen(false)} className="font-playfair text-4xl italic text-white/90">
                                Login
                            </Link>
                        )}
                    </li>
                </ul>
            </div>
        </>
    );
};

export default Navbar;
