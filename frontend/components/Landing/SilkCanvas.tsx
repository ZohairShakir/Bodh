"use client";

import React, { useEffect, useRef } from 'react';

const SilkCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;

        let w = c.width = c.offsetWidth;
        let h = c.height = c.offsetHeight;

        interface Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            r: number;
        }

        const particles: Particle[] = [];
        const maxDist = 180;
        let mouse: { x: number | null; y: number | null; radius: number } = { x: null, y: null, radius: 220 };

        const handleResize = () => {
            w = c.width = c.offsetWidth;
            h = c.height = c.offsetHeight;
            initParticles();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        const hero = document.getElementById('hero');
        if (hero) hero.addEventListener('mouseleave', handleMouseLeave);

        function initParticles() {
            particles.length = 0;
            const count = Math.min(Math.floor((w * h) / 9000), 160);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.75,
                    vy: (Math.random() - 0.5) * 0.75,
                    r: Math.random() * 1.5 + 0.8
                });
            }
        }

        initParticles();

        let animationFrame: number;
        function frame() {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.55;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(180, 170, 255, ${alpha})`;
                        ctx.lineWidth = 0.9;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            if (mouse.x != null && mouse.y != null) {
                for (let i = 0; i < particles.length; i++) {
                    const dx = mouse.x - particles[i].x;
                    const dy = mouse.y - particles[i].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        particles[i].x -= (dx / dist) * force * 1.5;
                        particles[i].y -= (dy / dist) * force * 1.5;
                        const alpha = (1 - dist / mouse.radius) * 0.65;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(180, 170, 255, ${alpha})`;
                        ctx.lineWidth = 1.2;
                        ctx.moveTo(mouse.x, mouse.y);
                        ctx.lineTo(particles[i].x, particles[i].y);
                        ctx.stroke();
                    }
                }
            }

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                ctx.shadowBlur = 12;
                ctx.shadowColor = 'rgba(108, 99, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(108, 99, 255, 0.35)';
                ctx.fill();
            }
            animationFrame = requestAnimationFrame(frame);
        }

        frame();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (hero) hero.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    return <canvas id="silkCanvas" ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.65, pointerEvents: 'none' }}></canvas>;
};

export default SilkCanvas;
