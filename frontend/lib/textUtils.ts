/**
 * Syllable-counting and Readability Scoring for Bodh
 */

export const countSyllables = (word: string): number => {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    const syl = word.match(/[aeiouy]{1,2}/g);
    return syl ? syl.length : 1;
};

export const calculateReadability = (text: string) => {
    if (!text || text.length < 50) return { score: 0, level: "Insufficient Content", questions: 0, topics: 0 };

    const words = text.trim().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (words.length === 0 || sentences.length === 0) return { score: 0, level: "Analysis Pending", questions: 0, topics: 0 };

    let totalSyllables = 0;
    words.forEach(w => { totalSyllables += countSyllables(w); });

    const avgSentLength = words.length / sentences.length;
    const avgSyllablesPerWord = totalSyllables / words.length;

    // Flesch-Kincaid Grade Level Formula
    const gradeLevel = (0.39 * avgSentLength) + (11.8 * avgSyllablesPerWord) - 15.59;
    
    let level = "General";
    if (gradeLevel <= 6) level = "Primary School";
    else if (gradeLevel <= 8) level = "Middle School";
    else if (gradeLevel <= 10) level = "Secondary (Class 10)";
    else if (gradeLevel <= 12) level = "Higher Secondary (Class 12)";
    else if (gradeLevel <= 16) level = "Undergraduate";
    else level = "Research / Professional";

    // Estimates
    const estimatedQuestions = Math.max(3, Math.min(15, Math.floor(words.length / 100)));
    const estimatedTopics = Math.max(2, Math.min(8, Math.floor(words.length / 250)));

    return {
        score: Math.round(gradeLevel * 10) / 10,
        level,
        questions: estimatedQuestions,
        topics: estimatedTopics
    };
};
