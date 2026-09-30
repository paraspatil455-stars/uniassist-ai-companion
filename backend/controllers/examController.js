import ExamPlan from '../models/ExamPlan.js';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Generate AI Exam Roadmap
export const generateExamRoadmap = async (req, res, next) => {
  try {
    const { examTitle, subjects, examDate, dailyStudyHours } = req.body;

    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ message: 'Please provide subjects' });
    }

    // Calculate days until exam
    const today = new Date();
    const exam = new Date(examDate);
    const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExam <= 0) {
      return res.status(400).json({ message: 'Exam date must be in the future' });
    }

    const prompt = `You are an expert exam preparation planner. Create a detailed day-by-day study roadmap for the exam.

Exam Title: ${examTitle}
Exam Date: ${new Date(examDate).toDateString()}
Days Available: ${daysUntilExam}
Daily Study Hours: ${dailyStudyHours}

Subjects to cover:
${JSON.stringify(subjects, null, 2)}

Consider:
- Subject difficulty levels
- Priority levels
- Current syllabus completion percentage
- Balanced distribution across days
- Revision days before exam

Respond in JSON format:
{
  "roadmap": [
    {
      "day": 1,
      "date": "2024-01-15",
      "plannedTopics": [
        {
          "subject": "Mathematics",
          "topic": "Calculus - Derivatives",
          "duration": "2 hours"
        }
      ],
      "notes": "Focus on fundamentals"
    }
  ],
  "strategy": "Overall exam preparation strategy",
  "tips": ["Tip 1", "Tip 2"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const roadmapData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!roadmapData || !roadmapData.roadmap) {
      return res.status(500).json({ message: 'Failed to generate roadmap' });
    }

    // Save to database
    const examPlan = new ExamPlan({
      userId: req.userId,
      examTitle,
      subjects,
      examDate,
      dailyStudyHours,
      roadmap: roadmapData.roadmap,
      generatedByAI: true,
      progressPercentage: 0
    });

    await examPlan.save();

    res.status(201).json({
      message: 'Exam roadmap generated successfully',
      examPlan: {
        id: examPlan._id,
        examTitle,
        roadmap: examPlan.roadmap,
        strategy: roadmapData.strategy,
        tips: roadmapData.tips,
        daysAvailable: daysUntilExam
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Exam Plans
export const getExamPlans = async (req, res, next) => {
  try {
    const plans = await ExamPlan.find({ userId: req.userId }).sort({ examDate: 1 });

    res.status(200).json({
      count: plans.length,
      plans
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Exam Plan
export const getExamPlan = async (req, res, next) => {
  try {
    const plan = await ExamPlan.findById(req.params.id);

    if (!plan || plan.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Exam plan not found' });
    }

    res.status(200).json(plan);
  } catch (error) {
    next(error);
  }
};

// Update Roadmap Progress
export const updateRoadmapProgress = async (req, res, next) => {
  try {
    const { dayIndex, topicIndex, completed } = req.body;

    const plan = await ExamPlan.findById(req.params.id);

    if (!plan || plan.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Exam plan not found' });
    }

    if (plan.roadmap[dayIndex] && plan.roadmap[dayIndex].plannedTopics[topicIndex]) {
      plan.roadmap[dayIndex].plannedTopics[topicIndex].completed = completed;
    }

    // Calculate progress percentage
    let completedTopics = 0;
    let totalTopics = 0;

    plan.roadmap.forEach(day => {
      day.plannedTopics.forEach(topic => {
        totalTopics++;
        if (topic.completed) completedTopics++;
      });
    });

    plan.progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    await plan.save();

    res.status(200).json({
      message: 'Progress updated',
      progressPercentage: plan.progressPercentage,
      plan
    });
  } catch (error) {
    next(error);
  }
};

// Delete Exam Plan
export const deleteExamPlan = async (req, res, next) => {
  try {
    const plan = await ExamPlan.findByIdAndDelete(req.params.id);

    if (!plan || plan.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Exam plan not found' });
    }

    res.status(200).json({ message: 'Exam plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};
