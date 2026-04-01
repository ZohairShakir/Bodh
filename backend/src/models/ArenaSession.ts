import mongoose, { Schema, Document } from 'mongoose';

export interface IArenaSession extends Document {
  code: string;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  mode: 'duel' | 'fourway';
  currentQuestionIndex: number;
  participants: Map<string, any>;
}

const ArenaSessionSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['lobby', 'countdown', 'playing', 'finished'], default: 'lobby' },
  mode: { type: String, enum: ['duel', 'fourway'], default: 'duel' },
  currentQuestionIndex: { type: Number, default: 0 },
  participants: { type: Map, of: Object, default: {} }
}, { timestamps: true });

export default mongoose.model<IArenaSession>('ArenaSession', ArenaSessionSchema);
