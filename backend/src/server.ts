import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { findUserByEmail, addUser } from './userStore';
import { StudyPackModel, ChatMessageModel, DuelResultModel, ArenaLobbyModel } from './models';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bodh_secure_jwt_secret_2026';
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
if (!MONGODB_URI) {
    console.error("CRITICAL: MONGODB_URI is missing in .env");
} else {
    // Explicitly target 'bodh_db' if not already specified in the URI
    const connectionUri = MONGODB_URI.includes(' mongodb.net/') && !MONGODB_URI.includes(' mongodb.net/bodh_db') 
        ? MONGODB_URI.replace('mongodb.net/', 'mongodb.net/bodh_db')
        : MONGODB_URI;

    mongoose.connect(connectionUri)
        .then(() => console.log("✅ Connected to MongoDB Cluster (Database: bodh_db)"))
        .catch(err => console.error("❌ MongoDB Connection Error:", err));
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "missing");

const SYSTEM_PROMPT = `
You are Bodhik, an expert study assistant for Indian college students.
Always respond with a single valid JSON object matching the schema provided.
Never include markdown, code fences, or any text outside the JSON object.
Adapt terminology and examples to be relevant to Indian academic contexts where possible.
`;

const TUTOR_SYSTEM_PROMPT = `
You are Bodhik, a friendly AI study tutor for Indian college students.
You have already analysed the student's notes and have their summary,
quiz results, and key terms available. You know which topics they 
struggled with based on their quiz performance.
 
Rules you must follow:
- Keep every response under 150 words. No exceptions.
- Answer only what was asked. Never re-summarise everything.
- Refer back to the student's specific notes when relevant.
- If entry_context.type is wrong_answer: first acknowledge what 
  they got wrong without making them feel bad, then explain why 
  their chosen answer was incorrect, then explain the correct one.
- If entry_context.type is topic_question: explain that specific 
  topic using the bullets provided as your source material.
- If entry_context.type is open: answer conversationally, 
  staying within the scope of the uploaded notes.
- Speak like a helpful senior student, not a textbook.
- Use Indian academic context and examples where relevant.
- If the student asks something outside their notes, say: 
  'That is not covered in your notes — want me to explain it 
  generally?' and wait for confirmation before answering.
`;

const USER_TEMPLATE = (text: string, difficulty: string, n: number) => `
Analyse the following study text and return a JSON object with exactly three keys:

1. "summary": array of topic objects. Each has "topic" (string) and "bullets"
   (array of 3–6 concise bullet strings). Identify 3–6 distinct topics.

2. "quiz": array of exactly ${n} MCQ objects. Each has:
   "question" (string), "options" (array of exactly 4 strings),
   "correct_index" (integer 0–3), "explanation" (1–2 sentence string).
   Difficulty: ${difficulty} (Easy=factual recall, Medium=comprehension,
   Hard=application/analysis). All 4 options must be plausible.

3. "key_terms": array of objects with "term" and "definition". Extract 5–12 key terms.

Study text:
---
${text}
---
`;

// AUTH ENDPOINTS (Refactored for async MongoDB)
app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || password.length < 6) {
            return res.status(400).json({ error: "Email and 6+ char password required." });
        }
        const existing = await findUserByEmail(email);
        if (existing) {
            return res.status(400).json({ error: "Email already registered." });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await addUser({ id: '', email, passwordHash, name });
        const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, name: newUser.name });
    } catch (err) {
        console.error("Reg Error:", err);
        res.status(500).json({ error: "Registration failed." });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, name: user.name });
    } catch (err) {
        res.status(500).json({ error: "Login failed." });
    }
});

