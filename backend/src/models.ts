import mongoose from 'mongoose';

// USER MODEL
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String }
}, { timestamps: true });

export const UserModel = mongoose.model('User', userSchema);

// STUDY PACK MODEL
const studyPackSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    userId: { type: String, index: true }, // Not using ref for simple flat search
    content: {
        summary: [{ topic: String, bullets: [String] }],
        quiz: [{ question: String, options: [String], correct_index: Number, explanation: String }],
        key_terms: [{ term: String, definition: String }]
    }
}, { timestamps: true });

export const StudyPackModel = mongoose.model('StudyPack', studyPackSchema);

// CHAT MESSAGE MODEL
const chatMessageSchema = new mongoose.Schema({
    packId: { type: String, required: true, index: true },
    user: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export const ChatMessageModel = mongoose.model('ChatMessage', chatMessageSchema);

// DUEL RESULT MODEL
const duelResultSchema = new mongoose.Schema({
    code: { type: String, required: true, index: true },
    user: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

export const DuelResultModel = mongoose.model('DuelResult', duelResultSchema);

// ARENA LOBBY MODEL (More complex nested state)
const arenaLobbySchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['lobby', 'countdown', 'playing', 'finished'], default: 'lobby' },
    currentQuestionIndex: { type: Number, default: 0 },
    participants: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const ArenaLobbyModel = mongoose.model('ArenaLobby', arenaLobbySchema);
