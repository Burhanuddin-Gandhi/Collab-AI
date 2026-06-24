const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const protect = require("../middleware/auth.middleware");

// Storage config — save to uploads/ folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

// Only allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDFs are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// POST /api/upload
router.post("/", protect, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const messageType = req.file.mimetype === "application/pdf" ? "pdf" : "image";

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      messageType,
    });

  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;