app.post('/api/generate', async (req: Request, res: Response) => {
    try {
        const { text, difficulty, n_questions, language } = req.body;

        if (!text || text.length < 100) {
            return res.status(400).json({ error: "Please paste at least a paragraph of text." });
        }

        const prompt = USER_TEMPLATE(text, difficulty, n_questions) + (language === "Hindi" ? "\nRespond in Hindi." : "");

        let retryCount = 0;
        let responseJson = null;

        const generateWithOpenAI = async (extraInstruction = "") => {
            const result = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt + extraInstruction }
                ],
                response_format: { type: "json_object" }
            });
            return JSON.parse(result.choices[0].message.content || "{}");
        };

        const generateWithGemini = async () => {
            console.log("Attempting Gemini generation with model: gemini-2.5-flash");
            // Standard usage for Gemini 1.5/2.x/3.x is passing systemInstruction separately
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: SYSTEM_PROMPT
            });
            const result = await model.generateContent(prompt);
            const textResponse = result.response.text();

            // Extract JSON from potentially markdown-wrapped response
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            const cleanedJson = jsonMatch ? jsonMatch[0] : textResponse;

            try {
                return JSON.parse(cleanedJson);
            } catch (e) {
                console.error("Gemini JSON Parse Error. Raw response:", textResponse);
                throw new Error("Gemini returned invalid JSON");
            }
        };

        try {
            responseJson = await generateWithOpenAI();
        } catch (openaiError: any) {
            console.error("OpenAI Error Details:", {
                status: openaiError.status,
                code: openaiError.code,
                message: openaiError.message
            });

            // If Rate Limited (429) OR Internal Error (500) OR Service Unavailable (503) from OpenAI
            if (openaiError.status === 429 || openaiError.status === 500 || openaiError.status === 503 || openaiError.code === "rate_limit_exceeded") {
                console.log("Primary AI failed. Switching to backup model (Gemini)...");
                try {
                    responseJson = await generateWithGemini();
                } catch (geminiError: any) {
                    console.error("Gemini Backup Error:", geminiError.message);
                    return res.status(503).json({
                        error: "Both AI services failed. Check your API quotas and network connection.",
                        details: {
                            openai: openaiError.message,
                            gemini: geminiError.message,
                            advice: "Check if your API keys are valid and have sufficient credits."
                        }
                    });
                }
            } else if (openaiError instanceof SyntaxError && retryCount < 1) {
                retryCount++;
                responseJson = await generateWithOpenAI("\nReturn ONLY raw JSON, nothing else.");
            } else {
                return res.status(openaiError.status || 501).json({
                    error: openaiError.message || "Failed to generate study pack.",
                    details: "OpenAI rejected the request. Status: " + (openaiError.status || "Unknown")
                });
            }
        }

        return res.json(responseJson);

    } catch (error: any) {
        console.error("Backend Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error." });
    }
});

app.post('/api/generate/question', async (req: Request, res: Response) => {
    try {
        const { text, existingQuestion, difficulty } = req.body;

        if (!text || !existingQuestion) {
            return res.status(400).json({ error: "Context text and existing question are required." });
        }

        const prompt = `
            Context: ${text}
            
            Existing Question to replace: "${existingQuestion}"
            Desired Difficulty: ${difficulty || 'Medium'}
            
            Task: Generate a NEW and DIFFERENT multiple choice question from the context above. 
            Return ONLY a JSON object with: "question", "options" (4), "correct_index" (0-3), and "explanation".
        `;

        const result = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a specialized study material generator. Return only raw JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const newQuestion = JSON.parse(result.choices[0].message.content || "{}");
        res.json(newQuestion);
    } catch (error: any) {
        console.error("Regen Error:", error);
        res.status(500).json({ error: "Failed to regenerate question." });
    }
});

app.post('/api/tutor', async (req: Request, res: Response) => {
    try {
        const { context, chat_history, student_message } = req.body;

        const messages: any[] = [
            { role: "system", content: TUTOR_SYSTEM_PROMPT },
            ...(chat_history || []),
            {
                role: "user",
                content: JSON.stringify(context) + "\n\nStudent: " + student_message
            }
        ];

        let reply = "";

        try {
            const result = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                max_tokens: 300
            });
            reply = result.choices[0].message.content || "";
        } catch (openaiError: any) {
            console.error("Tutor OpenAI Error:", openaiError.message);
            console.log("Tutor switching to backup Gemini...");
            
            try {
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    systemInstruction: TUTOR_SYSTEM_PROMPT
                });
                
                // Gemini expectations: history + last message
                const history = (chat_history || []).map((m: any) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }]
                }));

                const chat = model.startChat({ history });
                const result = await chat.sendMessage(JSON.stringify(context) + "\n\nStudent: " + student_message);
                reply = result.response.text();
            } catch (geminiError: any) {
                console.error("Tutor Gemini Error:", geminiError.message);
                return res.status(503).json({ error: "Tutor services temporarily unavailable." });
            }
        }

        res.json({ reply });
    } catch (error: any) {
        console.error("Tutor General Error:", error);
        res.status(500).json({ error: "Failed to connect to Bodh Tutor." });
    }
});
// PACK & SHARING ENDPOINTS
app.post('/api/packs/share', async (req: Request, res: Response) => {
    try {
        const { pack, userId } = req.body;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await StudyPackModel.create({
            code,
            userId,
            content: pack
        });

        res.status(201).json({ code });
    } catch (err) {
        console.error("Share error:", err);
        res.status(500).json({ error: "Sharing failed." });
    }
});

app.get('/api/packs/:code', async (req: Request, res: Response) => {
    try {
        const pack = await StudyPackModel.findOne({ code: req.params.code });
        if (!pack) return res.status(404).json({ error: "Pack not found." });
        
        const packObj = pack.toObject() as any;
        res.json({ ...packObj.content, id: packObj.code, createdAt: packObj.createdAt });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve pack." });
    }
});

app.get('/api/history/:userId', async (req: Request, res: Response) => {
    try {
        const packs = await StudyPackModel.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        const history = packs.map(p => {
            const pObj = p.toObject() as any;
            return { ...pObj.content, id: pObj.code, createdAt: pObj.createdAt };
        });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch history." });
    }
});

