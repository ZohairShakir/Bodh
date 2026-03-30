import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  history: string[]; // StudyPack codes
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  history: [{ type: String, default: [] }]
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
