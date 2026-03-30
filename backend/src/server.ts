import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Models
import User from './models/User';
import StudyPack from './models/StudyPack';
import ChatMessage from './models/ChatMessage';
import DuelResult from './models/DuelResult';
import ArenaSession from './models/ArenaSession';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bodh_local_secret_2024';

// Database Connection
mongoose.connect(process.env.MONGODB_URI || '')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors({
  origin: ["https://bodhik.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.options("*", cors({
  origin: ["https://bodhik.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

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

// AUTH ENDPOINTS
app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || password.length < 6) {
            return res.status(400).json({ error: "Email and 6+ char password required." });
        }
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: "Email already registered." });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({ email: email.toLowerCase(), passwordHash, name });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, name: newUser.name, userId: newUser._id });
    } catch (err) {
        res.status(500).json({ error: "Registration failed." });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, name: user.name, userId: user._id });
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
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: SYSTEM_PROMPT
            });
            const result = await model.generateContent(prompt);
            const textResponse = result.response.text();
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            const cleanedJson = jsonMatch ? jsonMatch[0] : textResponse;
            return JSON.parse(cleanedJson);
        };

        let responseJson;
        try {
            responseJson = await generateWithOpenAI();
        } catch (openaiError: any) {
            console.error("Primary AI failed, switching to backup...");
            responseJson = await generateWithGemini();
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
        const prompt = `Context: ${text}\nExisting Question: "${existingQuestion}"\nDesired Difficulty: ${difficulty || 'Medium'}\nTask: Generate a NEW and DIFFERENT question. Return JSON only.`;

        const result = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a specialized study material generator. Return only raw JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(result.choices[0].message.content || "{}"));
    } catch (error) {
        res.status(500).json({ error: "Failed to regenerate question." });
    }
});

app.post('/api/tutor', async (req: Request, res: Response) => {
    try {
        const { context, chat_history, student_message } = req.body;
        const messages: any[] = [
            { role: "system", content: TUTOR_SYSTEM_PROMPT },
            ...(chat_history || []),
            { role: "user", content: JSON.stringify(context) + "\n\nStudent: " + student_message }
        ];

        const result = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 300
        });
        res.json({ reply: result.choices[0].message.content || "" });
    } catch (error) {
        res.status(500).json({ error: "Failed to connect to Bodh Tutor." });
    }
});

// PACK & SHARING ENDPOINTS
app.post('/api/packs/share', async (req: Request, res: Response) => {
    try {
        const { pack, userId } = req.body;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const newPack = new StudyPack({
            code,
            summary: pack.summary,
            quiz: pack.quiz,
            keyTerms: pack.keyTerms
        });
        await newPack.save();

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            await User.findByIdAndUpdate(userId, { $addToSet: { history: code } });
        }

        res.status(201).json({ code });
    } catch (err) {
        res.status(500).json({ error: "Sharing failed." });
    }
});

app.get('/api/packs/:code', async (req: Request, res: Response) => {
    try {
        const pack = await StudyPack.findOne({ code: req.params.code });
        if (!pack) return res.status(404).json({ error: "Pack not found." });
        res.json(pack);
    } catch (err) {
        res.status(500).json({ error: "Fetch failed." });
    }
});

app.get('/api/history/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.json([]); // Return empty rather than 500 for compatibility
        }
        const user = await User.findById(userId);
        if (!user) return res.json([]);
        const history = await StudyPack.find({ code: { $in: user.history } }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "History fetch failed." });
    }
});

app.delete('/api/history/:userId/:code', async (req: Request, res: Response) => {
    try {
        const { userId, code } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid User ID" });
        }
        await User.findByIdAndUpdate(userId, { $pull: { history: code } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Delete failed." });
    }
});

// CHAT ENDPOINTS
app.post('/api/chat', async (req: Request, res: Response) => {
    try {
        const { packId, user, message } = req.body;
        const msg = new ChatMessage({ packId, user, message });
        await msg.save();
        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: "Chat save failed." });
    }
});

app.get('/api/chat/:packId', async (req: Request, res: Response) => {
    try {
        const messages = await ChatMessage.find({ packId: req.params.packId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Chat fetch failed." });
    }
});

// DUEL ENDPOINTS
app.post('/api/duel/:code/result', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user, score, total } = req.body;
        const result = new DuelResult({ code, user, score, total });
        await result.save();
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: "Result save failed." });
    }
});

app.get('/api/duel/:code/results', async (req: Request, res: Response) => {
    try {
        const results = await DuelResult.find({ code: req.params.code }).sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Results fetch failed." });
    }
});

// ARENA LOBBY ENDPOINTS
app.post('/api/arena/:code/join', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user } = req.body;
        
        // Find by code, but ensure we don't crash on invalid codes
        let arena = await ArenaSession.findOne({ code });
        if (!arena) {
            arena = new ArenaSession({ code, participants: new Map() });
        }
        
        if (!arena.participants || !arena.participants.has(user)) {
            arena.participants.set(user, { user, isReady: false, score: 0, hasAnswered: false, lastAnswerCorrect: null });
            arena.markModified('participants');
            await arena.save();
        }
        res.json(arena);
    } catch (err) {
        console.error("Join Arena Error:", err);
        res.status(500).json({ error: "Lobby join failed." });
    }
});

app.post('/api/arena/:code/ready', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user, isReady } = req.body;
        
        const arena = await ArenaSession.findOne({ code });
        if (!arena) return res.status(404).json({ error: "Arena not found" });
        
        const p = arena.participants.get(user);
        if (p) p.isReady = isReady;
        
        const allReady = arena.participants.size > 0 && Array.from(arena.participants.values()).every((p: any) => p.isReady);
        if (allReady) {
            arena.status = 'countdown';
            setTimeout(async () => {
                await ArenaSession.updateOne({ code }, { status: 'playing' });
            }, 3000);
        } else {
            arena.status = 'lobby';
        }
        
        await arena.save();
        res.json(arena);
    } catch (err) {
        res.status(500).json({ error: "Ready state change failed." });
    }
});

app.get('/api/arena/:code/status', async (req: Request, res: Response) => {
    try {
        const arena = await ArenaSession.findOne({ code: req.params.code });
        res.json(arena);
    } catch (err) {
        res.status(500).json({ error: "Status fetch failed." });
    }
});

app.post('/api/arena/:code/answer', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user, isCorrect } = req.body;
        const arena = await ArenaSession.findOne({ code });
        if (!arena) return res.status(404).json({ error: "Arena not found" });
        
        const p = arena.participants.get(user);
        const anyoneElseAnswered = Array.from(arena.participants.values()).some((op: any) => op.user !== user && op.hasAnswered);
        
        if (p && !p.hasAnswered && !anyoneElseAnswered) {
            p.hasAnswered = true;
            p.lastAnswerCorrect = isCorrect;
            if (isCorrect) p.score += 1;
            
            await arena.save();
            
            setTimeout(async () => {
                const refreshed = await ArenaSession.findOne({ code });
                if (refreshed) {
                    refreshed.participants.forEach((part: any) => {
                        part.hasAnswered = false;
                        part.lastAnswerCorrect = null;
                    });
                    const pack = await StudyPack.findOne({ code });
                    const totalQ = pack?.quiz?.length || 0;
                    refreshed.currentQuestionIndex += 1;
                    if (refreshed.currentQuestionIndex >= totalQ) refreshed.status = 'finished';
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
});
