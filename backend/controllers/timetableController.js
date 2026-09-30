import Timetable from '../models/Timetable.js';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Generate AI Timetable
export const generateAITimetable = async (req, res, next) => {
  try {
    const { subjects, totalFreeHours, weekStartDate } = req.body;

    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ message: 'Please provide subjects' });
    }

    // Create prompt for Claude
    const prompt = `You are an academic scheduling expert. Create a detailed weekly study schedule based on:

Subjects: ${JSON.stringify(subjects)}
Total Free Hours Per Week: ${totalFreeHours}
Week Starting: ${new Date(weekStartDate).toDateString()}

For each subject, consider:
- Difficulty level (easy/medium/hard)
- Priority (low/medium/high)
- Required hours per week

Provide a JSON response with this exact structure:
{
  "schedule": [
    {
      "day": "Monday",
      "timeSlots": [
        {
          "startTime": "09:00",
          "endTime": "10:30",
          "subject": "Mathematics",
          "topic": "Calculus - Derivatives"
        }
      ]
    }
  ],
  "insights": "Brief insights about the schedule"
}

Ensure the schedule is balanced, realistic, and accounts for all subjects proportionally.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const scheduleData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!scheduleData) {
      return res.status(500).json({ message: 'Failed to generate schedule' });
    }

    // Save to database
    const timetable = new Timetable({
      userId: req.userId,
      weekStartDate,
      subjects,
      totalFreeHours,
      schedule: scheduleData.schedule,
      generatedByAI: true
    });

    await timetable.save();

    res.status(201).json({
      message: 'Timetable generated successfully',
      timetable: {
        id: timetable._id,
        schedule: timetable.schedule,
        weekStartDate: timetable.weekStartDate,
        insights: scheduleData.insights
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Timetables
export const getTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.find({ userId: req.userId }).sort({ weekStartDate: -1 });

    res.status(200).json({
      count: timetables.length,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Timetable
export const getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable || timetable.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.status(200).json(timetable);
  } catch (error) {
    next(error);
  }
};

// Update Timetable
export const updateTimetable = async (req, res, next) => {
  try {
    const { schedule } = req.body;

    let timetable = await Timetable.findById(req.params.id);

    if (!timetable || timetable.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    timetable.schedule = schedule;
    await timetable.save();

    res.status(200).json({
      message: 'Timetable updated successfully',
      timetable
    });
  } catch (error) {
    next(error);
  }
};

// Delete Timetable
export const deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);

    if (!timetable || timetable.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.status(200).json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    next(error);
  }
};
