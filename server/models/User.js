const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: "",
    maxlength: 150,
  },
  avatarColor: {
    type: String,
    default: "#7ec8a4", // default indigo 
  },
  avatarUrl: { 
    type: String, 
    default: "" 
  },
  meetingsAttended: {
    type: Number,
    default: 0,
  },

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);