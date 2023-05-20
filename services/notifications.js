const Notification = require("../models/Notification");

// new notification
const sendNotification = async ({ notification, notTitle, notId, notFrom }) => {
  try {
    const newNotification = new Notification({
      notId: notId,
      notTitle: notTitle,
      notification: notification,
      notFrom: notFrom,
    });
    await newNotification.save();
  } catch (err) {
  }
};

module.exports = { sendNotification };