app.delete('/api/history/:userId/:code', async (req: Request, res: Response) => {
    try {
        await StudyPackModel.deleteOne({ userId: req.params.userId, code: req.params.code });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete from history." });
    }
});

// CHAT ENDPOINTS
app.post('/api/chat', async (req: Request, res: Response) => {
    try {
        const { packId, user, message } = req.body;
        const msg = await ChatMessageModel.create({ packId, user, message });
        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: "Failed to send message." });
    }
});

app.get('/api/chat/:packId', async (req: Request, res: Response) => {
    try {
        const messages = await ChatMessageModel.find({ packId: req.params.packId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to load chat." });
    }
});

// DUEL ENDPOINTS
app.post('/api/duel/:code/result', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user, score, total } = req.body;
        const result = await DuelResultModel.create({ code, user, score, total });
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to save duel result." });
    }
});

app.get('/api/duel/:code/results', async (req: Request, res: Response) => {
    try {
        const results = await DuelResultModel.find({ code: req.params.code }).sort({ timestamp: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Failed to load duel results." });
    }
});

// ARENA LOBBY ENDPOINTS
app.post('/api/arena/:code/join', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user } = req.body;
        
        let arena = await ArenaLobbyModel.findOne({ code });
        
        if (!arena) {
            arena = await ArenaLobbyModel.create({
                code,
                participants: new Map([[user, {
                    user,
                    isReady: false,
                    score: 0,
                    hasAnswered: false,
                    lastAnswerCorrect: null
                }]])
            });
        } else {
            if (!arena.participants.has(user)) {
                arena.participants.set(user, {
                    user,
                    isReady: false,
                    score: 0,
                    hasAnswered: false,
                    lastAnswerCorrect: null
                });
                await arena.save();
            }
        }
        
        res.json(arena);
    } catch (err) {
        res.status(500).json({ error: "Failed to join arena." });
    }
});

app.post('/api/arena/:code/ready', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user, isReady } = req.body;
        
        const arena = await ArenaLobbyModel.findOne({ code });
        if (!arena || !arena.participants.has(user)) return res.status(404).json({ error: "Arena or user not found" });
        
        const p = arena.participants.get(user);
        p.isReady = isReady;
        arena.participants.set(user, p);

        const participantList: any[] = Array.from(arena.participants.values());
        const allReady = participantList.length > 0 && participantList.every(p => p.isReady);
        
        if (allReady) {
            arena.status = 'countdown';
            await arena.save();
            
            setTimeout(async () => {
                const refreshed = await ArenaLobbyModel.findOne({ code });
                if (refreshed) {
                    refreshed.status = 'playing';
                    await refreshed.save();
                }
            }, 3000);
        } else {
            arena.status = 'lobby';
            await arena.save();
        }
        
        res.json(arena);
    } catch (err) {
        res.status(500).json({ error: "Update failed." });
    }
});

app.get('/api/arena/:code/status', async (req: Request, res: Response) => {
    try {
        const arena = await ArenaLobbyModel.findOne({ code: req.params.code });
        res.json(arena || null);
    } catch (err) {
        res.status(500).json({ error: "Failed to get status." });
    }
});

app.post('/api/arena/:code/answer', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user, isCorrect } = req.body;
        
        const arena = await ArenaLobbyModel.findOne({ code });
        if (!arena || !arena.participants.has(user)) return res.status(404).json({ error: "Arena or user not found" });
        
        const p = arena.participants.get(user);
        const participantList: any[] = Array.from(arena.participants.values());
        const anyoneElseAnswered = participantList.some(op => op.user !== user && op.hasAnswered);
        
        if (!p.hasAnswered && !anyoneElseAnswered) {
            p.hasAnswered = true;
            p.lastAnswerCorrect = isCorrect;
            if (isCorrect) p.score += 1;
            arena.participants.set(user, p);
            await arena.save();
            
            setTimeout(async () => {
                const refreshed = await ArenaLobbyModel.findOne({ code });
                if (refreshed) {
                    const latestParticipants: any[] = Array.from(refreshed.participants.values());
                    latestParticipants.forEach(lp => {
                        lp.hasAnswered = false;
                        lp.lastAnswerCorrect = null;
                        refreshed.participants.set(lp.user, lp);
                    });

                    const pack = await StudyPackModel.findOne({ code });
                    const packContent = pack ? (pack.toObject() as any).content : null;
                    const totalQ = packContent?.quiz?.length || 0;
                    
                    refreshed.currentQuestionIndex += 1;
                    if (refreshed.currentQuestionIndex >= totalQ) {
                        refreshed.status = 'finished';
                    }
                    await refreshed.save();
                }
            }, 2500);
        }
        
        res.json(arena);
    } catch (err) {
        res.status(500).json({ error: "Answer submission failed." });
    }
});

app.listen(port, () => {
    console.log(`Bodh Backend listening at http://localhost:${port}`);
    console.log(`Persistence Layer: MongoDB (${MONGODB_URI ? 'Cloud' : 'Missing!'})`);
});
