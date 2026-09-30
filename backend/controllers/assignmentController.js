import Assignment from '../models/Assignment.js';

// Create Assignment
export const createAssignment = async (req, res, next) => {
  try {
    const { title, subject, description, dueDate, priority } = req.body;

    const assignment = new Assignment({
      userId: req.userId,
      title,
      subject,
      description,
      dueDate,
      priority,
      status: 'pending'
    });

    await assignment.save();

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// Get All Assignments
export const getAssignments = async (req, res, next) => {
  try {
    const { status, priority, sortBy = 'dueDate' } = req.query;

    let filter = { userId: req.userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const assignments = await Assignment.find(filter).sort({ [sortBy]: 1 });

    // Calculate statistics
    const stats = {
      total: assignments.length,
      completed: assignments.filter(a => a.status === 'completed').length,
      pending: assignments.filter(a => a.status === 'pending').length,
      inProgress: assignments.filter(a => a.status === 'in-progress').length
    };

    res.status(200).json({
      assignments,
      stats
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Assignment
export const getAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json(assignment);
  } catch (error) {
    next(error);
  }
};

// Update Assignment
export const updateAssignment = async (req, res, next) => {
  try {
    const { title, description, status, priority, completionPercentage, dueDate } = req.body;

    let assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (status) assignment.status = status;
    if (priority) assignment.priority = priority;
    if (completionPercentage) assignment.completionPercentage = completionPercentage;
    if (dueDate) assignment.dueDate = dueDate;

    // Mark submitted date if status is completed
    if (status === 'completed' && !assignment.submittedDate) {
      assignment.submittedDate = new Date();
    }

    await assignment.save();

    res.status(200).json({
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// Delete Assignment
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment || assignment.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get Upcoming Deadlines (within 48 hours)
export const getUpcomingDeadlines = async (req, res, next) => {
  try {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const deadlines = await Assignment.find({
      userId: req.userId,
      dueDate: { $gte: now, $lte: in48Hours },
      status: { $ne: 'completed' }
    }).sort({ dueDate: 1 });

    res.status(200).json({
      count: deadlines.length,
      deadlines
    });
  } catch (error) {
    next(error);
  }
};
