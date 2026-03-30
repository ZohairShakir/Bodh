import LZString from 'lz-string';

export interface QuizItem {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

export interface ShareData {
    s: any[]; // summary
    q: QuizItem[]; // quiz
    k: any[]; // keyTerms
}

/**
 * Encodes the entire study pack into a compressed Base64-style hash
 */
export const encodeStudyPack = (summary: any[], quiz: QuizItem[], keyTerms: any[]): string => {
    try {
        if (typeof window === 'undefined') return "";
        
        const data: ShareData = { s: summary, q: quiz, k: keyTerms };
        const json = JSON.stringify(data);
        
        // Use LZString for high-ratio compression before encoding for URL
        const compressed = LZString.compressToEncodedURIComponent(json);
        
        const url = new URL(window.location.origin + window.location.pathname);
        url.hash = `share=${compressed}`;
        return url.toString();
    } catch (e) {
        console.error("Encoding failed:", e);
        return typeof window !== 'undefined' ? window.location.href : "";
    }
};

/**
 * Decodes the study pack from the URL hash
 */
export const decodeStudyPack = (): ShareData | null => {
    if (typeof window === 'undefined') return null;
    try {
        const hash = window.location.hash;
        if (!hash.startsWith("#share=")) return null;
        
        const compressed = hash.replace("#share=", "");
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        
        if (!json) return null;
        return JSON.parse(json);
    } catch (e) {
        console.error("Decoding failed:", e);
        return null;
    }
};
