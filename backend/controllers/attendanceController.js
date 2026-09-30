import Attendance from '../models/Attendance.js';

// Add/Update Attendance
export const addAttendance = async (req, res, next) => {
  try {
    const { subject, lecturesAttended, totalLectures, semester } = req.body;

    let attendance = await Attendance.findOne({
      userId: req.userId,
      subject,
      semester
    });

    if (attendance) {
      attendance.lecturesAttended = lecturesAttended;
      attendance.totalLectures = totalLectures;
      await attendance.save();
    } else {
      attendance = new Attendance({
        userId: req.userId,
        subject,
        lecturesAttended,
        totalLectures,
        semester
      });
      await attendance.save();
    }

    res.status(200).json({
      message: 'Attendance recorded successfully',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// Get All Attendance
export const getAttendance = async (req, res, next) => {
  try {
    const { semester } = req.query;

    let filter = { userId: req.userId };
    if (semester) filter.semester = semester;

    const attendance = await Attendance.find(filter);

    res.status(200).json({
      count: attendance.length,
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// Get Attendance Summary
export const getAttendanceSummary = async (req, res, next) => {
  try {
    const { semester } = req.query;

    let filter = { userId: req.userId };
    if (semester) filter.semester = semester;

    const attendance = await Attendance.find(filter);

    const summary = attendance.map(att => ({
      subject: att.subject,
      attended: att.lecturesAttended,
      total: att.totalLectures,
      percentage: att.attendancePercentage,
      status: att.attendancePercentage >= att.warningThreshold ? 'good' : 'warning'
    }));

    res.status(200).json({
      summary,
      overallPercentage: attendance.length > 0
        ? (attendance.reduce((sum, a) => sum + a.attendancePercentage, 0) / attendance.length).toFixed(2)
        : 0
    });
  } catch (error) {
    next(error);
  }
};

// Predict Future Attendance
export const predictAttendance = async (req, res, next) => {
  try {
    const { subject, semester, targetPercentage = 75 } = req.body;

    const attendance = await Attendance.findOne({
      userId: req.userId,
      subject,
      semester
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const currentPercentage = attendance.attendancePercentage;
    const currentAttended = attendance.lecturesAttended;
    const currentTotal = attendance.totalLectures;

    let prediction = {};

    if (currentPercentage >= targetPercentage) {
      // Can skip some lectures
      let lecturesCanSkip = 0;
      for (let i = 0; i < 100; i++) {
        const newPercentage = ((currentAttended + i) / (currentTotal + i)) * 100;
        if (newPercentage < targetPercentage) {
          lecturesCanSkip = i - 1;
          break;
        }
      }
      prediction = {
        status: 'safe',
        message: `You can safely skip up to ${lecturesCanSkip} lectures and still maintain ${targetPercentage}% attendance`,
        lecturesCanSkip
      };
    } else {
      // Need to attend more lectures
      let lecturesNeeded = 0;
      for (let i = 0; i < 100; i++) {
        const newPercentage = ((currentAttended + i) / (currentTotal + i)) * 100;
        if (newPercentage >= targetPercentage) {
          lecturesNeeded = i;
          break;
        }
      }
      prediction = {
        status: 'warning',
        message: `You need to attend at least ${lecturesNeeded} more consecutive lectures to reach ${targetPercentage}% attendance`,
        lecturesNeeded
      };
    }

    res.status(200).json({
      subject,
      currentPercentage: currentPercentage.toFixed(2),
      currentAttended,
      currentTotal,
      ...prediction
    });
  } catch (error) {
    next(error);
  }
};
