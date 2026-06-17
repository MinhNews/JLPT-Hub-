import mongoose, { Schema, Document } from 'mongoose';

export interface IGrammarQuiz extends Document {
  fillInBlanks: any[];
  starArrangements: any[];
}

const GrammarQuizSchema: Schema = new Schema({
  fillInBlanks: { type: [Schema.Types.Mixed], default: [] },
  starArrangements: { type: [Schema.Types.Mixed], default: [] }
}, { collection: 'grammar_quizzes' });

export const GrammarQuiz = mongoose.model<IGrammarQuiz>('GrammarQuiz', GrammarQuizSchema);
