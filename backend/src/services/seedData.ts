import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { ListeningLesson } from '../models/ListeningLesson';
import cloudinary from '../config/cloudinary';
import mongoose from 'mongoose';

dotenv.config();

// Helper to upload remote audio to Cloudinary
const uploadAudioToCloudinary = async (remoteUrl: string): Promise<string> => {
  if (!remoteUrl || !remoteUrl.startsWith('http')) return remoteUrl;
  
  try {
    console.log(`Uploading to Cloudinary: ${remoteUrl}`);
    const result = await cloudinary.uploader.upload(remoteUrl, {
      resource_type: 'video', // Audio files are uploaded as video resource type in Cloudinary
      folder: 'jlpt_hub/chokai_audio',
      use_filename: true,
      unique_filename: true
    });
    console.log(`Success: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${remoteUrl} to Cloudinary:`, error);
    return remoteUrl; // Fallback to original URL on error
  }
};

const seedChokaiData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing ListeningLessons...');
    await ListeningLesson.deleteMany({});

    const jsonPath = path.join(__dirname, '../../../src/data/shinkanzen_n3_chokai.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found at: ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
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
      const newLesson = new ListeningLesson(lesson);
      await newLesson.save();
      console.log(`Saved to MongoDB: ${lesson.title}`);
    }

    console.log('\nSeeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
};

seedChokaiData();
