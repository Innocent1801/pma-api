const router = require("express").Router();
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const Payment = require("../models/Payment");
const Users = require("../models/Users");
const { verifyTokenAndAdmin } = require("./jwt");
const Client = require("../models/Client");
const Models = require("../models/Models");
const Agency = require("../models/Agency");

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

// add a user
router.post("/add-user", verifyTokenAndAdmin, async (req, res) => {
  try {
    // encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //   check if user exist
    const findUser = await Users.findOne({ email: req.body.email });

    if (!findUser) {
      const newUser = new Users({
        isVerified: true,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role,
        mobileNo: req.body.mobileNo,
        referral: req.body.referral,
      });
      await newUser.save();

  
      const { password, ...others } = newUser._doc;

      switch (newUser.role) {
        case "agency":
          const newAgency = new Agency({
            isVerified: true,
            uuid: newUser._id,
            email: newUser.email,
            fullName: newUser.firstName + " " + newUser.lastName,
          });
          await newAgency.save();
          break;

        case "model":
          const newModel = new Models({
            isVerified: true,
            uuid: newUser._id,
            email: newUser.email,
            fullName: newUser.firstName + " " + newUser.lastName,
          });
          await newModel.save();
          break;

        case "client":
          const newClient = new Client({
            isVerified: true,
            uuid: newUser._id,
            email: newUser.email,
          });
          await newClient.save();
          break;

        default:
          await newUser.save();
          break;
      }
      res.status(200).json({ ...others });
    } else {
      res.status(400).json("User already exists!");
    }
  } catch (err) {
    console.log(err)
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

// delete a agency
router.delete("/agency/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await Agency.findById(req.params.id);
     if (user) {
      await user.delete();
      await Users.findOneAndDelete({ _id: user.uuid });
      res.status(200).json("User deleted!");
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete a model
router.delete("/model/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await Models.findById(req.params.id);
     if (user) {
      await user.delete();
      await Users.findOneAndDelete({ _id: user.uuid });
      res.status(200).json("User deleted!");
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete a client
router.delete("/client/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await Client.findById(req.params.id);
     if (user) {
      await user.delete();
      await Users.findOneAndDelete({ _id: user.uuid });
      res.status(200).json("User deleted!");
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
