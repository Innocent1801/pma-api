
const Notification = require("../models/Notification");

// new notification
const sendNotification = async ({ notification, notTitle, notId, notFrom, role, user }) => {
  try {
    const newNotification = new Notification({
      notId: notId,
      notTitle: notTitle,
      notification: notification,
      notFrom: notFrom,
      role: role,
      user: user
    });
    await newNotification.save();
  } catch (err) {
  }
};

module.exports = { sendNotification };
