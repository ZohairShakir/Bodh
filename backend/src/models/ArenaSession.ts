import mongoose, { Schema, Document } from 'mongoose';

export interface IArenaSession extends Document {
  code: string;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  currentQuestionIndex: number;
  participants: Map<string, any>;
}

const ArenaSessionSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['lobby', 'countdown', 'playing', 'finished'], default: 'lobby' },
  currentQuestionIndex: { type: Number, default: 0 },
  participants: { type: Map, of: Object, default: {} }
}, { timestamps: true });

export default mongoose.model<IArenaSession>('ArenaSession', ArenaSessionSchema);
