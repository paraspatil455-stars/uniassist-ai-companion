import Result from '../models/Result.js';

// Calculate grade from marks
const calculateGrade = (marks) => {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B+';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C+';
  if (marks >= 40) return 'C';
  if (marks >= 30) return 'D';
  return 'F';
};

// Grade to point conversion (4.0 scale)
const gradeToPoint = (grade) => {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'B+': 3.5, 'B': 3.0,
    'C+': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0.0
  };
  return gradePoints[grade] || 0;
};

// Add/Update Results
export const addResult = async (req, res, next) => {
  try {
    const { semester, subjects } = req.body;

    // Calculate grades and validate
    const processedSubjects = subjects.map(subject => ({
      ...subject,
      grade: calculateGrade(subject.marks)
    }));

    // Calculate SGPA
    let totalPoints = 0;
    let totalCredits = 0;

    processedSubjects.forEach(subject => {
      const points = gradeToPoint(subject.grade) * subject.credits;
      totalPoints += points;
      totalCredits += subject.credits;
    });

    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    let result = await Result.findOne({
      userId: req.userId,
      semester
    });

    if (result) {
      result.subjects = processedSubjects;
      result.sgpa = sgpa;
      result.totalCredits = totalCredits;
      await result.save();
    } else {
      result = new Result({
        userId: req.userId,
        semester,
        subjects: processedSubjects,
        sgpa,
        totalCredits
      });
      await result.save();
    }

    // Calculate CGPA from all semesters
    const allResults = await Result.find({ userId: req.userId });
    let totalSGPA = 0;
    allResults.forEach(r => {
      totalSGPA += parseFloat(r.sgpa);
    });
    const cgpa = (totalSGPA / allResults.length).toFixed(2);

    // Update user CGPA
    await req.app.locals.User.findByIdAndUpdate(
      req.userId,
      { cgpa },
      { new: true }
    );

    res.status(200).json({
      message: 'Results saved successfully',
      result: {
        ...result.toObject(),
        cgpa
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Results
export const getResults = async (req, res, next) => {
  try {
    const results = await Result.find({ userId: req.userId }).sort({ semester: 1 });

    // Calculate CGPA
    let totalSGPA = 0;
    results.forEach(r => {
      totalSGPA += parseFloat(r.sgpa);
    });
    const cgpa = results.length > 0 ? (totalSGPA / results.length).toFixed(2) : 0;

    res.status(200).json({
      results,
      cgpa,
      semesterCount: results.length
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Result
export const getResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result || result.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Predict Target CGPA
export const predictTargetCGPA = async (req, res, next) => {
  try {
    const { targetCGPA, currentSemester } = req.body;

    const results = await Result.find({ userId: req.userId }).sort({ semester: 1 });

    let totalSGPA = 0;
    results.forEach(r => {
      totalSGPA += parseFloat(r.sgpa);
    });

    const currentCGPA = results.length > 0 ? totalSGPA / results.length : 0;
    const futureSemesters = 8 - currentSemester; // Assuming 8 semesters total

    if (futureSemesters <= 0) {
      return res.status(400).json({ message: 'Invalid current semester' });
    }

    // Calculate required SGPA for next semesters
    const requiredTotal = (targetCGPA * (results.length + futureSemesters)) - totalSGPA;
    const requiredSGPA = (requiredTotal / futureSemesters).toFixed(2);

    res.status(200).json({
      currentCGPA: currentCGPA.toFixed(2),
      targetCGPA,
      requiredSGPA,
      message: `To achieve ${targetCGPA} CGPA, you need an average SGPA of ${requiredSGPA} in the next ${futureSemesters} semesters`
    });
  } catch (error) {
    next(error);
  }
};
