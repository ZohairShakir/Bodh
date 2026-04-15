import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import JSON5 from 'json5';

// Models
import StudyPack from './models/StudyPack';
import ChatMessage from './models/ChatMessage';
import DuelResult from './models/DuelResult';
import ArenaSession from './models/ArenaSession';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

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

const extractJSONString = (raw: string) => {
    // Try to find markdown code block first
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) return match[1].trim();

    // Fallback to finding the outer braces
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        return raw.substring(firstBrace, lastBrace + 1);
    }
    return raw.trim();
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const isRetryable = error.status === 429 || error.status === 503 || error.message?.includes('503') || error.message?.includes('429');
        if (retries > 0 && isRetryable) {
            console.warn(`AI service busy. Retrying in ${delay}ms... (${retries} left)`);
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

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

app.post('/api/generate', async (req: Request, res: Response) => {
    try {
        const { text, difficulty, n_questions, language } = req.body;

        if (!text || text.length < 100) {
            return res.status(400).json({ error: "Please paste at least a paragraph of text." });
        }

        const prompt = USER_TEMPLATE(text, difficulty, n_questions) + (language === "Hindi" ? "\nRespond in Hindi." : "");

        const generateWithOpenAI = async (extraInstruction = "") => {
            const runner = async () => {
                const result = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: prompt + extraInstruction }
                    ],
                    response_format: { type: "json_object" }
                });
                const rawContent = result.choices[0].message.content || "{}";
                const content = extractJSONString(rawContent);
                try {
                    return JSON5.parse(content);
                } catch (e) {
                    console.error("OpenAI JSON Parse Error. Raw output:", rawContent);
                    throw e;
                }
            };
            return withRetry(runner);
        };

        const generateWithGemini = async () => {
            // Model priority: start with stable/fast models, fall back to less-demanded ones
            const models = [
                "gemini-2.0-flash",        // Stable GA model — primary
                "gemini-1.5-flash",         // Proven stable fallback
                "gemini-2.0-flash-lite",    // Lightweight, high availability
                "gemini-1.5-flash-8b",      // Smallest, most likely available under load
                "gemini-2.5-flash",         // Preview — only try last (503-prone under high demand)
            ];
            let lastError;

            for (const modelName of models) {
                try {
                    const runner = async () => {
                        console.log(`Attempting generation with ${modelName}...`);
                        const model = genAI.getGenerativeModel({
                            model: modelName,
                            systemInstruction: SYSTEM_PROMPT
                        });
                        const result = await model.generateContent(prompt);
                        const textResponse = result.response.text();
                        const cleanedJson = extractJSONString(textResponse);
                        try {
                            return JSON5.parse(cleanedJson);
                        } catch (e) {
                            console.error(`${modelName} JSON Parse Error. Raw output:`, textResponse);
                            throw e;
                        }
                    };
                    // 2 retries with 2s initial delay (exponential backoff) before moving to next model
                    return await withRetry(runner, 2, 2000);
                } catch (e) {
                    lastError = e;
                    console.warn(`${modelName} failed, trying next fallback...`);
                }
            }
            throw lastError;
        };

        let responseJson;
        try {
            responseJson = await generateWithOpenAI();
        } catch (openaiError: any) {
            console.error("Primary AI failed or malformed, switching to backup...");
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

        const result = await withRetry(async () => {
            return await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a specialized study material generator. Return only raw JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });
        });

        const content = extractJSONString(result.choices[0].message.content || "{}");
        res.json(JSON5.parse(content));
    } catch (error) {
        console.error("Regen Failed:", error);
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
        const { pack } = req.body;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newPack = new StudyPack({
            code,
            summary: pack.summary,
            quiz: pack.quiz,
            keyTerms: pack.keyTerms
        });
        await newPack.save();

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

// History is now handled on the frontend via localStorage
app.get('/api/history', async (req: Request, res: Response) => {
    try {
        const { codes } = req.query;
        if (!codes) return res.json([]);
        const codeArray = (codes as string).split(',');
        const history = await StudyPack.find({ code: { $in: codeArray } }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "History fetch failed." });
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
        const { user, avatar, mode } = req.body;

        // Find by code, but ensure we don't crash on invalid codes
        let arena = await ArenaSession.findOne({ code });
        if (!arena) {
            const pack = await StudyPack.findOne({ code });
            const questionsClone = pack && pack.quiz ? JSON.parse(JSON.stringify(pack.quiz)) : [];
            arena = new ArenaSession({
                code,
                participants: new Map(),
                mode: mode || 'duel',
                questions: questionsClone
            });
            arena.markModified('questions');
        } else if (!arena.questions || arena.questions.length === 0) {
            const pack = await StudyPack.findOne({ code });
            const questionsClone = pack && pack.quiz ? JSON.parse(JSON.stringify(pack.quiz)) : [];
            arena.questions = questionsClone;
            arena.markModified('questions');
        }

        const participantKey = user || "Anonymous";
        if (!arena.participants || !arena.participants.has(participantKey)) {
            arena.participants.set(participantKey, {
                user: participantKey,
                avatar: avatar || 'A1',
                isReady: false,
                score: 0,
                hp: 100,
                totalCorrect: 0,
                hasAnswered: false,
                lastAnswerCorrect: null
            });
            arena.markModified('participants');
            arena.markModified('questions');
            await arena.save();
        } else if (avatar) {
            // Update avatar if provided and player already exists
            const p = arena.participants.get(participantKey);
            p.avatar = avatar;
            arena.markModified('participants');
            arena.markModified('questions');
            await arena.save();
        }
        res.json(arena);
    } catch (err) {
        console.error("Join Arena Error:", err);
        res.status(500).json({ error: "Failed to join arena" });
    }
});

