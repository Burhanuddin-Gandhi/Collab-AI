const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Message = require("../models/Message");
const protect = require("../middleware/auth.middleware");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let io;
const setIO = (socketIO) => { io = socketIO; };

// ── Helper: Generate summary via Gemini ──────────────────────────
const generateSummary = async (messages, roomTitle) => {
  try {
    // If no messages or less than 3 — not worth summarizing
    if (!messages || messages.length < 3) {
      return "No sufficient conversation to summarize.";
    }

    // Format messages into readable chat transcript
    const transcript = messages
      .map((m) => `${m.user?.name || "Unknown"}: ${m.text}`)
      .join("\n");

    const prompt = `
      You are a professional meeting assistant.
      Below is the chat transcript from a meeting titled "${roomTitle}".
      
      Summarize this meeting in the following format:
      
      **Meeting Overview**
      A 2-3 sentence overview of what was discussed.
      
      **Key Points**
      - List the main discussion points
      
      **Action Items**
      - List any tasks, decisions, or follow-ups mentioned
      
      **Conclusion**
      A single sentence closing summary.
      
      Chat Transcript:
      ${transcript}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (err) {
    console.error("Gemini summary error:", err);
    return "Summary could not be generated.";
  }
};

// POST /api/rooms — Create a room
router.post("/", protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = await Room.create({
      roomId,
      title,
      description: description || "",
      owner: req.user.id,
      participants: [req.user.id],
      status: "active",
      startedAt: new Date(),
    });

    res.status(201).json({ roomId: room.roomId, title: room.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// GET /api/rooms/history — Get meeting history for logged in user
router.get("/history", protect, async (req, res) => {
  try {
    const rooms = await Room.find({
      status: "ended",
      $or: [
        { owner: req.user.id },
        { participants: req.user.id }
      ]
    })
      .populate("owner", "name email")
      .sort({ endedAt: -1 });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// GET /api/rooms/:roomId — Get room metadata
router.get("/:roomId", protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("owner", "name email")
      .populate("participants", "name email");

    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

// GET /api/rooms/:roomId/summary/download — Download summary as PDF
router.get("/:roomId/summary/download", protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("owner", "name email");

    if (!room) return res.status(404).json({ error: "Room not found" });
    if (!room.summary) return res.status(404).json({ error: "No summary available" });

    // Generate PDF using pdfkit — npm install pdfkit
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="summary-${room.roomId}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // ── PDF Content ──
    // Title
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Meeting Summary", { align: "center" });

    doc.moveDown();

    // Meeting details
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Meeting Details", { underline: true });

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Title: ${room.title}`)
      .text(`Description: ${room.description || "N/A"}`)
      .text(`Host: ${room.owner?.name || "N/A"}`)
      .text(`Date: ${new Date(room.endedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric"
      })}`)
      .text(`Duration: ${room.duration} minutes`)
      .text(`Participants: ${room.participants?.length || 1}`);

    doc.moveDown();

    
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown();

    // Summary content
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("AI Generated Summary", { underline: true });

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(room.summary, { lineGap: 4 });

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("gray")
      .text(`Generated by CollabAI  •  ${new Date().toLocaleDateString()}`, {
        align: "center"
      });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// DELETE /api/rooms/:roomId/end — End meeting + generate summary
router.delete("/:roomId/end", protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) return res.status(404).json({ error: "Room not found" });

    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the owner can end the meeting" });
    }

    // Step 1 — Fetch all messages before deleting them
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 });

    // Step 2 — Generate Gemini summary from messages
    const summary = await generateSummary(messages, room.title);

    // Step 3 — Calculate duration
    const endedAt = new Date();
    const duration = Math.round((endedAt - room.startedAt) / 60000);

    // Step 4 — Update room with all meeting data
    await Room.findOneAndUpdate(
      { roomId: req.params.roomId },
      {
        status: "ended",
        endedAt,
        duration,
        summary,
      }
    );

    // Step 5 — Delete all messages
    await Message.deleteMany({ roomId: req.params.roomId });

    // Step 6 — Notify everyone in the room
    if (io) io.to(req.params.roomId).emit("meeting_ended");

    res.json({ message: "Meeting ended successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end meeting" });
  }
});

module.exports = { router, setIO };