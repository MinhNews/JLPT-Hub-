"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotebookEntry = exports.patchNotebookEntry = exports.updateNotebookEntry = exports.upsertNotebookEntry = exports.getNotebookEntries = void 0;
const Notebook_1 = require("../models/Notebook");
const noteTypes = ['general', 'vocab', 'grammar', 'reading', 'listening', 'kanji', 'sentence', 'question', 'mistake', 'plan', 'global'];
const levels = ['N5', 'N4', 'N3', 'N2', 'N1', 'ALL'];
const statuses = ['new', 'review', 'mastered'];
const makeOriginalId = () => `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const normalizeTags = (tags) => {
    if (Array.isArray(tags)) {
        return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
    }
    if (typeof tags === 'string') {
        return [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))];
    }
    return [];
};
const normalizeEntry = (entry) => {
    const obj = typeof entry.toObject === 'function' ? entry.toObject() : entry;
    const legacyContent = obj.content || obj.note || '';
    const normalizedType = obj.type === 'global' ? 'general' : obj.type || 'general';
    const title = obj.title || (obj.type === 'global' ? 'Ghi chú cũ' : 'Ghi chú mới');
    return {
        ...obj,
        id: String(obj._id),
        title,
        content: legacyContent,
        type: normalizedType,
        level: obj.level || 'N3',
        tags: obj.tags || [],
        status: obj.status || 'new',
        pinned: !!obj.pinned,
        template: obj.template || 'blank',
        source: obj.source || {},
    };
};
const buildPayload = (body, userId) => {
    const type = noteTypes.includes(body.type) ? body.type : 'general';
    const level = levels.includes(body.level) ? body.level : 'N3';
    const status = statuses.includes(body.status) ? body.status : 'new';
    const content = body.content ?? body.note ?? '';
    const title = String(body.title || '').trim() || (type === 'global' ? 'Ghi chú cũ' : 'Ghi chú mới');
    return {
        userId,
        title,
        content,
        note: content,
        type,
        level,
        tags: normalizeTags(body.tags),
        status,
        pinned: !!body.pinned,
        template: body.template || 'blank',
        source: body.source || {},
        blocks: Array.isArray(body.blocks) ? body.blocks : [],
        reviewAt: body.reviewAt || null,
        originalId: body.originalId || makeOriginalId(),
    };
};
const getNotebookEntries = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { type, level, status, pinned, q, tag } = req.query;
        const filter = { userId };
        if (type && type !== 'all')
            filter.type = type;
        if (level && level !== 'all')
            filter.level = level;
        if (status && status !== 'all')
            filter.status = status;
        if (pinned === 'true')
            filter.pinned = true;
        if (tag)
            filter.tags = String(tag);
        if (q) {
            const regex = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { title: regex },
                { content: regex },
                { note: regex },
                { tags: regex },
                { 'source.label': regex },
                { 'source.lessonTitle': regex },
            ];
        }
        const entries = await Notebook_1.Notebook.find(filter).sort({ pinned: -1, updatedAt: -1 });
        res.status(200).json(entries.map(normalizeEntry));
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getNotebookEntries = getNotebookEntries;
const upsertNotebookEntry = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const payload = buildPayload(req.body, userId);
        let entry;
        if (req.body.id || req.body._id) {
            entry = await Notebook_1.Notebook.findOneAndUpdate({ _id: req.body.id || req.body._id, userId }, { $set: payload }, { new: true });
            if (!entry)
                return res.status(404).json({ message: 'Notebook entry not found' });
        }
        else if (req.body.type && req.body.originalId) {
            entry = await Notebook_1.Notebook.findOneAndUpdate({ userId, type: payload.type, originalId: payload.originalId }, { $set: payload }, { upsert: true, new: true });
        }
        else {
            entry = await Notebook_1.Notebook.create(payload);
        }
        res.status(200).json({
            message: 'Notebook entry saved successfully',
            entry: normalizeEntry(entry)
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.upsertNotebookEntry = upsertNotebookEntry;
const updateNotebookEntry = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const payload = buildPayload(req.body, userId);
        const entry = await Notebook_1.Notebook.findOneAndUpdate({ _id: req.params.id, userId }, { $set: payload }, { new: true });
        if (!entry)
            return res.status(404).json({ message: 'Notebook entry not found' });
        res.status(200).json({ message: 'Notebook entry updated successfully', entry: normalizeEntry(entry) });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.updateNotebookEntry = updateNotebookEntry;
const patchNotebookEntry = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const patch = { ...req.body };
        if (patch.tags !== undefined)
            patch.tags = normalizeTags(patch.tags);
        if (patch.content !== undefined)
            patch.note = patch.content;
        if (patch.note !== undefined && patch.content === undefined)
            patch.content = patch.note;
        const entry = await Notebook_1.Notebook.findOneAndUpdate({ _id: req.params.id, userId }, { $set: patch }, { new: true });
        if (!entry)
            return res.status(404).json({ message: 'Notebook entry not found' });
        res.status(200).json({ message: 'Notebook entry updated successfully', entry: normalizeEntry(entry) });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.patchNotebookEntry = patchNotebookEntry;
const deleteNotebookEntry = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const entry = await Notebook_1.Notebook.findOneAndDelete({ _id: req.params.id, userId });
        if (!entry)
            return res.status(404).json({ message: 'Notebook entry not found' });
        res.status(200).json({ message: 'Notebook entry deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.deleteNotebookEntry = deleteNotebookEntry;
