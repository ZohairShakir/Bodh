"use client";

import React, { useState, useCallback } from "react";
import { Upload, X, FileText, AlertCircle, PlayCircle, Sparkles, BrainCircuit, Activity } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import { SAMPLE_NCERT_TEXT } from "@/lib/sampleData";
import { calculateReadability } from "@/lib/textUtils";

// Configure worker for pdf.js utilizing a reliable, version-pinned unpkg build
// Note: using .mjs for proper ESM worker loading in modern browsers
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InputPanelProps {
  text: string;
  setText: (text: string) => void;
  onClear: () => void;
}

export default function InputPanel({ text, setText, onClear }: InputPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const isTooLong = wordCount > 8000;
  const isNearLimit = wordCount > 6000;

  const cleanNCERTText = (rawText: string) => {
    return rawText
      .replace(/Rationalised 2023-24/gi, "")
      .replace(/CHAPTER \d+/gi, "")
      .replace(/© NCERT/gi, "")
      .replace(/not to be republished/gi, "")
      .replace(/\n\s*\d+\s*\n/g, "\n") // Page numbers
      .replace(/\s+/g, " ")
      .trim();
  };

  const checkForTables = (rawText: string) => {
    const tableRegex = /Table \d+\.\d+|(\d+\s+){5,}/g;
    return tableRegex.test(rawText);
  };

  const extractTextFromPdf = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      const charCount = fullText.trim().length;
      if (charCount < 200) {
        setError("This looks like a scanned NCERT textbook. Try copying the text from ncert.nic.in.");
      } else {
        const cleaned = cleanNCERTText(fullText);
        if (checkForTables(fullText)) {
          setError("Tables may not summarise well. Consider removing them.");
        } else {
          setError(null);
        }
        setText(cleaned);
      }
    } catch (err) {
      console.error("PDF Parse error:", err);
      setError("Failed to extract text. Please try a different file.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      extractTextFromPdf(file);
    } else if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setText(ev.target?.result as string);
        setError(null);
      };
      reader.readAsText(file);
    } else {
      setError("Please upload a .txt or .pdf file.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type === "application/pdf") extractTextFromPdf(file);
      else if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (ev) => setText(ev.target?.result as string);
        reader.readAsText(file);
      }
    }
  }, [setText]);

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div 
        className={`relative group transition-all duration-700 ${isDragging ? 'scale-[1.02]' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="absolute inset-0 bg-violet-600/5 rounded-[48px] blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
        <div className="absolute inset-0 neural-mesh opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none rounded-[48px]" />
        
        {/* Dynamic Readability & Estimation Insight Card */}
        {text.length > 50 && (
          <div className="hidden md:flex flex-wrap items-center gap-2 p-3 px-6 mb-4 rounded-2xl bg-[#0c0c0c]/40 backdrop-blur-xl border border-white/10 shadow-lg w-max ml-auto mr-auto relative z-20 animate-in fade-in slide-in-from-bottom-2 duration-700 pointer-events-none">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              <BrainCircuit size={14} />
              <span>Bodh Insight</span>
            </div>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-4 text-[11px] font-medium text-white/70">
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-400/60" />
                <span>Reading Level: <span className="text-emerald-300">{calculateReadability(text).level}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-400/60" />
                <span>Expect <span className="text-indigo-300">~{calculateReadability(text).questions} questions</span> & <span className="text-indigo-300">{calculateReadability(text).topics} topics</span></span>
              </div>
            </div>
          </div>
        )}
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your study notes, lecture excerpts, or drop a PDF here..."
          className={`w-full min-h-[420px] p-12 rounded-[48px] bg-[#0c0c0c]/30 backdrop-blur-3xl border border-white/5 transition-all outline-none resize-none custom-scrollbar
            ${isTooLong ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.1)] text-red-100/80' : 'hover:border-white/10 focus:border-violet-500/40 focus:bg-[#0c0c0c]/40' }
            placeholder:text-white/10 text-[18px] leading-[1.8] text-white/90 relative z-10`}
          style={{
            boxShadow: isTooLong ? '' : '0 40px 100px -20px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.02)',
          }}
        />



        {text && (
          <button 
            onClick={onClear}
            className="absolute top-8 right-10 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/20 hover:text-white border border-white/5 z-20 shadow-xl"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
            <button 
                onClick={() => { setText(SAMPLE_NCERT_TEXT); setError(null); }}
                className="btn-metallic group"
            >
                <div className="p-1 px-2 rounded-full border border-violet-500/20 text-violet-400 group-hover:text-white transition-all shadow-[0_0_8px_rgba(139,92,246,0.1)]">
                   <PlayCircle size={12} />
                </div>
                <span className="opacity-60 group-hover:opacity-100 transition-opacity">Try a sample</span>
            </button>

            <label className="btn-metallic group cursor-pointer">
                <div className="p-1 px-2 rounded-full border border-violet-500/20 text-violet-400 group-hover:text-white transition-all shadow-[0_0_8px_rgba(139,92,246,0.1)]">
                   <Upload size={12} />
                </div>
                <span className="opacity-60 group-hover:opacity-100 transition-opacity">Select PDF/TXT</span>
                <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
            </label>
        </div>

        <div className="flex items-center gap-6 py-2 border-l border-white/5 pl-8">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                   <FileText size={12} />
                   <span>{wordCount} Words</span>
                </div>
                {isNearLimit && !isTooLong && <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500/60 animate-pulse mt-1">Limit approaching</span>}
                {isTooLong && <span className="text-[10px] uppercase font-bold tracking-widest text-red-500/60 mt-1">Chapter too long</span>}
            </div>
            
            {error && (
                <div className="flex items-center gap-3 p-2 px-4 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] font-bold uppercase tracking-widest text-red-400 animate-in fade-in slide-in-from-right-2">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
