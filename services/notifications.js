const Notification = require("../models/Notification");

// new notification
const sendNotification = async ({ notification, notTitle, notId }) => {
  try {
    const newNotification = new Notification({
      notId: notId,
      notTitle: notTitle,
      notification: notification,
      // notificationFrom: req.body.url,
    });
    await newNotification.save();
  } catch (err) {
  }
};

module.exports = { sendNotification };
