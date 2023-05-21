const router = require("express").Router();
const Agency = require("../models/Agency");
const Models = require("../models/Models");
const Payment = require("../models/Payment");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./jwt");
const notification = require("../services/notifications");

// make payment
router.post("/make-payment", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const newPayment = new Payment({
        sender: user.id,
        senderEmail: user.email,
        amount: req.body.amount,
        desc:
          user.role === "model" ? "Model Subscription" : "Agency Subscription",
      });
      await newPayment.save();
      await user.updateOne({ $set: { isSubscribed: true } });
      res.status(200).json("Payment successful");
      await notification.sendNotification({
        notification: {},
        notTitle:
          user.firstName +
          " " +
          user.lastName +
          " just made their subscription payment, kindly review.",
        notId: "639dc776aafcd38d67b1e2f7",
        notFrom: user.id,
      });
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// admin make payment for a user
router.post(
  "/admin/make-payment/:id",
  verifyTokenAndAdmin,
  async (req, res) => {
    try {
      const user = await Users.findById(req.params.id);

      if (user) {
        const newPayment = new Payment({
          sender: user.id,
          senderEmail: user.email,
          amount: req.body.amount,
          desc:
            user.role === "model"
              ? "Model Subscription"
              : "Agency Subscription",
        });
        await newPayment.save();
        await user.updateOne({ $set: { isSubscribed: true } });
        res.status(200).json("Payment successfuly generated");
      } else {
        res.status(400).json("Oops! An error occured");
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

// get payments made by a user
router.get("/payments/user", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (user) {
      const payment = await Payment.find({ sender: user.id });
      res.status(200).json(payment);
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all payments
router.get("/payments", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const payment = await Payment.find();
    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get single payment
router.get("/payment/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// approve payment by an admin
router.put("/approve/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (payment) {
      const user = await Users.findOne({ _id: payment.sender });
      if (user.role === "model") {
        const model = await Models.findOne({ uuid: user._id });
        await user.updateOne({ $set: { isVerified: true } });
        await model.updateOne({ $set: { isVerified: true } });
        await payment.updateOne({ $set: { isApproved: true } });
        res.status(200).json("Payment approved");
      } else if (user.role === "agency") {
        const agency = await Agency.findOne({ uuid: user._id });
        await user.updateOne({ $set: { isVerified: true } });
        await agency.updateOne({ $set: { isVerified: true } });
        await payment.updateOne({ $set: { isApproved: true } });
        res.status(200).json("Payment approved");
      }
    } else {
      res.status(404).json("Payment invoice cannot be found.");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete payment by an admin
router.delete("/delete/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (payment) {
      res.status(200).json("Payment invoice deleted.");
    } else {
      res.status(404).json("Payment invoice cannot be found.");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
