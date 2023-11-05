const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    notId: { type: String },
    notTitle: { type: String },
    notFrom: { type: String },
    notification: { type: Object },
    url: { type: String },
    isRead: { type: Boolean, default: false },
    notificationFrom: { type: String },
    role: { type: String },
    user: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
