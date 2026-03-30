import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  githubId?: string;
  appleId?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  history: string[]; // StudyPack codes
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  githubId: { type: String, sparse: true },
  appleId: { type: String, sparse: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  history: [{ type: String, default: [] }]
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
