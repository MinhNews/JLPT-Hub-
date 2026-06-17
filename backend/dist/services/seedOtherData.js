"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const Kanji_1 = require("../models/Kanji");
const Vocabulary_1 = require("../models/Vocabulary");
const Grammar_1 = require("../models/Grammar");
const ReadingLesson_1 = require("../models/ReadingLesson");
const GrammarQuiz_1 = require("../models/GrammarQuiz");
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const seedAllOtherData = async () => {
    try {
        await (0, db_1.connectDB)();
        const dataDir = path_1.default.join(__dirname, '../../../src/data');
        // 1. Seed Kanji
        console.log('\n--- Seeding Kanji N3 ---');
        await Kanji_1.Kanji.deleteMany({});
        const kanjiDataPath = path_1.default.join(dataDir, 'enriched_kanji.json');
        if (fs_1.default.existsSync(kanjiDataPath)) {
            const rawKanji = fs_1.default.readFileSync(kanjiDataPath, 'utf8');
            const kanjiLessons = JSON.parse(rawKanji);
            let kanjiCount = 0;
            for (const lesson of kanjiLessons) {
                const lessonName = lesson.lesson; // e.g. "第1課"
                for (const card of lesson.cards) {
                    const newKanji = new Kanji_1.Kanji({
                        ...card,
                        lesson: lessonName
                    });
                    await newKanji.save();
                    kanjiCount++;
                }
            }
            console.log(`Successfully seeded ${kanjiCount} Kanji cards.`);
        }
        // 2. Seed Grammar
        console.log('\n--- Seeding Grammar N3 ---');
        await Grammar_1.Grammar.deleteMany({});
        const grammarDataPath = path_1.default.join(dataDir, 'mimikara_n3_grammar.json');
        if (fs_1.default.existsSync(grammarDataPath)) {
            const rawGrammar = fs_1.default.readFileSync(grammarDataPath, 'utf8');
            const grammarList = JSON.parse(rawGrammar);
            let grammarCount = 0;
            for (const item of grammarList) {
                const newGrammar = new Grammar_1.Grammar(item);
                await newGrammar.save();
                grammarCount++;
            }
            console.log(`Successfully seeded ${grammarCount} Grammar patterns.`);
        }
        // 2.5 Seed Grammar Quiz
        console.log('\n--- Seeding Grammar Quiz N3 ---');
        await GrammarQuiz_1.GrammarQuiz.deleteMany({});
        const grammarQuizDataPath = path_1.default.join(dataDir, 'grammar_questions.json');
        if (fs_1.default.existsSync(grammarQuizDataPath)) {
            const rawQuiz = fs_1.default.readFileSync(grammarQuizDataPath, 'utf8');
            const quizData = JSON.parse(rawQuiz);
            const newQuiz = new GrammarQuiz_1.GrammarQuiz(quizData);
            await newQuiz.save();
            console.log(`Successfully seeded Grammar Quiz (fillInBlanks: ${quizData.fillInBlanks?.length}, starArrangements: ${quizData.starArrangements?.length}).`);
        }
        // 3. Seed Vocabulary
        console.log('\n--- Seeding Vocabulary N3 ---');
        await Vocabulary_1.Vocabulary.deleteMany({});
        const vocabDataPath = path_1.default.join(dataDir, 'mimikara_n3_vocab.json');
        if (fs_1.default.existsSync(vocabDataPath)) {
            const rawVocab = fs_1.default.readFileSync(vocabDataPath, 'utf8');
            const vocabCategories = JSON.parse(rawVocab);
            let vocabCount = 0;
            for (const category in vocabCategories) {
                const sections = vocabCategories[category];
                for (const section in sections) {
                    const list = sections[section];
                    for (const item of list) {
                        const newVocab = new Vocabulary_1.Vocabulary({
                            ...item,
                            category,
                            section
                        });
                        await newVocab.save();
                        vocabCount++;
                    }
                }
            }
            console.log(`Successfully seeded ${vocabCount} Vocabulary entries.`);
        }
        // 4. Seed Reading
        console.log('\n--- Seeding Reading N3 ---');
        await ReadingLesson_1.ReadingLesson.deleteMany({});
        const readingDataPath = path_1.default.join(dataDir, 'shinkanzen_n3_dokkai.json');
        if (fs_1.default.existsSync(readingDataPath)) {
            const rawReading = fs_1.default.readFileSync(readingDataPath, 'utf8');
            const readingLessons = JSON.parse(rawReading);
            let readingCount = 0;
            for (const lesson of readingLessons) {
                const newReading = new ReadingLesson_1.ReadingLesson(lesson);
                await newReading.save();
                readingCount++;
            }
            console.log(`Successfully seeded ${readingCount} Reading lessons.`);
        }
        console.log('\nAll other datasets seeded successfully!');
    }
    catch (error) {
        console.error('Error seeding other datasets:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('MongoDB Disconnected.');
    }
};
seedAllOtherData();
