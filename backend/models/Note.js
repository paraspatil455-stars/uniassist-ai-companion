import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    originalText: {
      type: String,
      required: true
    },
    subject: String,
    topic: String,
    summary: {
      type: String,
      required: true
    },
    keyConcepts: [String],
    revisionPoints: [String],
    sourceType: {
      type: String,
      enum: ['text', 'pdf', 'file'],
      default: 'text'
    },
    fileName: String,
    generatedByAI: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Note', noteSchema);
