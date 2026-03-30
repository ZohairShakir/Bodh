"use client";

import React, { useEffect, useState } from "react";
import { AuthProvider } from "@/context/AuthContext";

/**
 * ClientWrapper handles all logic and UI that depends on browser APIs (window, document).
 * This prevents hydration mismatches and allows the root layout to remain a Server Component.
 */
export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // --- GLOBAL CURSOR LOGIC ---
        const cur = document.getElementById('cur');
        const curR = document.getElementById('curR');
        let mx = 0, my = 0, rx = 0, ry = 0;
        
        const handleMouseMove = (e: MouseEvent) => {
            mx = e.clientX; 
            my = e.clientY;
            if (cur) {
                cur.style.left = mx + 'px'; 
                cur.style.top = my + 'px';
            }
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        
        let cursorTicking = true;
        const tick = () => {
            if (!cursorTicking) return;
            rx += (mx - rx) * 0.1; 
            ry += (my - ry) * 0.1;
            if (curR) {
                curR.style.left = rx + 'px'; 
                curR.style.top = ry + 'px';
            }
            requestAnimationFrame(tick);
        };
        tick();

        const handleMouseEnter = () => { 
            if(curR) { 
                curR.style.width = '48px'; 
                curR.style.height = '48px'; 
                curR.style.borderColor = 'rgba(255,255,255,.52)'; 
            } 
        };
        const handleMouseLeave = () => { 
            if(curR) { 
                curR.style.width = '32px'; 
                curR.style.height = '32px'; 
                curR.style.borderColor = 'rgba(255,255,255,.35)'; 
            } 
        };

        const attachCursorListeners = () => {
            document.querySelectorAll('a, button, input, textarea, .btn-hover').forEach(el => {
                el.addEventListener('mouseenter', handleMouseEnter);
                el.addEventListener('mouseleave', handleMouseLeave);
            });
        };
        attachCursorListeners();

        // Mutatation observer handles dynamic content (important for Next.js routing)
        const observer = new MutationObserver(() => {
            attachCursorListeners();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            cursorTicking = false;
            document.removeEventListener('mousemove', handleMouseMove);
            observer.disconnect();
        };
    }, []);

    // Render children initially but keep cursor elements hidden until hydration
    return (
        <AuthProvider>
            <div 
                className="cursor" 
                id="cur" 
                style={{ opacity: isMounted ? 1 : 0 }}
            ></div>
            <div 
                className="cursor-ring" 
                id="curR" 
                style={{ opacity: isMounted ? 0.6 : 0, width: '32px', height: '32px' }}
            ></div>
            {children}
        </AuthProvider>
    );
}
