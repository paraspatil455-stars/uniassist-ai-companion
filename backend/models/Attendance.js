import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    lecturesAttended: {
      type: Number,
      required: true,
      default: 0
    },
    totalLectures: {
      type: Number,
      required: true,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0
    },
    semester: {
      type: Number,
      required: true
    },
    warningThreshold: {
      type: Number,
      default: 75 // 75% attendance required
    }
  },
  { timestamps: true }
);

// Calculate attendance percentage before saving
attendanceSchema.pre('save', function(next) {
  if (this.totalLectures > 0) {
    this.attendancePercentage = (this.lecturesAttended / this.totalLectures) * 100;
  }
  next();
});

// Compound index for efficient queries
attendanceSchema.index({ userId: 1, semester: 1 });

export default mongoose.model('Attendance', attendanceSchema);
