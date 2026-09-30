import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please provide assignment title'],
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Please provide subject']
    },
    description: String,
    dueDate: {
      type: Date,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    submittedDate: Date
  },
  { timestamps: true }
);

// Index for efficient querying
assignmentSchema.index({ userId: 1, dueDate: 1 });
assignmentSchema.index({ userId: 1, status: 1 });

export default mongoose.model('Assignment', assignmentSchema);
