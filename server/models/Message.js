const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  text: { type: String,  },
  user: {
    id: String,
    name: String,
  },
  
  //to store the text or files that user sends in the chat 
  messageType: {
    type: String,
    enum: ["text", "image", "pdf"],
    default: "text",
  },

  fileUrl: { type: String, default: "" },
  fileName: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);