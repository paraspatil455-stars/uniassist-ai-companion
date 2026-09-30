import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    subjects: [
      {
        name: String,
        marks: Number,
        credits: Number,
        grade: String // A+, A, B+, B, C+, C, D, F
      }
    ],
    sgpa: {
      type: Number,
      default: 0 // Semester GPA
    },
    cgpa: {
      type: Number,
      default: 0 // Cumulative GPA
    },
    totalCredits: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Compound index
resultSchema.index({ userId: 1, semester: 1 });

export default mongoose.model('Result', resultSchema);