const arenaTimers = new Map<string, NodeJS.Timeout>();
const resolvingRounds = new Map<string, boolean>();

const resolveRound = async (code: string) => {
    if (resolvingRounds.get(code)) return;
    resolvingRounds.set(code, true);

    try {
        const arena = await ArenaSession.findOne({ code });
        if (!arena || arena.status !== 'playing') return; // already resolved
        
        // clear timer just in case it was called manually
        const timer = arenaTimers.get(code);
        if (timer) clearTimeout(timer);
        arenaTimers.delete(code);

        const allParticipants = Array.from(arena.participants.values()) as any[];
        
        // Correct players sorted by answerTime
        const correctPlayers = allParticipants.filter(p => p.hasAnswered && p.lastAnswerCorrect);
        correctPlayers.sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0));

        if (arena.mode === 'duel') {
            const fastest = correctPlayers[0];
            const second = correctPlayers[1];

            for (const p of allParticipants) {
                if (p.hasAnswered && p.lastAnswerCorrect) {
                    const isFastest = fastest && fastest.user === p.user;
                    const points = isFastest ? 150 : 120;
                    const dmg = isFastest ? 35 : 25;
                    p.score += points;
                    p.totalCorrect = (p.totalCorrect || 0) + 1;

                    // Apply damage to opponent
                    const opponent = allParticipants.find(x => x.user !== p.user);
                    if (opponent) {
                        const oppObj = arena.participants.get(opponent.user);
                        oppObj.hp = Math.max(0, oppObj.hp - dmg);
                    }
                }
            }
        } else {
            const pointsArray = [150, 130, 110, 100];
            for (let i = 0; i < correctPlayers.length; i++) {
                const p = correctPlayers[i];
                const pObj = arena.participants.get(p.user);
                pObj.score += pointsArray[i] || 100;
                pObj.totalCorrect = (pObj.totalCorrect || 0) + 1;
            }
        }

        // Set status to reveal
        arena.status = 'reveal';
        arena.markModified('participants');
        await arena.save();

        // 4s reveal phase, then prep or finished
        setTimeout(async () => {
            const refreshed = await ArenaSession.findOne({ code });
            if (!refreshed) return;

            let isGameOver = false;
            const totalQ = refreshed.questions?.length || 0;
            
            if (refreshed.mode === 'duel') {
                 const parts = Array.from(refreshed.participants.values()) as any[];
                 const someDead = parts.some(p => p.hp <= 0);
                 if (someDead || refreshed.currentQuestionIndex + 1 >= Math.min(3, totalQ)) {
                     isGameOver = true;
                 }
            } else {
                 if (refreshed.currentQuestionIndex + 1 >= totalQ) {
                     isGameOver = true;
                 }
            }

            if (isGameOver) {
                refreshed.status = 'finished';
                
                // Determine winner
                const parts = Array.from(refreshed.participants.values()) as any[];
                parts.sort((a, b) => b.score - a.score);
                if (parts.length > 0) {
                    const highestScore = parts[0].score;
                    parts.forEach(p => {
                        if (p.score === highestScore) p.isWinner = true;
                    });
                }
            } else {
                refreshed.status = 'prep';
                refreshed.currentQuestionIndex += 1;
                refreshed.participants.forEach((part: any) => {
                    part.hasAnswered = false;
                    part.lastAnswerCorrect = null;
                    part.answerTime = null;
                });
            }
            refreshed.markModified('participants');
            await refreshed.save();

            // Next phase after 3s if prep
            if (refreshed.status === 'prep') {
                setTimeout(async () => {
                    const playingArena = await ArenaSession.findOne({ code });
                    if (playingArena && playingArena.status === 'prep') {
                        playingArena.status = 'playing';
                        playingArena.lastQuestionStartTime = Date.now();
                        await playingArena.save();
                        
                        // Set 12.5s timer for the round
                        const t = setTimeout(() => resolveRound(code), 12500);
                        arenaTimers.set(code, t);
                    }
                }, 3000);
            }

        }, 4000);
    } catch (err) {
        console.error("Resolve round error:", err);
    } finally {
        // Only release lock after a slight buffer to prevent immediate re-entry before status strictly applies
        setTimeout(() => resolvingRounds.delete(code), 500);
    }
};

