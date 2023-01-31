const router = require("express").Router();
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const Payment = require("../models/Payment");
const Users = require("../models/Users");
const { verifyTokenAndAdmin } = require("./jwt");

// edit
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;
  }

  try {
    const user = await Admin.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// edit a user
router.put("/:id/edit-user", verifyTokenAndAdmin, async (req, res) => {
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;
  }

  try {
    const user = await Users.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all payments made
router.get("/payment/all", verifyTokenAndAdmin, async (req, res) => {
  try {
    const payment = await Payment.find();
    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get single payment
router.get("/payment/:id", verifyTokenAndAdmin, async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  const user = await Users.findOne({ _id: payment?.sender });

  const { password, isVerified, createdAt, updatedAt, _id, ...others } =
    user._doc;

  try {
    if (payment) {
      res.status(200).json({ ...payment._doc, user: others });
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
