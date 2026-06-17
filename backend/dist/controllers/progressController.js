"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleProgressItem = exports.syncProgress = exports.getUserProgress = void 0;
const Progress_1 = require("../models/Progress");
// Map database progress to frontend progress lists
const getUserProgress = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const progressRecords = await Progress_1.Progress.find({ userId });
        const response = {
            vocabMastered: progressRecords.filter(p => p.type === 'vocab' && p.status === 'mastered').map(p => p.lessonId),
            kanjiMastered: progressRecords.filter(p => p.type === 'kanji' && p.status === 'mastered').map(p => p.lessonId),
            grammarMastered: progressRecords.filter(p => p.type === 'grammar' && p.status === 'mastered').map(p => p.lessonId),
            readingMastered: progressRecords.filter(p => p.type === 'reading' && p.status === 'mastered').map(p => p.lessonId),
            listeningMastered: progressRecords.filter(p => p.type === 'listening' && p.status === 'mastered').map(p => p.lessonId),
            minnaMastered: progressRecords
                .filter(p => p.type === 'minna' && p.status === 'mastered')
                .map(p => Number(p.lessonId))
                .filter(n => Number.isFinite(n))
        };
        res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getUserProgress = getUserProgress;
// Sync client-side progress with database (Merges they both)
const syncProgress = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { vocabMastered, kanjiMastered, grammarMastered, readingMastered, listeningMastered, minnaMastered } = req.body;
        const syncTypes = [
            { key: 'vocab', list: vocabMastered || [] },
            { key: 'kanji', list: kanjiMastered || [] },
            { key: 'grammar', list: grammarMastered || [] },
            { key: 'reading', list: readingMastered || [] },
            { key: 'listening', list: listeningMastered || [] },
            { key: 'minna', list: (minnaMastered || []).map(String) }
        ];
        // Find all current progress records in DB
        const existingRecords = await Progress_1.Progress.find({ userId });
        const ops = [];
        const mergedResults = {
            vocabMastered: [],
            kanjiMastered: [],
            grammarMastered: [],
            readingMastered: [],
            listeningMastered: [],
            minnaMastered: []
        };
        for (const syncType of syncTypes) {
            const dbItems = existingRecords
                .filter(r => r.type === syncType.key && r.status === 'mastered')
                .map(r => r.lessonId);
            // Union of client and db items
            const unionSet = new Set([...dbItems, ...syncType.list]);
            const unionList = Array.from(unionSet);
            mergedResults[`${syncType.key}Mastered`] = syncType.key === 'minna'
                ? unionList.map(Number).filter(n => Number.isFinite(n))
                : unionList;
            // Identify items that need to be created/updated in DB
            for (const lessonId of unionList) {
                ops.push({
                    updateOne: {
                        filter: { userId, lessonId, type: syncType.key },
                        update: {
                            $set: { status: 'mastered', lastAccessedAt: new Date() }
                        },
                        upsert: true
                    }
                });
            }
        }
        if (ops.length > 0) {
            await Progress_1.Progress.bulkWrite(ops);
        }
        res.status(200).json({
            message: 'Progress synchronized successfully',
            progress: mergedResults
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.syncProgress = syncProgress;
// Single progress item update (toggle check)
const toggleProgressItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { lessonId, type, status } = req.body; // status: 'mastered' | 'in_progress'
        if (!lessonId || !type || !['vocab', 'kanji', 'grammar', 'reading', 'listening', 'minna', 'kanjill', 'exam'].includes(type)) {
            return res.status(400).json({ message: 'Invalid progress payload' });
        }
        const targetStatus = status || 'mastered';
        const result = await Progress_1.Progress.findOneAndUpdate({ userId, lessonId, type }, { $set: { status: targetStatus, lastAccessedAt: new Date() } }, { upsert: true, new: true });
        res.status(200).json({
            message: 'Progress item updated successfully',
            item: result
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.toggleProgressItem = toggleProgressItem;
