const router = require("express").Router();
const Notification = require("../models/Notification");

// new notification
router.post("/", async (req, res) => {
  try {
    const newNotification = new Notification({
        notId: req.body.notId,
        notTitle: req.body.notTitle,
        notification: req.body.notification,
        url: req.body.url,
    });
    await newNotification.save();
    res.status(200).json(newNotification);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get notifications
router.get("/:id", async (req, res) => {
  try {
    const notifications = await Notification.find({ notId: req.params.id });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get single notification
router.get("/single-not/:id", async (req, res) => {
  try {
    const notifications = await Notification.findById(req.params.id);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
