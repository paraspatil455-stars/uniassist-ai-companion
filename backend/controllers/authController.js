import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, university, degree } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      university,
      degree
    });

    await user.save();

    const token = generateToken(user._id, user.email);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        degree: user.degree
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.email);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        degree: user.degree,
        cgpa: user.cgpa,
        darkMode: user.darkMode
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// Get Current User
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        degree: user.degree,
        semester: user.semester,
        cgpa: user.cgpa,
        darkMode: user.darkMode
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update User Profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, university, degree, semester, darkMode } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, university, degree, semester, darkMode },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        degree: user.degree,
        semester: user.semester,
        darkMode: user.darkMode
      }
    });
  } catch (error) {
    next(error);
  }
};
