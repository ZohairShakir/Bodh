import mongoose, { Schema, Document } from 'mongoose';

export interface IArenaSession extends Document {
  code: string;
  status: 'lobby' | 'countdown' | 'prep' | 'playing' | 'reveal' | 'finished';
  mode: 'duel' | 'fourway';
  currentQuestionIndex: number;
  lastQuestionStartTime?: number;
  participants: Map<string, any>; // { user, avatar, isReady, score, hp, answerTime, hasAnswered, lastAnswerCorrect, totalCorrect, isWinner }
  questions: any[]; // Store MCQs directly for faster access
}

const ArenaSessionSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['lobby', 'countdown', 'prep', 'playing', 'reveal', 'finished'], default: 'lobby' },
  mode: { type: String, enum: ['duel', 'fourway'], default: 'duel' },
  currentQuestionIndex: { type: Number, default: 0 },
  lastQuestionStartTime: { type: Number },
  participants: { type: Map, of: Object, default: {} },
  questions: { type: Array, default: [] }
}, { timestamps: true });

export default mongoose.model<IArenaSession>('ArenaSession', ArenaSessionSchema);
