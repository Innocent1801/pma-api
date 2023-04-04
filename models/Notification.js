const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    notId: { type: String },
    notTitle: { type: String },
    notification: { type: String },
    url: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
