"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotebookEntry = exports.upsertNotebookEntry = exports.getNotebookEntries = void 0;
const Notebook_1 = require("../models/Notebook");
// Get all notebook entries of a user
const getNotebookEntries = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const entries = await Notebook_1.Notebook.find({ userId }).sort({ updatedAt: -1 });
        res.status(200).json(entries);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getNotebookEntries = getNotebookEntries;
// Create or update a notebook entry
const upsertNotebookEntry = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { type, originalId, note } = req.body;
        if (!type || !originalId) {
            return res.status(400).json({ message: 'Type and originalId are required' });
        }
        const entry = await Notebook_1.Notebook.findOneAndUpdate({ userId, type, originalId }, { $set: { note, updatedAt: new Date() } }, { upsert: true, new: true });
        res.status(200).json({
            message: 'Notebook entry saved successfully',
            entry
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.upsertNotebookEntry = upsertNotebookEntry;
// Delete notebook entry
const deleteNotebookEntry = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { id } = req.params;
        const entry = await Notebook_1.Notebook.findOneAndDelete({ _id: id, userId });
        if (!entry) {
            return res.status(404).json({ message: 'Notebook entry not found' });
        }
        res.status(200).json({ message: 'Notebook entry deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.deleteNotebookEntry = deleteNotebookEntry;
