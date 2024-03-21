const router = require("express").Router();
const Agency = require("../models/Agency");
const Models = require("../models/Models");
const Payment = require("../models/Payment");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./jwt");
const notification = require("../services/notifications");
const Ambssador = require("../models/Ambssador");
const { ambModel } = require("../config/ambModel");
const dotenv = require("dotenv");
const crypto = require("crypto");
const Client = require("../models/Client");
const Wallet = require("../models/Wallet");

dotenv.config();

// make payment
router.post("/make-payment", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    const currentTime = new Date();
    const futureDate = new Date(
      currentTime.setFullYear(currentTime.getFullYear() + 1)
    );

    if (user) {
      const newPayment = new Payment({
        sender: user.id,
        senderEmail: user.email,
        amount: req.body.amount,
        endDate: futureDate,
        desc:
          user.role === "model" ? "Model Subscription" : "Agency Subscription",
      });

      await newPayment.save();

      if (!user.isSubscribed) {
        const getPer = (newPayment.amount * 15) / 100;

        const amb = await Ambssador.findOne({ code: user.referral });

        if (amb) {
          await amb.updateOne({ $inc: { pendingModels: -1 } });
          await amb.updateOne({ $inc: { activeModels: +1 } });
          await amb.updateOne({ $inc: { totalEarning: +getPer } });
          await amb.updateOne({ $inc: { availableBal: +getPer } });
        }

        await user.updateOne({ $set: { isSubscribed: true } });
      }

      res.status(200).json("Payment successful");

      ambModel(
        (ambName = amb.firstName),
        (ambEmail = amb.email),
        (availableBal = amb.availableBal + getPer),
        (totalEarning = amb.totalEarning + getPer)
      );

      await notification.sendNotification({
        notification: {},
        notTitle:
          user.firstName +
          " " +
          user.lastName +
          " just made their subscription payment, kindly review.",
        notId: "639dc776aafcd38d67b1e2f7",
        notFrom: user.id,
        role: user.role,
        user: user,
      });
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

router.post("/make-payment/v2", async (req, res) => {
  const secret = process.env.PAYSTACK_LIVE_SECRET;

  const payload = req.body;

  // Extract event type and data
  const eventType = payload?.event;
  const transactionDataAmount = payload?.data?.amount / 100;

  const customer = payload?.data?.customer;
  const customerEmail = customer?.email;

  try {
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash == req.headers["x-paystack-signature"]) {
      if (eventType === "charge.success") {
        const user = await Users.findOne({ email: customerEmail });
        const client = await Client.findOne({ uuid: user.id });

        const currentTime = new Date();
        const futureDate = new Date(
          currentTime.setFullYear(currentTime.getFullYear() + 1)
        );

        if (user.role === "model" || user.role === "agency") {
          const newPayment = new Payment({
            sender: user.id,
            senderEmail: user.email,
            amount: transactionDataAmount,
            endDate: futureDate,
            desc:
              user.role === "model"
                ? "Model Subscription"
                : "Agency Subscription",
          });

          await newPayment.save();

          if (!user.isSubscribed) {
            const getPer = (newPayment.amount * 15) / 100;

            const amb = await Ambssador.findOne({ code: user.referral });

            if (amb) {
              await amb.updateOne({ $inc: { pendingModels: -1 } });
              await amb.updateOne({ $inc: { activeModels: +1 } });
              await amb.updateOne({ $inc: { totalEarning: +getPer } });
              await amb.updateOne({ $inc: { availableBal: +getPer } });
            }

            await user.updateOne({ $set: { isSubscribed: true } });
          }

          // res.status(200).json("Payment successful");
          res.sendStatus(200);

          ambModel(
            (ambName = amb.firstName),
            (ambEmail = amb.email),
            (availableBal = amb.availableBal + getPer),
            (totalEarning = amb.totalEarning + getPer)
          );

          await notification.sendNotification({
            notification: {},
            notTitle:
              user.firstName +
              " " +
              user.lastName +
              " just made their subscription payment, kindly review.",
            notId: "639dc776aafcd38d67b1e2f7",
            notFrom: user.id,
            role: user.role,
            user: user,
          });
        } else if (user.role === "client" && client) {
          const newPayment = new Wallet({
            sender: client.id,
            senderEmail: client.email,
            amount: transactionDataAmount,
            desc: "Wallet funding",
          });

          await newPayment.save();
          await client.updateOne({ $inc: { wallet: +transactionDataAmount } });
          await client.updateOne({ $inc: { total: +transactionDataAmount } });

          // res.status(200).json("Payment successful");
          res.sendStatus(200);
        } else {
          res.status(400).json("Oops! An error occured");
        }
      }
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
          endDate: req.body.endDate,
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
      const { page } = req.query;
      const pageSize = 10; // Number of items to return per page

      const payment = await Payment.find({ sender: user.id })
        .sort({ createdAt: -1 }) // Sort in descending order
        .select()
        .skip((parseInt(page) - 1) * pageSize)
        .limit(pageSize);

      const totalRecords = await Payment.countDocuments();

      const totalPages = Math.ceil(totalRecords / pageSize);
      const currentPage = parseInt(page) || 1;

      const response = {
        totalPages,
        currentPage,
        length: totalRecords,
        payment: payment,
      };

      res.status(200).json(response);
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
    // filter models
    const { payment, page } = req.query;
    const keys = ["senderEmail"];
    const pageSize = 10; // Number of items to return per page

    const search = (data) => {
      return data?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(payment))
      );
    };

    const payments = await Payment.find()
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const totalRecords = await Payment.countDocuments();

    const totalPages = Math.ceil(totalRecords / pageSize);
    const currentPage = parseInt(page) || 1;

    let result = [];
    if (payment) {
      result = search(payments);
    } else {
      result = payments;
    }

    const response = {
      totalPages,
      currentPage,
      length: totalRecords,
      payments: payments,
    };

    if (response.length > 0) {
      res.status(200).json(response);
    } else {
      res.status(404).json("Not Found");
    }
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