app.post('/api/arena/:code/ready', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const { user, isReady } = req.body;

        const arena = await ArenaSession.findOne({ code });
        if (!arena) return res.status(404).json({ error: "Arena not found" });

        const p = arena.participants.get(user);
        if (p) {
            p.isReady = isReady;
            arena.markModified('participants');
        }

        const minPlayers = arena.mode === 'fourway' ? 3 : 2;
        const allReady = arena.participants.size >= minPlayers && Array.from(arena.participants.values()).every((p: any) => p.isReady);
        if (allReady) {
            arena.status = 'countdown';
            await arena.save();

            setTimeout(async () => {
                const prepArena = await ArenaSession.findOneAndUpdate(
                    { code },
                    { status: 'prep' },
                    { new: true }
                );
                
                if (prepArena) {
                    setTimeout(async () => {
                        const playArena = await ArenaSession.findOneAndUpdate(
                            { code },
                            { status: 'playing', lastQuestionStartTime: Date.now() },
                            { new: true }
                        );
                        if (playArena) {
                            const t = setTimeout(() => resolveRound(code), 12500);
                            arenaTimers.set(code, t);
                        }
                    }, 3000);
                }
            }, 3000);
            return res.json(arena);
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

        // Only record if this player hasn't answered yet
        if (p && !p.hasAnswered) {
            p.hasAnswered = true;
            p.lastAnswerCorrect = isCorrect;
            p.answerTime = Date.now();

            arena.markModified('participants');
            await arena.save();

            const allParticipants = Array.from(arena.participants.values()) as any[];
            const everyoneAnswered = allParticipants.every((part: any) => part.hasAnswered);

            if (everyoneAnswered) {
                // Instantly resolve
                resolveRound(code);
            }
        }

        res.json(arena);
    } catch (err) {
        res.status(500).json({ error: "Answer submission failed." });
    }
});

