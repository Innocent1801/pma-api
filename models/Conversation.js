const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    sender: { type: String },
    receiver: { type: String },
    isSenderRead: { type: Boolean, default: false },
    isReceiverRead: { type: Boolean, default: false },
    senderMessages: { type: Number, default: 0 },
    receiverMessages: { type: Number, default: 0 },
    isClosed: { type: Boolean, default: false },
    lastMessage: { type: String },
    lastMessageTime: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
