import mongoose, { Schema, Document } from 'mongoose';

export interface IKanjiLLItem {
  kanji: string;
  hanViet: string;
  meaning: string;
  mnemonicText: string;
  readings: string;
  imgUrl: string;
  examples: string[];
}

export interface IKanjiLLLesson extends Document {
  lessonId: number;
  title: string;
  kanjis: IKanjiLLItem[];
}

const KanjiLLItemSchema: Schema = new Schema({
  kanji: { type: String, required: true },
  hanViet: { type: String },
  meaning: { type: String },
  mnemonicText: { type: String },
  readings: { type: String },
  imgUrl: { type: String },
  examples: [{ type: String }]
});

const KanjiLLLessonSchema: Schema = new Schema({
  lessonId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  kanjis: [KanjiLLItemSchema]
}, { timestamps: true });

export const KanjiLL = mongoose.model<IKanjiLLLesson>('KanjiLL', KanjiLLLessonSchema);
