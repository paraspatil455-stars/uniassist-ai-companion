import Note from '../models/Note.js';
import { Anthropic } from '@anthropic-ai/sdk';
import multer from 'multer';
import pdfParse from 'pdfparse/lib/pdf-parse.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const upload = multer({ storage: multer.memoryStorage() });

// Summarize Notes with AI
export const summarizeNotes = async (req, res, next) => {
  try {
    const { text, subject, topic } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide text to summarize' });
    }

    const prompt = `You are an expert academic summarizer. Please analyze the following text and provide:
1. A concise summary (2-3 paragraphs)
2. Key concepts (5-10 bullet points)
3. Revision bullet points (5-8 key takeaways)

Text to summarize:
${text}

Respond in JSON format:
{
  "summary": "...",
  "keyConcepts": [...],
  "revisionPoints": [...]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const summaryData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!summaryData) {
      return res.status(500).json({ message: 'Failed to generate summary' });
    }

    // Save to database
    const note = new Note({
      userId: req.userId,
      originalText: text,
      subject,
      topic,
      summary: summaryData.summary,
      keyConcepts: summaryData.keyConcepts,
      revisionPoints: summaryData.revisionPoints,
      sourceType: 'text',
      generatedByAI: true
    });

    await note.save();

    res.status(201).json({
      message: 'Notes summarized successfully',
      note: {
        id: note._id,
        subject,
        topic,
        summary: note.summary,
        keyConcepts: note.keyConcepts,
        revisionPoints: note.revisionPoints,
        createdAt: note.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get All Notes
export const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      count: notes.length,
      notes
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Note
export const getNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note || note.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

// Delete Note
export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note || note.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};
