import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Topic {
    topic: string;
    bullets: string[];
}

interface QuizItem {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

interface KeyTerm {
    term: string;
    definition: string;
}

export const generateStudyPackPDF = async (
    title: string,
    summary: Topic[],
    quiz: QuizItem[],
    keyTerms: KeyTerm[],
    language: string = "English"
) => {
    const doc = new jsPDF();
    
    // Register Devanagari Font if Hindi (Using Noto Sans Devanagari subset)
    const isHindi = language === "Hindi";
    
    // If you have a base64 font, register it here
    // doc.addFileToVFS("NotoSansDevanagari.ttf", NOTO_SANS_DEVANAGARI_BASE64);
    // doc.addFont("NotoSansDevanagari.ttf", "NotoSansDevanagari", "normal");
    
    const fontPrimary = isHindi ? "Arial" : "helvetica"; // Simplified for hackathon fallback
    if (isHindi) {
        doc.setFontSize(10);
        console.warn("Hindi PDF support requires a Devanagari .ttf font. Using Arial fallback.");
    }

    const timestamp = new Date().toLocaleString();

    // 1. COVER PAGE
    doc.setFont("times", "bolditalic");
    doc.setFontSize(44);
    doc.text("Bodh", 105, 80, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(title.slice(0, 60) + (title.length > 60 ? "..." : ""), 105, 100, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated on ${timestamp}`, 105, 115, { align: "center" });
    doc.text("Bodh — AI Study Assistant", 105, 280, { align: "center" });

    // 2. SUMMARY SECTION
    doc.addPage();
    doc.setFontSize(22);
    doc.setTextColor(108, 99, 255); // Indigo
    doc.setFont(fontPrimary, "bold");
    doc.text("Study Summary", 20, 30);
    
    let y = 45;
    summary.forEach((s) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont(fontPrimary, "bold");
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(s.topic, 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont(fontPrimary, "normal");
        doc.setTextColor(80);
        s.bullets.forEach((b) => {
            const splitText = doc.splitTextToSize(`• ${b}`, 170);
            doc.text(splitText, 25, y);
            y += splitText.length * 6;
            if (y > 280) { doc.addPage(); y = 20; }
        });
        y += 5;
    });

    // 3. QUIZ SECTION
    doc.addPage();
    doc.setFontSize(22);
    doc.setTextColor(108, 99, 255);
    doc.text("Self-Assessment Quiz", 20, 30);
    y = 45;

    const sanitizeText = (str: string) => {
        if (!str) return "";
        return str
            .replace(/[“”]/g, '"')
            .replace(/[‘’`]/g, "'")
            .replace(/[–—]/g, "-")
            .replace(/•/g, "-")
            // Removes leading weird unicodes that might render as %E
            .replace(/^[%•\-]\s*/, "");
    };

    quiz.forEach((q, i) => {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        const cleanQ = sanitizeText(q.question);
        const qText = doc.splitTextToSize(`${i + 1}. ${cleanQ}`, 170);
        doc.text(qText, 20, y);
        y += qText.length * 6 + 4;

        const labels = ["A", "B", "C", "D", "E"];
        q.options.forEach((opt, oi) => {
            const isCorrect = oi === q.correct_index;
            doc.setFontSize(11);
            
            // Clean up the option text, sometimes the AI leaves 'A) ' in the string, or unicode bullets.
            const cleanOpt = sanitizeText(opt).replace(/^[A-Ea-e][\.\)]\s*/, '');
            
            if (isCorrect) {
                 doc.setFillColor(236, 253, 245); 
                 doc.rect(22, y - 5, 162, 8, 'F');
                 doc.setTextColor(5, 150, 105);
                 doc.setFont("helvetica", "bold");
                 const optText = doc.splitTextToSize(`${labels[oi]}) ${cleanOpt}  [Correct]`, 158);
                 doc.text(optText, 28, y);
                 y += optText.length * 6.5;
            } else {
                 doc.setTextColor(110);
                 doc.setFont("helvetica", "normal");
                 const optText = doc.splitTextToSize(`${labels[oi]}) ${cleanOpt}`, 158);
                 doc.text(optText, 28, y);
                 y += optText.length * 6.5;
            }
        });
        
        // Explanation hint
        if (q.explanation) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(140);
            const expText = doc.splitTextToSize(`Hint: ${sanitizeText(q.explanation)}`, 160);
            doc.text(expText, 28, y);
            y += expText.length * 5 + 6;
        }
        
        doc.setFont("helvetica", "normal");
        y += 4;
    });

    // 4. GLOSSARY SECTION
    doc.addPage();
    doc.setFontSize(22);
    doc.setTextColor(108, 99, 255);
    doc.text("Key Terms Glossary", 20, 30);

    const tableData = keyTerms.map(kt => [kt.term, kt.definition]);
    autoTable(doc, {
        startY: 40,
        head: [['Term', 'Definition']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [108, 99, 255] },
        styles: { fontSize: 10, cellPadding: 5 }
    });

    doc.save(`bodh-summary-${Date.now()}.pdf`);
};
