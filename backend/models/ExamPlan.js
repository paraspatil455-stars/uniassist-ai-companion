import mongoose from 'mongoose';

const examPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    examTitle: {
      type: String,
      required: true
    },
    subjects: [
      {
        name: String,
        syllabusCompletion: {
          type: Number,
          default: 0 // 0-100%
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high']
        }
      }
    ],
    examDate: {
      type: Date,
      required: true
    },
    dailyStudyHours: {
      type: Number,
      required: true
    },
    roadmap: [
      {
        day: Number,
        date: Date,
        plannedTopics: [
          {
            subject: String,
            topic: String,
            completed: {
              type: Boolean,
              default: false
            }
          }
        ]
      }
    ],
    generatedByAI: {
      type: Boolean,
      default: true
    },
    progressPercentage: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

examPlanSchema.index({ userId: 1, examDate: 1 });

export default mongoose.model('ExamPlan', examPlanSchema);
