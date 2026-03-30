import mongoose, { Schema, Document } from 'mongoose';

export interface IDuelResult extends Document {
  code: string;
  user: string;
  score: number;
  total: number;
  timestamp: Date;
}

const DuelResultSchema: Schema = new Schema({
  code: { type: String, required: true },
  user: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IDuelResult>('DuelResult', DuelResultSchema);