// PROFILE & RESOURCES DATA
const CORE_RESOURCES: any = {
    10: [
        { category: "All Subjects", channels: ["Physics Wallah", "Magnet Brains", "LearnoHub", "Khan Academy"] },
        { category: "Maths", channels: ["Ashish4Students", "Eduhap"] },
        { category: "Science", channels: ["Eduhap", "Ashu Sir Science", "Vedantu (Abhishek Sir)"] },
        { category: "English", channels: ["Dear Sir", "ExtraClass", "Simran Sahani"] },
        { category: "SST", channels: ["Social School", "Padhle Akshay", "BKP"] }
    ],
    11: {
        Science: [
            { category: "Science (PCMB)", channels: ["Physics Wallah", "LearnoHub", "Organic Chemistry Tutor", "Cbsewise (Maths)"] },
            { category: "English", channels: ["Simran Sahani", "ExtraClass", "Appedia"] }
        ],
        Commerce: [
            { category: "Commerce", channels: ["Unacademy (Accounts/Eco)", "Magnet Brains"] },
            { category: "English", channels: ["Simran Sahani", "ExtraClass", "Appedia"] }
        ],
        Humanities: [
            { category: "Humanities", channels: ["Padhle Akshay", "Next Toppers"] },
            { category: "English", channels: ["Simran Sahani", "ExtraClass", "Appedia"] }
        ]
    },
    12: {
        Science: [
            { category: "Science (PCMB)", channels: ["Physics Wallah", "LearnoHub", "Vedantu Maths", "Biomentors", "Etoos Education", "Next Toppers"] },
            { category: "English", channels: ["Magnet Brains English", "Shipra Mishra", "Rahul Dwivedi"] }
        ],
        Commerce: [
            { category: "Commerce", channels: ["Priya Thapar (Maths)", "Unacademy Commerce"] },
            { category: "English", channels: ["Magnet Brains English", "Shipra Mishra", "Rahul Dwivedi"] }
        ],
        Humanities: [
            { category: "Humanities", channels: ["Magnet Brains", "NCERT Official"] },
            { category: "English", channels: ["Magnet Brains English", "Shipra Mishra", "Rahul Dwivedi"] }
        ]
    }
};

// Profile endpoint removed - Handled by localStorage on frontend

app.get('/api/resources/:class/:stream?', async (req: Request, res: Response) => {
    try {
        const { class: sClass, stream } = req.params;
        const cls = parseInt(sClass);
        let resources = [];

        if (cls === 10) {
            resources = CORE_RESOURCES[10];
        } else if (CORE_RESOURCES[cls]) {
            resources = CORE_RESOURCES[cls][stream || 'Science'] || CORE_RESOURCES[cls]['Science'];
        }

        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});

app.get('/api/library/:class/:subject?', async (req: Request, res: Response) => {
    // Mock library data for now
    const library = [
        { id: 'ncert-m-10', title: 'NCERT Mathematics', class: 10, subject: 'Maths', url: 'https://ncert.nic.in/textbook.php?jemh1=0-14' },
        { id: 'ncert-s-10', title: 'NCERT Science', class: 10, subject: 'Science', url: 'https://ncert.nic.in/textbook.php?jesc1=0-16' },
        { id: 'ncert-en-10', title: 'First Flight (English)', class: 10, subject: 'English', url: 'https://ncert.nic.in/textbook.php?jeff1=0-11' },
        { id: 'ncert-ss-10', title: 'India and the Contemporary World II', class: 10, subject: 'SST', url: 'https://ncert.nic.in/textbook.php?jess3=0-8' },

        { id: 'ncert-p-11', title: 'NCERT Physics Part I', class: 11, subject: 'Physics', url: 'https://ncert.nic.in/textbook.php?keph1=0-8' },
        { id: 'ncert-c-11', title: 'Chemistry Part I', class: 11, subject: 'Chemistry', url: 'https://ncert.nic.in/textbook.php?kech1=0-7' },
        { id: 'ncert-b-11', title: 'Biology Textbook', class: 11, subject: 'Biology', url: 'https://ncert.nic.in/textbook.php?kebo1=0-22' },

        { id: 'ncert-p-12', title: 'Physics Part II', class: 12, subject: 'Physics', url: 'https://ncert.nic.in/textbook.php?leph2=0-8' },
        { id: 'ncert-c-12', title: 'Chemistry Part II', class: 12, subject: 'Chemistry', url: 'https://ncert.nic.in/textbook.php?lech2=0-7' },
        { id: 'ncert-b-12', title: 'NCERT Biology', class: 12, subject: 'Biology', url: 'https://ncert.nic.in/textbook.php?lebo1=0-16' },
        { id: 'vid-p-12', title: 'Physics Class 12 One Shot', class: 12, subject: 'Video', url: 'https://www.youtube.com/results?search_query=physics+class+12+one+shot' },
        { id: 'vid-m-10', title: 'Maths Class 10 Full Revision', class: 10, subject: 'Video', url: 'https://www.youtube.com/results?search_query=maths+class+10+full+revision' },
    ];
    const filtered = library.filter(b => b.class === parseInt(req.params.class));
    res.json(filtered);
});

app.listen(port, () => {
    console.log(`Bodh Backend listening at http://localhost:${port}`);
});
