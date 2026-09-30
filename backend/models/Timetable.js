import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    weekStartDate: {
      type: Date,
      required: true
    },
    subjects: [
      {
        name: String,
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard']
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high']
        },
        hoursPerWeek: Number
      }
    ],
    totalFreeHours: {
      type: Number,
      required: true
    },
    schedule: [
      {
        day: String,
        timeSlots: [
          {
            startTime: String,
            endTime: String,
            subject: String,
            topic: String
          }
        ]
      }
    ],
    generatedByAI: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Timetable', timetableSchema);
