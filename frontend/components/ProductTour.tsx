"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface TourStep {
    targetId: string;
    title: string;
    body: string;
    position: "top" | "bottom" | "left" | "right";
    onActivate?: () => void;
}

interface ProductTourProps {
    steps: TourStep[];
    onDone: () => void;
    active: boolean;
}

interface SpotlightState {
    rect: DOMRect;
    tooltip: React.CSSProperties;
}

const PADDING = 14;
const TOOLTIP_W = 300;
const TOOLTIP_H_EST = 220; // estimated height for clamping

export default function ProductTour({ steps, onDone, active }: ProductTourProps) {
    const [stepIdx, setStepIdx] = useState(0);
    const [spotlight, setSpotlight] = useState<SpotlightState | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const computeTooltip = (r: DOMRect, pos: TourStep["position"]): React.CSSProperties => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top = 0;
        let left = 0;

        switch (pos) {
            case "bottom":
                top = r.bottom + PADDING + 8;
                left = r.left + r.width / 2 - TOOLTIP_W / 2;
                break;
            case "top":
                top = r.top - TOOLTIP_H_EST - PADDING - 8;
                left = r.left + r.width / 2 - TOOLTIP_W / 2;
                break;
            case "right":
                top = r.top + r.height / 2 - TOOLTIP_H_EST / 2;
                left = r.right + PADDING + 8;
                break;
            case "left":
                top = r.top + r.height / 2 - TOOLTIP_H_EST / 2;
                left = r.left - TOOLTIP_W - PADDING - 8;
                break;
        }

        // Clamp inside viewport
        left = Math.max(16, Math.min(left, vw - TOOLTIP_W - 16));
        top = Math.max(16, Math.min(top, vh - TOOLTIP_H_EST - 16));

        return { top, left, position: "fixed", width: TOOLTIP_W };
    };

    const measureTarget = useCallback(() => {
        const step = steps[stepIdx];
        if (!step) return;
        const el = document.getElementById(step.targetId) || document.getElementById(`${step.targetId}-mobile`);
        if (!el) return;
        // Instant scroll to center the specific element in viewport so measurements are correct
        el.scrollIntoView({ behavior: "auto", block: "center" });
        // Give browser a micro tick to update layout before reading rect
        setTimeout(() => {
            const r = el.getBoundingClientRect();
            setSpotlight({ rect: r, tooltip: computeTooltip(r, step.position) });
        }, 10);
    }, [stepIdx, steps]);

    // On step change: run onActivate then poll for element
    useEffect(() => {
        if (!active) return;
        setSpotlight(null); // clear while navigating

        const step = steps[stepIdx];
        step?.onActivate?.();

        let attempts = 0;
        pollRef.current = setInterval(() => {
            attempts++;
            const el = document.getElementById(step?.targetId || "") || document.getElementById(`${step?.targetId || ""}-mobile`);
            if (el) {
                clearInterval(pollRef.current!);
                // Give React time to re-render the new view
                setTimeout(measureTarget, 250);
            }
            if (attempts > 40) clearInterval(pollRef.current!);
        }, 80);

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [stepIdx, active]);

    // Re-measure on resize
    useEffect(() => {
        if (!active) return;
        const handle = () => measureTarget();
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, [active, measureTarget]);

    if (!active) return null;

    const step = steps[stepIdx];
    const isLast = stepIdx === steps.length - 1;
    const r = spotlight?.rect;

    // Build the clip-path spotlight hole using viewport coords
    const buildClip = (rect: DOMRect) => {
        const t = rect.top - PADDING;
        const b = rect.bottom + PADDING;
        const l = rect.left - PADDING;
        const ri = rect.right + PADDING;
        // even-odd rule: outer rect, then inner cutout (reversed winding)
        return `polygon(
            0px 0px, 100vw 0px, 100vw 100vh, 0px 100vh, 0px 0px,
            ${l}px ${t}px, ${l}px ${b}px, ${ri}px ${b}px, ${ri}px ${t}px, ${l}px ${t}px
        )`;
    };

    return (
        <>
            {/* Transparent overlay — always present, full-screen click = dismiss */}
            <div
                className="fixed inset-0 z-[9985] transition-all duration-500"
                style={{ background: "transparent" }}
                onClick={onDone}
            />

            {/* Spotlight cutout — punches a hole over the target (now transparent, kept for structure if needed) */}
            {r && (
                <div
                    className="fixed inset-0 z-[9986] pointer-events-none transition-all duration-500"
                    style={{
                        background: "transparent",
                        clipPath: buildClip(r),
                    }}
                />
            )}

            {/* Glowing ring around target */}
            {r && (
                <div
                    className="fixed z-[9987] pointer-events-none transition-all duration-500"
                    style={{
                        top: r.top - PADDING,
                        left: r.left - PADDING,
                        width: r.width + PADDING * 2,
                        height: r.height + PADDING * 2,
                        borderRadius: 16,
                        boxShadow:
                            "0 0 0 2px rgba(139,92,246,0.85), 0 0 0 4px rgba(139,92,246,0.15), 0 0 50px rgba(139,92,246,0.25)",
                        animation: "pulse 2s ease-in-out infinite",
                    }}
                />
            )}

            {/* Loading indicator while waiting for element */}
            {!r && (
                <div className="fixed inset-0 z-[9990] flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full border-2 border-violet-500/40 border-t-violet-500 animate-spin" />
                </div>
            )}

            {/* Tooltip card — only render when we have a position */}
            {spotlight && (
                <div
                    className="z-[9995] animate-in fade-in duration-300"
                    style={spotlight.tooltip}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="rounded-[24px] p-6 border border-white/10"
                        style={{
                            background: "rgba(12,12,12,0.98)",
                            backdropFilter: "blur(30px)",
                            boxShadow:
                                "0 30px 80px rgba(0,0,0,0.95), 0 0 0 1px rgba(139,92,246,0.2)",
                        }}
                    >
                        {/* Step progress dots */}
                        <div className="flex gap-1.5 mb-4">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-[3px] rounded-full transition-all duration-500 ${
                                        i === stepIdx
                                            ? "w-6 bg-violet-500"
                                            : i < stepIdx
                                            ? "w-3 bg-violet-500/40"
                                            : "w-3 bg-white/10"
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Step counter */}
                        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-2">
                            Step {stepIdx + 1} of {steps.length}
                        </p>

                        <h3 className="font-playfair italic text-base text-white/90 mb-2 leading-tight">
                            {step.title}
                        </h3>
                        <p className="text-stone-400 text-xs leading-relaxed mb-5">
                            {step.body}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                            <button
                                onClick={onDone}
                                className="text-[9px] text-white/20 hover:text-white/50 transition-colors tracking-widest uppercase"
                            >
                                Skip Tour
                            </button>
                            <div className="flex gap-2">
                                {stepIdx > 0 && (
                                    <button
                                        onClick={() => setStepIdx((s) => s - 1)}
                                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <ChevronLeft size={13} />
                                    </button>
                                )}
                                <button
                                    onClick={() =>
                                        isLast ? onDone() : setStepIdx((s) => s + 1)
                                    }
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-200 hover:bg-violet-600/30 transition-all text-[11px] font-bold tracking-wide"
                                >
                                    {isLast ? "Done!" : "Next"}
                                    {!isLast && <ChevronRight size={11} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
