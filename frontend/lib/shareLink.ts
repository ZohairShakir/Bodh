export interface QuizItem {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

export const encodeQuiz = (quiz: QuizItem[]): string => {
    try {
        if (typeof window === 'undefined') return "";
        const json = JSON.stringify(quiz);
        // Base64 encoding for URL hash
        const encoded = btoa(unescape(encodeURIComponent(json)));
        const url = new URL(window.location.href);
        url.hash = `quiz=${encoded}`;
        return url.toString();
    } catch (e) {
        console.error("Encoding failed:", e);
        return window.location.href;
    }
};

export const decodeQuiz = (): QuizItem[] | null => {
    if (typeof window === 'undefined') return null;
    try {
        const hash = window.location.hash;
        if (!hash.startsWith("#quiz=")) return null;
        const encoded = hash.replace("#quiz=", "");
        const json = decodeURIComponent(escape(atob(encoded)));
        return JSON.parse(json);
    } catch (e) {
        console.error("Decoding failed:", e);
        return null;
    }
};
