const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ── Helper: pick a random avatar color on register ──
const AVATAR_COLORS = [
  "#7ec8a4", "#5aaa84", "#ec4899",
  "#14b8a6", "#f59e0b", "#10b981",
  "#3b82f6", "#f43f5e"
];
const randomColor = () =>
  AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

// ── Register ────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatarColor: randomColor(), // assign random color on register
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarColor: user.avatarColor,
        meetingsAttended: user.meetingsAttended,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Login ────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarColor: user.avatarColor,
        meetingsAttended: user.meetingsAttended,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Get Profile ──────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Update Profile ───────────────────────────────────
exports.updateProfile = async (req, res) => {
  const { name, bio } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      { new: true } // return updated document
    ).select("-password");

    // Update localStorage on frontend after this returns
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarColor: user.avatarColor,
        avatarUrl:user.avatarUrl,
        meetingsAttended: user.meetingsAttended,
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};