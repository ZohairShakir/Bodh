import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyPack extends Document {
  code: string;
  summary: any[];
  quiz: any[];
  keyTerms: any[];
}

const StudyPackSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  summary: { type: Array, required: true },
  quiz: { type: Array, required: true },
  keyTerms: { type: Array, required: true }
}, { timestamps: true });

export default mongoose.model<IStudyPack>('StudyPack', StudyPackSchema);
