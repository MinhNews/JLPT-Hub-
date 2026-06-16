"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const ListeningLesson_1 = require("../models/ListeningLesson");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
// Helper to upload remote audio to Cloudinary
const uploadAudioToCloudinary = async (remoteUrl) => {
    if (!remoteUrl || !remoteUrl.startsWith('http'))
        return remoteUrl;
    try {
        console.log(`Uploading to Cloudinary: ${remoteUrl}`);
        const result = await cloudinary_1.default.uploader.upload(remoteUrl, {
            resource_type: 'video', // Audio files are uploaded as video resource type in Cloudinary
            folder: 'jlpt_hub/chokai_audio',
            use_filename: true,
            unique_filename: true
        });
        console.log(`Success: ${result.secure_url}`);
        return result.secure_url;
    }
    catch (error) {
        console.error(`Failed to upload ${remoteUrl} to Cloudinary:`, error);
        return remoteUrl; // Fallback to original URL on error
    }
};
const seedChokaiData = async () => {
    try {
        await (0, db_1.connectDB)();
        console.log('Clearing existing ListeningLessons...');
        await ListeningLesson_1.ListeningLesson.deleteMany({});
        const jsonPath = path_1.default.join(__dirname, '../../../src/data/shinkanzen_n3_chokai.json');
        if (!fs_1.default.existsSync(jsonPath)) {
            throw new Error(`JSON file not found at: ${jsonPath}`);
        }
        const rawData = fs_1.default.readFileSync(jsonPath, 'utf8');
        const chokaiLessons = JSON.parse(rawData);
        console.log(`Loaded ${chokaiLessons.length} lessons from JSON. Starting upload to Cloudinary & MongoDB...`);
        for (let i = 0; i < chokaiLessons.length; i++) {
            const lesson = chokaiLessons[i];
            console.log(`\n[${i + 1}/${chokaiLessons.length}] Processing: ${lesson.title}`);
            // 1. Upload main audio if exists
            if (lesson.audioUrl) {
                lesson.audioUrl = await uploadAudioToCloudinary(lesson.audioUrl);
            }
            // 2. Upload block-level audios if exist
            if (lesson.blocks && Array.isArray(lesson.blocks)) {
                for (let j = 0; j < lesson.blocks.length; j++) {
                    const block = lesson.blocks[j];
                    if (block.audioUrl) {
                        block.audioUrl = await uploadAudioToCloudinary(block.audioUrl);
                    }
                }
            }
            // 3. Save to database
            const newLesson = new ListeningLesson_1.ListeningLesson(lesson);
            await newLesson.save();
            console.log(`Saved to MongoDB: ${lesson.title}`);
        }
        console.log('\nSeeding completed successfully!');
    }
    catch (error) {
        console.error('Error seeding data:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('MongoDB Disconnected.');
    }
};
seedChokaiData();
