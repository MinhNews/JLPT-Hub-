import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notebook } from '../models/Notebook';

// Get all notebook entries of a user
export const getNotebookEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const entries = await Notebook.find({ userId }).sort({ updatedAt: -1 });
    res.status(200).json(entries);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Create or update a notebook entry
export const upsertNotebookEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { type, originalId, note } = req.body;

    if (!type || !originalId) {
      return res.status(400).json({ message: 'Type and originalId are required' });
    }

    const entry = await Notebook.findOneAndUpdate(
      { userId, type, originalId },
      { $set: { note, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: 'Notebook entry saved successfully',
      entry
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Delete notebook entry
export const deleteNotebookEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const entry = await Notebook.findOneAndDelete({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({ message: 'Notebook entry not found' });
    }

    res.status(200).json({ message: 'Notebook entry deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
