import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  studentClass?: number; // 10, 11, 12
  board?: string; // CBSE, ICSE, etc.
  stream?: string; // Science, Commerce, Arts (for 11/12)
  ongoingBook?: string;
  ongoingLecture?: string;
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
  studentClass: { type: Number },
  board: { type: String },
  stream: { type: String },
  ongoingBook: { type: String },
  ongoingLecture: { type: String },
  githubId: { type: String, sparse: true },
  appleId: { type: String, sparse: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  history: [{ type: String, default: [] }]
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
