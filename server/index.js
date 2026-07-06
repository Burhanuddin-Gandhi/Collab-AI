require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const User = require("./models/User");

const app = express();

// Connect DB
connectDB();

//To Upload Folders or Images 
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(cors({
  origin: "https://collab-chat-six.vercel.app/",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/upload", require("./routes/upload"));

// ── HTTP Rate Limiters ───────────────────────

// Global limiter — all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 100,      // max 100 requests per IP
  message: { toast: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter — stricter for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,      // max 10 attempts per IP
  message: { toast: "Too many auth attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Gemini AI suggestion limiter — per user, kept the limit as 3 messages per 60 secs 

const aiLimiter = rateLimit({

  windowMs: 60 * 1000,// 60 secs
  max: 3,// 3 messages max
  message: { toast: "AI suggestion limit reached, please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use token if available, otherwise fall back to IP safely
    return req.headers.authorization || ipKeyGenerator(req);
  },
});

// Apply global limiter to all routes
app.use(globalLimiter);

app.get("/", (req, res) => {
  res.send("Collab AI Server Running");
});

// Routes — auth gets stricter limiter
app.use("/api/auth", authLimiter, require("./routes/auth.routes"));
app.use("/api/ai", aiLimiter, require("./routes/ai")); // attach to AI routes when we build them in Step 4

// Room routes
const { router: roomRouter, setIO } = require("./routes/room");
app.use("/api/rooms", roomRouter);

// ── Server + Socket.io ──────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://collab-chat-six.vercel.app/",
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
});

setIO(io);

// ── Socket.io Chat Rate Limiter ─────────────────────────────────
// In-memory store: tracks message timestamps per user
const messageLimiter = new Map();

const isRateLimited = (userId) => {
  const now = Date.now();
  const windowMs = 10 * 1000; // 10 second window to limit messages 
  const maxMessages = 5;       // max 5 messages per 10 seconds

  // Get existing timestamps for this user
  const timestamps = messageLimiter.get(userId) || [];

  // Filter out timestamps outside the window
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxMessages) {
    messageLimiter.set(userId, recent);
    return true; // rate limited
  }

  // Add current timestamp and allow
  recent.push(now);
  messageLimiter.set(userId, recent);
  return false; 
};

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of messageLimiter.entries()) {
    const recent = timestamps.filter((t) => now - t < 10000);
    if (recent.length === 0) {
      messageLimiter.delete(userId);
    } else {
      messageLimiter.set(userId, recent);
    }
  }
}, 5 * 60 * 1000);

// ── Socket.io Events ────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", async ({ roomId, user }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.user = user;
    
    await User.findByIdAndUpdate(user.id, { $inc: { meetingsAttended: 1 } });
    
    const history = await Message.find({ roomId }).sort({ createdAt: 1 });
    socket.emit("room_history", history);

    socket.to(roomId).emit("user_joined", { user });

    console.log(`${user?.name} joined room ${roomId}`);
  });

  socket.on("typing", ({ roomId, user, isTyping }) => {
    socket.to(roomId).emit("typing", { user, isTyping });
  });

  socket.on("send_message", async ({ roomId, message, user, fileUrl, fileName, messageType }) => {
    // Check rate limit before processing
    const userId = user?.id || socket.id;

    if (isRateLimited(userId)) {
      // Only notify the sender they are rate limited
      socket.emit("rate_limited", {
        message: "You are sending messages too fast. Please slow down.",
      });
      return; // stop — don't save or broadcast
    }

    await Message.create({
    roomId,
    text: message || "",
    user,
    fileUrl: fileUrl || "",
    fileName: fileName || "",
    messageType: messageType || "text",
    });

    io.to(roomId).emit("receive_message", {
    text: message || "",
    user,
    fileUrl: fileUrl || "",
    fileName: fileName || "",
    messageType: messageType || "text",
    timestamp: new Date().toISOString(),
  });
    
  });
 
  socket.on("user_status_change", ({ roomId, status }) => {
    socket.to(roomId).emit("user_status", {
      userId: socket.user?.id,
      status,
    });
  });

  socket.on("disconnect", () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("user_left", { user: socket.user });
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});