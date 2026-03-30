import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  packId: string;
  user: string;
  message: string;
  timestamp: Date;
}

const ChatMessageSchema: Schema = new Schema({
  packId: { type: String, required: true },
  user: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
