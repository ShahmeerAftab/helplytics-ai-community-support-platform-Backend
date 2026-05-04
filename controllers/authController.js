import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { username, email, password, role, skills } = req.body;

    if (!username || !email || !password || !role || !skills) {
      return res.status(400).json({ message: "All fields required" });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashedPassword, role, skills });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  const u = req.user;
  res.json({
    user: {
      id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
    },
  });
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both fields are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email, skills } = req.body;

    const existing = await User.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: req.user._id },
    });
    if (existing) {
      return res.status(400).json({ message: "Username or email already taken" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { ...(username && { username }), ...(email && { email }), ...(skills && { skills }) },
      { new: true }
    );

    res.json({
      user: {
        id: updated._id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        skills: updated.skills,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
