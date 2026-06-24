const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },

  status:    { type: String, enum: ["active", "ended"], default: "active" },
  startedAt: { type: Date, default: Date.now },
  endedAt:   { type: Date, default: null },
  duration:  { type: Number, default: 0 },   // stored in minutes
  summary:   { type: String, default: "" },  // AI generated summary saved here
});

module.exports = mongoose.model("Room", roomSchema);