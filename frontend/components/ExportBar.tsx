"use client";

import React, { useState } from "react";
import { Download, Link as LinkIcon, Check, FileDown, Share2, Loader2 } from "lucide-react";

interface ExportBarProps {
    onDownload: () => void;
    onCopyLink: () => void;
    isVisible: boolean;
}

export default function ExportBar({ onDownload, onCopyLink, isVisible }: ExportBarProps) {
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        onCopyLink();
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        setDownloading(true);
        onDownload();
        setTimeout(() => setDownloading(false), 1500);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Desktop Sticky Bar */}
            <div className="hidden sm:block fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-1 p-1 bg-neutral-900 shadow-2xl shadow-indigo-500/10 border border-white/10 rounded-full glass animate-in slide-in-from-bottom-8 duration-700 delay-300">
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold transition-all active:scale-95 group shadow-2xl relative overflow-hidden"
                        style={{
                            borderTop: '1px solid rgba(180, 170, 255, 0.5)',
                            boxShadow: '0 0 20px rgba(108, 99, 255, 0.15), inset 0 1px 0 rgba(180,170,255,0.15)'
                        }}
                    >
                        {downloading ? (
                             <Loader2 size={14} className="animate-spin" />
                        ) : (
                             <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                        )}
                        DOWNLOAD STUDY PACK (PDF)
                    </button>
                    
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2.5 px-6 py-2.5 rounded-full hover:bg-white/5 text-stone-300 hover:text-white text-xs font-bold transition-all group"
                    >
                        {copied ? (
                             <>
                                <Check size={14} className="text-emerald-400" />
                                <span className="text-emerald-400">COPIED!</span>
                             </>
                        ) : (
                             <>
                                <LinkIcon size={14} className="group-hover:rotate-12 transition-transform" />
                                <span>COPY SHARE LINK</span>
                             </>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="sm:hidden fixed bottom-40 right-6 z-50 flex flex-col items-end gap-3 group">
                <div className={`flex flex-col items-end gap-3 transition-all duration-300 transform scale-0 origin-bottom-right group-hover:scale-100`}>
                     <button 
                        onClick={handleCopy}
                        className="w-12 h-12 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-stone-300 shadow-xl"
                    >
                        {copied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="w-12 h-12 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-stone-300 shadow-xl"
                    >
                        <Download size={18} />
                    </button>
                </div>
                <button className="w-16 h-16 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform shadow-indigo-600/30">
                    <FileDown size={28} />
                </button>
            </div>
        </>
    );
}
